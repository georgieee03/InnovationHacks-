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
