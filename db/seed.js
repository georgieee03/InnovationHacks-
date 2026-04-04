import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required to seed the database.');
}

const sql = neon(process.env.DATABASE_URL);

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, relativePath), 'utf8'));
}

function splitSqlStatements(schema) {
  return schema
    .split(/;\s*(?:\r?\n)+/)
    .map((statement) => statement.trim())
    .filter(Boolean);
}

async function ensureDemoBusiness(business) {
  const existing = await sql`
    SELECT id
    FROM businesses
    WHERE name = ${business.name} AND zip = ${business.zip}
    ORDER BY id ASC
    LIMIT 1
  `;

  if (existing[0]) {
    await sql`
      UPDATE businesses
      SET
        type = ${business.type},
        city = ${business.city},
        state = ${business.state},
        monthly_revenue_estimate = ${business.monthlyRevenueEstimate},
        employees = ${business.employees}
      WHERE id = ${existing[0].id}
    `;
    return existing[0].id;
  }

  const inserted = await sql`
    INSERT INTO businesses (name, type, zip, city, state, monthly_revenue_estimate, employees)
    VALUES (
      ${business.name},
      ${business.type},
      ${business.zip},
      ${business.city},
      ${business.state},
      ${business.monthlyRevenueEstimate},
      ${business.employees}
    )
    RETURNING id
  `;

  return inserted[0].id;
}

async function seed() {
  console.log('Seeding database...');

  const transactionsData = readJson('../src/data/transactions.json');
  const recommendations = readJson('../src/data/coverageRecommendations.json');
  const riskFactors = readJson('../src/data/riskFactors.json');
  const businessTypes = readJson('../src/data/businessTypes.json');
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

  for (const statement of splitSqlStatements(schema)) {
    await sql.query(statement);
  }
  console.log('Tables created.');

  for (const businessType of businessTypes) {
    await sql`
      INSERT INTO business_types (id, label, icon)
      VALUES (${businessType.id}, ${businessType.label}, ${businessType.icon})
      ON CONFLICT (id) DO UPDATE SET
        label = EXCLUDED.label,
        icon = EXCLUDED.icon
    `;
  }
  console.log('Business types seeded.');

  for (const [zip, data] of Object.entries(riskFactors)) {
    await sql`
      INSERT INTO risk_factors (zip, city, state, risks, emergency_fund_multiplier)
      VALUES (
        ${zip},
        ${data.city},
        ${data.state},
        ${JSON.stringify(data.risks)},
        ${data.emergencyFundMultiplier}
      )
      ON CONFLICT (zip) DO UPDATE SET
        city = EXCLUDED.city,
        state = EXCLUDED.state,
        risks = EXCLUDED.risks,
        emergency_fund_multiplier = EXCLUDED.emergency_fund_multiplier
    `;
  }
  console.log('Risk factors seeded.');

  for (const [businessType, data] of Object.entries(recommendations)) {
    for (const policy of data.recommendedPolicies) {
      await sql`
        INSERT INTO coverage_recommendations (
          id,
          business_type,
          name,
          description,
          recommended_limit,
          estimated_premium_low,
          estimated_premium_high,
          priority,
          why_it_matters,
          location_dependent,
          trigger_risk_factors
        )
        VALUES (
          ${policy.id},
          ${businessType},
          ${policy.name},
          ${policy.description},
          ${policy.recommendedLimit},
          ${policy.estimatedAnnualPremium?.low ?? null},
          ${policy.estimatedAnnualPremium?.high ?? null},
          ${policy.priority},
          ${policy.whyItMatters},
          ${policy.locationDependent || false},
          ${policy.triggerRiskFactors || null}
        )
        ON CONFLICT (id, business_type) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          recommended_limit = EXCLUDED.recommended_limit,
          estimated_premium_low = EXCLUDED.estimated_premium_low,
          estimated_premium_high = EXCLUDED.estimated_premium_high,
          priority = EXCLUDED.priority,
          why_it_matters = EXCLUDED.why_it_matters,
          location_dependent = EXCLUDED.location_dependent,
          trigger_risk_factors = EXCLUDED.trigger_risk_factors
      `;
    }
  }
  console.log('Coverage recommendations seeded.');

  const businessId = await ensureDemoBusiness(transactionsData.business);
  console.log(`Demo business ready with ID: ${businessId}`);

  for (const account of transactionsData.accounts) {
    await sql`
      INSERT INTO accounts (id, business_id, name, type, balance, institution)
      VALUES (
        ${account.id},
        ${businessId},
        ${account.name},
        ${account.type},
        ${account.balance},
        ${account.institution}
      )
      ON CONFLICT (id) DO UPDATE SET
        business_id = EXCLUDED.business_id,
        name = EXCLUDED.name,
        type = EXCLUDED.type,
        balance = EXCLUDED.balance,
        institution = EXCLUDED.institution
    `;
  }
  console.log('Accounts seeded.');

  for (const transaction of transactionsData.transactions) {
    await sql`
      INSERT INTO transactions (id, business_id, account_id, date, description, amount, category, type)
      VALUES (
        ${transaction.id},
        ${businessId},
        ${transaction.account || null},
        ${transaction.date},
        ${transaction.description},
        ${transaction.amount},
        ${transaction.category},
        ${transaction.type}
      )
      ON CONFLICT (id) DO NOTHING
    `;
  }
  console.log(`${transactionsData.transactions.length} transactions seeded.`);

  console.log('Seed complete.');
}

seed().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
