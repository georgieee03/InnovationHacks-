import { getDb } from './db.js';

let schemaPromise;

const businessTypeSeed = [
  ['contractor', 'Contractor', 'Hammer'],
  ['restaurant', 'Restaurant', 'UtensilsCrossed'],
  ['retail', 'Retail', 'Store'],
  ['salon', 'Salon', 'Scissors'],
];

async function ensureBusinesses(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS businesses (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(50) NOT NULL,
      zip VARCHAR(10) NOT NULL,
      city VARCHAR(100),
      state VARCHAR(2),
      monthly_revenue_estimate DECIMAL(12,2),
      employees INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS auth0_id TEXT`;
  await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS owner_name TEXT`;
  await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS owner_email TEXT`;
  await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS entity_type TEXT DEFAULT 'sole_prop'`;
  await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS onboarding_stage TEXT DEFAULT 'active'`;
  await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS target_market TEXT DEFAULT 'local_service'`;
  await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS has_employees BOOLEAN DEFAULT FALSE`;
  await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS has_contractors BOOLEAN DEFAULT FALSE`;
  await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS contractor_count INTEGER DEFAULT 0`;
  await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS service_types JSONB DEFAULT '[]'::jsonb`;
  await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS completed_steps JSONB DEFAULT '[]'::jsonb`;
  await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS profile_metadata JSONB DEFAULT '{}'::jsonb`;
  await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS monthly_revenue_avg DECIMAL(12,2) DEFAULT 0`;
  await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS monthly_expense_avg DECIMAL(12,2) DEFAULT 0`;
  await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS profit_margin DECIMAL(8,4) DEFAULT 0`;
  await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS total_revenue_ytd DECIMAL(12,2) DEFAULT 0`;
  await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS total_expenses_ytd DECIMAL(12,2) DEFAULT 0`;
  await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS financials_updated_at TIMESTAMP`;
  await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS business_description TEXT DEFAULT ''`;
  await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS naics_code TEXT DEFAULT ''`;
  await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS ein TEXT`;
  await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS formation_date TEXT`;
  await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS business_address JSONB DEFAULT '{}'::jsonb`;
  await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS operating_jurisdictions JSONB DEFAULT '[]'::jsonb`;
  await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS owner_phone TEXT DEFAULT ''`;
  await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS has_other_job BOOLEAN DEFAULT FALSE`;
  await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS estimated_w2_income DECIMAL(12,2)`;
  await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS is_first_time_business BOOLEAN DEFAULT TRUE`;
  await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS uses_personal_vehicle BOOLEAN DEFAULT FALSE`;
  await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS current_cash_balance DECIMAL(12,2)`;
  await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS businesses_auth0_id_key ON businesses(auth0_id)`;
}

async function ensureLaunchPadTables(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS uploaded_files (
      id SERIAL PRIMARY KEY,
      business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      blob_url TEXT NOT NULL,
      blob_path TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_size INTEGER NOT NULL DEFAULT 0,
      mime_type TEXT NOT NULL,
      folder TEXT NOT NULL,
      linked_type TEXT,
      linked_id TEXT,
      analysis_status TEXT NOT NULL DEFAULT 'pending',
      analysis_error TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS contracts (
      id SERIAL PRIMARY KEY,
      business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      uploaded_file_id INTEGER REFERENCES uploaded_files(id) ON DELETE SET NULL,
      file_name TEXT NOT NULL,
      file_url TEXT NOT NULL,
      file_type TEXT NOT NULL DEFAULT 'pdf',
      contract_type TEXT NOT NULL DEFAULT 'other',
      counterparty_name TEXT NOT NULL DEFAULT '',
      effective_date DATE,
      expiration_date DATE,
      auto_renews BOOLEAN NOT NULL DEFAULT FALSE,
      auto_renewal_notice_period INTEGER,
      termination_notice_period INTEGER,
      total_value DECIMAL(12,2),
      monthly_value DECIMAL(12,2),
      health_score INTEGER NOT NULL DEFAULT 100,
      status TEXT NOT NULL DEFAULT 'active',
      analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
      obligations JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS quotes (
      id SERIAL PRIMARY KEY,
      business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      client_name TEXT NOT NULL,
      client_email TEXT NOT NULL DEFAULT '',
      client_phone TEXT NOT NULL DEFAULT '',
      services JSONB NOT NULL DEFAULT '[]'::jsonb,
      subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
      tax_rate DECIMAL(8,4) NOT NULL DEFAULT 0,
      tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
      total DECIMAL(12,2) NOT NULL DEFAULT 0,
      pricing_analysis JSONB DEFAULT '{}'::jsonb,
      status TEXT NOT NULL DEFAULT 'draft',
      scheduled_date DATE,
      scheduled_time TEXT,
      scheduled_address TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS receipts (
      id SERIAL PRIMARY KEY,
      business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      uploaded_file_id INTEGER REFERENCES uploaded_files(id) ON DELETE SET NULL,
      image_url TEXT NOT NULL,
      vendor TEXT NOT NULL DEFAULT '',
      amount DECIMAL(12,2) NOT NULL DEFAULT 0,
      date DATE NOT NULL DEFAULT CURRENT_DATE,
      line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
      category TEXT NOT NULL DEFAULT 'other',
      tax_classification TEXT NOT NULL DEFAULT 'expense',
      business_percentage DECIMAL(8,2) NOT NULL DEFAULT 100,
      deductible_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
      tax_notes TEXT NOT NULL DEFAULT '',
      is_reconciled BOOLEAN NOT NULL DEFAULT FALSE,
      associated_mileage DECIMAL(10,2),
      needs_more_info BOOLEAN NOT NULL DEFAULT FALSE,
      pending_question TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS compliance_items (
      id SERIAL PRIMARY KEY,
      business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      jurisdiction TEXT NOT NULL DEFAULT 'federal',
      jurisdiction_name TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT 'filing',
      status TEXT NOT NULL DEFAULT 'not_started',
      is_required BOOLEAN NOT NULL DEFAULT TRUE,
      application_url TEXT,
      legal_citation TEXT,
      estimated_processing_time TEXT,
      documentation_required JSONB NOT NULL DEFAULT '[]'::jsonb,
      cost DECIMAL(12,2),
      due_date DATE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS funding_opportunities (
      id SERIAL PRIMARY KEY,
      business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      provider TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'other',
      amount_min DECIMAL(12,2) NOT NULL DEFAULT 0,
      amount_max DECIMAL(12,2) NOT NULL DEFAULT 0,
      interest_rate TEXT,
      repayment_terms TEXT,
      eligibility_match INTEGER NOT NULL DEFAULT 0,
      eligibility_criteria JSONB NOT NULL DEFAULT '[]'::jsonb,
      application_url TEXT NOT NULL DEFAULT '',
      application_deadline DATE,
      status TEXT NOT NULL DEFAULT 'discovered',
      application_progress INTEGER NOT NULL DEFAULT 0,
      prefilled_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
      fit_score INTEGER NOT NULL DEFAULT 0,
      recommendation TEXT NOT NULL DEFAULT '',
      estimated_time_to_apply TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS growth_actions (
      id SERIAL PRIMARY KEY,
      business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      impact TEXT NOT NULL DEFAULT 'medium',
      reasoning TEXT NOT NULL DEFAULT '',
      urgency TEXT NOT NULL DEFAULT 'medium',
      effort TEXT NOT NULL DEFAULT 'medium',
      dismissed BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS uploaded_files_business_id_idx ON uploaded_files(business_id)`;
  await sql`CREATE INDEX IF NOT EXISTS contracts_business_id_idx ON contracts(business_id)`;
  await sql`CREATE INDEX IF NOT EXISTS quotes_business_id_idx ON quotes(business_id)`;
  await sql`CREATE INDEX IF NOT EXISTS receipts_business_id_idx ON receipts(business_id)`;
  await sql`CREATE INDEX IF NOT EXISTS compliance_items_business_id_idx ON compliance_items(business_id)`;
  await sql`CREATE INDEX IF NOT EXISTS funding_opportunities_business_id_idx ON funding_opportunities(business_id)`;
  await sql`CREATE INDEX IF NOT EXISTS growth_actions_business_id_idx ON growth_actions(business_id)`;

  // Add missing columns to quotes (from Prisma schema)
  await sql`ALTER TABLE quotes ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP`;
  await sql`ALTER TABLE quotes ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMP`;
  await sql`ALTER TABLE quotes ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP`;
  await sql`ALTER TABLE quotes ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP`;
  await sql`ALTER TABLE quotes ADD COLUMN IF NOT EXISTS contract_generated BOOLEAN DEFAULT FALSE`;
  await sql`ALTER TABLE quotes ADD COLUMN IF NOT EXISTS contract_id TEXT`;
  await sql`ALTER TABLE quotes ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT`;
  await sql`ALTER TABLE quotes ADD COLUMN IF NOT EXISTS payment_method TEXT`;
  await sql`ALTER TABLE quotes ADD COLUMN IF NOT EXISTS payment_url TEXT`;
  await sql`ALTER TABLE quotes ADD COLUMN IF NOT EXISTS follow_ups_sent INTEGER DEFAULT 0`;
  await sql`ALTER TABLE quotes ADD COLUMN IF NOT EXISTS last_follow_up_at TIMESTAMP`;
  await sql`ALTER TABLE quotes ADD COLUMN IF NOT EXISTS next_follow_up_at TIMESTAMP`;

  // Add missing columns to compliance_items
  await sql`ALTER TABLE compliance_items ADD COLUMN IF NOT EXISTS obtained_date TEXT`;
  await sql`ALTER TABLE compliance_items ADD COLUMN IF NOT EXISTS expiration_date TEXT`;
  await sql`ALTER TABLE compliance_items ADD COLUMN IF NOT EXISTS renewal_date TEXT`;
  await sql`ALTER TABLE compliance_items ADD COLUMN IF NOT EXISTS renewal_frequency TEXT`;
  await sql`ALTER TABLE compliance_items ADD COLUMN IF NOT EXISTS days_until_due INTEGER`;
  await sql`ALTER TABLE compliance_items ADD COLUMN IF NOT EXISTS penalty_for_non_compliance TEXT`;
  await sql`ALTER TABLE compliance_items ADD COLUMN IF NOT EXISTS reminder_sent_30_days BOOLEAN DEFAULT FALSE`;
  await sql`ALTER TABLE compliance_items ADD COLUMN IF NOT EXISTS reminder_sent_14_days BOOLEAN DEFAULT FALSE`;
  await sql`ALTER TABLE compliance_items ADD COLUMN IF NOT EXISTS reminder_sent_3_days BOOLEAN DEFAULT FALSE`;
  await sql`ALTER TABLE compliance_items ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMP DEFAULT NOW()`;
  await sql`ALTER TABLE compliance_items ADD COLUMN IF NOT EXISTS proof_url TEXT`;

  // Bank transactions (Plaid sync)
  await sql`
    CREATE TABLE IF NOT EXISTS bank_transactions (
      id SERIAL PRIMARY KEY,
      business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      transaction_id TEXT NOT NULL UNIQUE,
      account_id TEXT NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      date TEXT NOT NULL,
      name TEXT NOT NULL,
      merchant_name TEXT,
      category JSONB DEFAULT '[]'::jsonb,
      pending BOOLEAN DEFAULT FALSE,
      payment_channel TEXT DEFAULT '',
      personal_finance_category JSONB
    )
  `;

  // Plaid connections
  await sql`
    CREATE TABLE IF NOT EXISTS plaid_connections (
      id SERIAL PRIMARY KEY,
      business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      item_id TEXT NOT NULL UNIQUE,
      access_token TEXT NOT NULL,
      institution_id TEXT NOT NULL DEFAULT '',
      institution_name TEXT NOT NULL DEFAULT '',
      accounts JSONB DEFAULT '[]'::jsonb,
      status TEXT DEFAULT 'active',
      error_code TEXT,
      last_synced_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Tax summaries
  await sql`
    CREATE TABLE IF NOT EXISTS tax_summaries (
      id SERIAL PRIMARY KEY,
      business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      tax_year INTEGER NOT NULL,
      quarter INTEGER NOT NULL DEFAULT 0,
      gross_revenue DECIMAL(12,2) DEFAULT 0,
      net_revenue DECIMAL(12,2) DEFAULT 0,
      total_cogs DECIMAL(12,2) DEFAULT 0,
      gross_profit DECIMAL(12,2) DEFAULT 0,
      total_expenses DECIMAL(12,2) DEFAULT 0,
      mileage_deduction DECIMAL(12,2) DEFAULT 0,
      home_office_deduction DECIMAL(12,2) DEFAULT 0,
      total_deductions DECIMAL(12,2) DEFAULT 0,
      net_taxable_income DECIMAL(12,2) DEFAULT 0,
      estimated_federal_tax DECIMAL(12,2) DEFAULT 0,
      estimated_state_tax DECIMAL(12,2) DEFAULT 0,
      estimated_self_employment_tax DECIMAL(12,2) DEFAULT 0,
      total_estimated_tax DECIMAL(12,2) DEFAULT 0,
      missed_deductions JSONB DEFAULT '[]'::jsonb,
      tax_saving_opportunities JSONB DEFAULT '[]'::jsonb,
      expense_breakdown JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Profit and loss
  await sql`
    CREATE TABLE IF NOT EXISTS profit_and_loss (
      id SERIAL PRIMARY KEY,
      business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      period TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      revenue DECIMAL(12,2) DEFAULT 0,
      cogs DECIMAL(12,2) DEFAULT 0,
      gross_profit DECIMAL(12,2) DEFAULT 0,
      total_expenses DECIMAL(12,2) DEFAULT 0,
      net_profit DECIMAL(12,2) DEFAULT 0,
      profit_margin DECIMAL(8,4) DEFAULT 0,
      expense_breakdown JSONB DEFAULT '{}'::jsonb,
      compared_to_previous_period JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Expense categories
  await sql`
    CREATE TABLE IF NOT EXISTS expense_categories (
      id SERIAL PRIMARY KEY,
      business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      is_custom BOOLEAN DEFAULT FALSE,
      is_tax_deductible BOOLEAN DEFAULT TRUE,
      monthly_total DECIMAL(12,2) DEFAULT 0,
      yearly_total DECIMAL(12,2) DEFAULT 0,
      last_updated TIMESTAMP DEFAULT NOW(),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS bank_transactions_business_id_idx ON bank_transactions(business_id)`;
  await sql`CREATE INDEX IF NOT EXISTS plaid_connections_business_id_idx ON plaid_connections(business_id)`;
  await sql`CREATE INDEX IF NOT EXISTS tax_summaries_business_id_idx ON tax_summaries(business_id)`;
}

async function ensureReferenceData(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS business_types (
      id VARCHAR(50) PRIMARY KEY,
      label VARCHAR(255) NOT NULL,
      icon VARCHAR(32)
    )
  `;
  await sql`ALTER TABLE business_types ALTER COLUMN icon TYPE VARCHAR(32)`;

  for (const [id, label, icon] of businessTypeSeed) {
    await sql`
      INSERT INTO business_types (id, label, icon)
      VALUES (${id}, ${label}, ${icon})
      ON CONFLICT (id) DO UPDATE SET
        label = EXCLUDED.label,
        icon = EXCLUDED.icon
    `;
  }
}

async function runSchemaSetup() {
  const sql = getDb();

  await ensureBusinesses(sql);
  await ensureLaunchPadTables(sql);
  await ensureReferenceData(sql);
}

export async function ensureDatabaseSchema() {
  if (!schemaPromise) {
    schemaPromise = runSchemaSetup().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }

  return schemaPromise;
}
