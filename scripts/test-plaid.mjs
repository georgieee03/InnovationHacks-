import 'dotenv/config';
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';

const { PLAID_CLIENT_ID, PLAID_SECRET, PLAID_ENV = 'sandbox' } = process.env;

if (!PLAID_CLIENT_ID || !PLAID_SECRET) {
  console.error('Missing PLAID_CLIENT_ID or PLAID_SECRET in .env');
  process.exit(1);
}

const plaidClient = new PlaidApi(
  new Configuration({
    basePath: PlaidEnvironments[PLAID_ENV],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
        'PLAID-SECRET': PLAID_SECRET,
      },
    },
  })
);

async function test() {
  console.log(`\n--- Plaid Sandbox Test (env: ${PLAID_ENV}) ---\n`);

  // 1. Create a link token
  console.log('1. Creating link token...');
  const linkRes = await plaidClient.linkTokenCreate({
    user: { client_user_id: 'test-user-1' },
    client_name: 'SafeGuard',
    products: [Products.Transactions],
    country_codes: [CountryCode.Us],
    language: 'en',
  });
  console.log('   Link token created:', linkRes.data.link_token.substring(0, 30) + '...');

  // 2. Create a sandbox public token (simulates a user connecting a bank)
  console.log('\n2. Creating sandbox public token...');
  const sandboxRes = await plaidClient.sandboxPublicTokenCreate({
    institution_id: 'ins_109508', // First Platypus Bank (sandbox)
    initial_products: [Products.Transactions],
  });
  const publicToken = sandboxRes.data.public_token;
  console.log('   Public token:', publicToken.substring(0, 30) + '...');

  // 3. Exchange for access token
  console.log('\n3. Exchanging for access token...');
  const exchangeRes = await plaidClient.itemPublicTokenExchange({ public_token: publicToken });
  const accessToken = exchangeRes.data.access_token;
  console.log('   Access token:', accessToken.substring(0, 30) + '...');

  // 4. Fetch accounts
  console.log('\n4. Fetching accounts...');
  const accountsRes = await plaidClient.accountsGet({ access_token: accessToken });
  const accounts = accountsRes.data.accounts;
  console.log(`   Found ${accounts.length} accounts:`);
  accounts.forEach((a) => {
    console.log(`   - ${a.name} (${a.type}/${a.subtype}): $${a.balances.current}`);
  });

  // 5. Fetch transactions (with retry — sandbox needs a moment)
  console.log('\n5. Fetching transactions...');
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  let txns = [];
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const txnRes = await plaidClient.transactionsGet({
        access_token: accessToken,
        start_date: thirtyDaysAgo.toISOString().split('T')[0],
        end_date: now.toISOString().split('T')[0],
      });
      txns = txnRes.data.transactions;
      break;
    } catch (e) {
      if (e.response?.data?.error_code === 'PRODUCT_NOT_READY' && attempt < 3) {
        console.log(`   Transactions not ready yet, retrying in 5s... (attempt ${attempt}/3)`);
        await new Promise((r) => setTimeout(r, 5000));
      } else {
        throw e;
      }
    }
  }
  console.log(`   Found ${txns.length} transactions (last 30 days)`);
  txns.slice(0, 5).forEach((t) => {
    console.log(`   - ${t.date} | ${t.name} | $${t.amount} | ${t.category?.join(', ')}`);
  });

  console.log('\n--- All tests passed! Plaid is connected. ---\n');
}

test().catch((err) => {
  console.error('\nPlaid test failed:', err.response?.data || err.message);
  process.exit(1);
});
