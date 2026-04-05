#!/usr/bin/env node
/**
 * Reset a user's business record so they go through onboarding again.
 * Usage: node scripts/admin/reset-user.mjs [email]
 * If no email given, lists all businesses and prompts.
 */
import 'dotenv/config';
import { getDb } from '../../server/db.js';

const sql = getDb();
const targetEmail = process.argv[2];

const allBiz = await sql`SELECT id, name, owner_email, auth0_id, created_at FROM businesses ORDER BY id`;

if (!allBiz.length) {
  console.log('No businesses in the database.');
  process.exit(0);
}

console.log('All businesses:');
for (const b of allBiz) {
  console.log(`  [${b.id}] "${b.name}" email=${b.owner_email || 'null'} auth0=${b.auth0_id || 'null'} created=${b.created_at}`);
}

let toDelete = [];

if (targetEmail) {
  toDelete = allBiz.filter(b =>
    b.owner_email === targetEmail ||
    (b.owner_email && b.owner_email.toLowerCase().includes(targetEmail.toLowerCase())) ||
    (b.auth0_id && b.auth0_id.toLowerCase().includes(targetEmail.toLowerCase()))
  );
} else {
  // Delete all auth0-linked businesses (keeps legacy demo records)
  toDelete = allBiz.filter(b => b.auth0_id);
}

if (!toDelete.length) {
  console.log(`\nNo matching businesses found for "${targetEmail || 'auth0 users'}".`);
  process.exit(0);
}

for (const b of toDelete) {
  console.log(`\nDeleting business id=${b.id} "${b.name}" (${b.owner_email || 'no email'})...`);
  // CASCADE deletes all related workspace records
  await sql`DELETE FROM businesses WHERE id = ${b.id}`;
  console.log('  ✓ Deleted (cascade: contracts, quotes, receipts, compliance, growth, files, plaid_items)');
}

const remaining = await sql`SELECT count(*) as c FROM businesses`;
console.log(`\nDone. ${remaining[0].c} businesses remaining.`);
process.exit(0);
