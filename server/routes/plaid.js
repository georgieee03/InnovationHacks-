import { Router } from 'express';
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';
import { getPlaidUserId } from '../auth.js';
import { getDb } from '../db.js';

const router = Router();
const LEGACY_PLAID_USER_ID = 'default-user';

async function ensurePlaidItemsTable(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS plaid_items (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      access_token TEXT NOT NULL,
      item_id TEXT NOT NULL,
      institution_name TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
}

function getPlaidClient() {
  return new PlaidApi(
    new Configuration({
      basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
          'PLAID-SECRET': process.env.PLAID_SECRET,
        },
      },
    })
  );
}

function resolvePlaidUserId(req, providedUserId) {
  const sessionUserId = getPlaidUserId(req);

  if (sessionUserId && sessionUserId !== LEGACY_PLAID_USER_ID) {
    return sessionUserId;
  }

  return providedUserId || LEGACY_PLAID_USER_ID;
}

async function findPlaidItems(sql, userId, fields = 'access_token') {
  return sql.unsafe(
    `
      SELECT ${fields}
      FROM plaid_items
      WHERE user_id = $1
      ORDER BY created_at DESC
    `,
    [userId]
  );
}

async function getPlaidItemsForRequest(sql, req, providedUserId, fields) {
  const resolvedUserId = resolvePlaidUserId(req, providedUserId);
  let items = await findPlaidItems(sql, resolvedUserId, fields);

  if (items.length || resolvedUserId === LEGACY_PLAID_USER_ID) {
    return items;
  }

  const legacyItems = await findPlaidItems(sql, LEGACY_PLAID_USER_ID, fields);

  if (!legacyItems.length) {
    return items;
  }

  await sql`
    UPDATE plaid_items
    SET user_id = ${resolvedUserId}
    WHERE user_id = ${LEGACY_PLAID_USER_ID}
  `;

  console.warn(`Migrated ${legacyItems.length} legacy Plaid item(s) to ${resolvedUserId}.`);
  return legacyItems;
}

// Create link token for Plaid Link UI
router.post('/create-link-token', async (req, res) => {
  try {
    const { user_id, redirect_uri } = req.body;
    const resolvedUserId = resolvePlaidUserId(req, user_id);
    const client = getPlaidClient();
    let redirectUri = String(
      process.env.PLAID_REDIRECT_URI
      || redirect_uri
      || (req.get('origin') ? `${req.get('origin').replace(/\/$/, '')}/plaid-oauth.html` : '')
    ).trim();
    const baseRequest = {
      user: { client_user_id: resolvedUserId },
      client_name: 'SafeGuard',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
    };
    let response;

    try {
      response = await client.linkTokenCreate({
        ...baseRequest,
        ...(redirectUri ? { redirect_uri: redirectUri } : {}),
      });
    } catch (err) {
      const plaidError = JSON.stringify(err.response?.data || err.message || '');
      const canRetryWithoutRedirect = redirectUri && /redirect_uri|redirect uri/i.test(plaidError);

      if (!canRetryWithoutRedirect) {
        throw err;
      }

      console.warn('Plaid redirect URI was rejected, retrying link token creation without redirect URI.');
      redirectUri = '';
      response = await client.linkTokenCreate(baseRequest);
    }

    res.json({
      link_token: response.data.link_token,
      expiration: response.data.expiration ?? null,
      redirect_uri: redirectUri || null,
    });
  } catch (err) {
    console.error('Link token error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to create link token' });
  }
});

// Exchange public token for access token
router.post('/exchange-token', async (req, res) => {
  try {
    const { public_token, user_id, institution_name } = req.body;
    const resolvedUserId = resolvePlaidUserId(req, user_id);

    if (!public_token) {
      return res.status(400).json({ error: 'Missing public token' });
    }

    const client = getPlaidClient();
    const response = await client.itemPublicTokenExchange({ public_token });
    const { access_token, item_id } = response.data;

    const sql = getDb();
    await ensurePlaidItemsTable(sql);
    await sql`
      INSERT INTO plaid_items (user_id, access_token, item_id, institution_name)
      VALUES (${resolvedUserId}, ${access_token}, ${item_id}, ${institution_name || null})
    `;

    res.json({ success: true, item_id });
  } catch (err) {
    const plaidError = err.response?.data || null;
    const message =
      plaidError?.error_message ||
      plaidError?.display_message ||
      err.message ||
      'Failed to exchange token';

    console.error('Token exchange error:', plaidError || message);
    res.status(500).json({ error: message });
  }
});

// Fetch accounts from Plaid
router.get('/accounts', async (req, res) => {
  try {
    const { user_id } = req.query;
    const sql = getDb();
    const items = await getPlaidItemsForRequest(sql, req, user_id, 'access_token, institution_name');

    if (!items.length) {
      return res.json({ accounts: [], connected: false });
    }

    const client = getPlaidClient();
    const allAccounts = [];

    for (const item of items) {
      const acctRes = await client.accountsGet({ access_token: item.access_token });
      for (const a of acctRes.data.accounts) {
        allAccounts.push({
          id: a.account_id,
          name: a.name,
          type: a.subtype || a.type,
          balance: a.balances.current || 0,
          institution: item.institution_name || 'Connected Bank',
        });
      }
    }

    res.json({ accounts: allAccounts, connected: true });
  } catch (err) {
    console.error('Accounts error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// Fetch transactions from Plaid
router.get('/transactions', async (req, res) => {
  try {
    const { user_id, days = 90 } = req.query;
    const sql = getDb();
    const items = await getPlaidItemsForRequest(sql, req, user_id, 'access_token');

    if (!items.length) {
      return res.json({ transactions: [] });
    }

    const client = getPlaidClient();
    const now = new Date();
    const start = new Date(now.getTime() - Number(days) * 24 * 60 * 60 * 1000);
    const allTxns = [];

    for (const item of items) {
      try {
        const txnRes = await client.transactionsGet({
          access_token: item.access_token,
          start_date: start.toISOString().split('T')[0],
          end_date: now.toISOString().split('T')[0],
        });
        for (const t of txnRes.data.transactions) {
          allTxns.push({
            id: t.transaction_id,
            date: t.date,
            description: t.name,
            amount: t.amount,
            category: t.personal_finance_category?.primary || t.category?.[0] || 'Other',
            type: t.amount < 0 ? 'income' : 'expense',
            account: t.account_id,
          });
        }
      } catch (e) {
        if (e.response?.data?.error_code === 'PRODUCT_NOT_READY') {
          console.log('Transactions not ready yet for an item, skipping...');
        } else {
          throw e;
        }
      }
    }

    res.json({ transactions: allTxns });
  } catch (err) {
    console.error('Transactions error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

export default router;
