#!/usr/bin/env node
/** Wipe ALL data from the database. */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// Delete children first, then parents
const deletes = [
  sql`DELETE FROM growth_actions WHERE true`,
  sql`DELETE FROM funding_opportunities WHERE true`,
  sql`DELETE FROM compliance_items WHERE true`,
  sql`DELETE FROM receipts WHERE true`,
  sql`DELETE FROM quotes WHERE true`,
  sql`DELETE FROM contracts WHERE true`,
  sql`DELETE FROM uploaded_files WHERE true`,
  sql`DELETE FROM plaid_items WHERE true`,
  sql`DELETE FROM gap_analyses WHERE true`,
  sql`DELETE FROM policy_analyses WHERE true`,
  sql`DELETE FROM transactions WHERE true`,
  sql`DELETE FROM accounts WHERE true`,
];

// Run child deletes in parallel
const results = await Promise.allSettled(deletes);
results.forEach((r, i) => {
  if (r.status === 'rejected') console.log(`  skip: ${r.reason?.message?.slice(0, 50)}`);
});

// Try newer tables
for (const q of [
  sql`DELETE FROM bank_transactions WHERE true`,
  sql`DELETE FROM plaid_connections WHERE true`,
  sql`DELETE FROM tax_summaries WHERE true`,
  sql`DELETE FROM profit_and_loss WHERE true`,
  sql`DELETE FROM expense_categories WHERE true`,
]) {
  await q.catch(() => {});
}

// Now delete businesses
await sql`DELETE FROM businesses WHERE true`;
console.log('✓ All tables cleared');

const remaining = await sql`SELECT count(*) as c FROM businesses`;
console.log(`Businesses remaining: ${remaining[0].c}`);
process.exit(0);
