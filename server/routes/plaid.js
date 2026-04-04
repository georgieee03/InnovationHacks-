import { Router } from 'express';
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';
import { getDb } from '../db.js';

const router = Router();

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

// Create link token for Plaid Link UI
router.post('/create-link-token', async (req, res) => {
  try {
    const { user_id } = req.body;
    const client = getPlaidClient();
    const response = await client.linkTokenCreate({
      user: { client_user_id: user_id || 'default-user' },
      client_name: 'SafeGuard',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
    });
    res.json({ link_token: response.data.link_token });
  } catch (err) {
    console.error('Link token error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to create link token' });
  }
});

// Exchange public token for access token
router.post('/exchange-token', async (req, res) => {
  try {
    const { public_token, user_id, institution_name } = req.body;
    const client = getPlaidClient();
    const response = await client.itemPublicTokenExchange({ public_token });
    const { access_token, item_id } = response.data;

    const sql = getDb();
    await sql`
      INSERT INTO plaid_items (user_id, access_token, item_id, institution_name)
      VALUES (${user_id || 'default-user'}, ${access_token}, ${item_id}, ${institution_name || null})
    `;

    res.json({ success: true, item_id });
  } catch (err) {
    console.error('Token exchange error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to exchange token' });
  }
});

// Fetch accounts from Plaid
router.get('/accounts', async (req, res) => {
  try {
    const { user_id } = req.query;
    const sql = getDb();
    const items = await sql`
      SELECT access_token, institution_name FROM plaid_items
      WHERE user_id = ${user_id || 'default-user'}
      ORDER BY created_at DESC
    `;

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
    const items = await sql`
      SELECT access_token FROM plaid_items
      WHERE user_id = ${user_id || 'default-user'}
      ORDER BY created_at DESC
    `;

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
