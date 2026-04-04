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
);

CREATE TABLE IF NOT EXISTS accounts (
  id VARCHAR(50) PRIMARY KEY,
  business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL,
  balance DECIMAL(12,2) NOT NULL,
  institution VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS transactions (
  id VARCHAR(50) PRIMARY KEY,
  business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
  account_id VARCHAR(50) REFERENCES accounts(id),
  date DATE NOT NULL,
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  type VARCHAR(10) NOT NULL
);

CREATE TABLE IF NOT EXISTS policy_analyses (
  id SERIAL PRIMARY KEY,
  business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
  raw_text TEXT,
  summary JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gap_analyses (
  id SERIAL PRIMARY KEY,
  business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
  policy_analysis_id INTEGER REFERENCES policy_analyses(id) ON DELETE CASCADE,
  results JSONB NOT NULL,
  protection_score INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coverage_recommendations (
  id VARCHAR(50) NOT NULL,
  business_type VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  recommended_limit VARCHAR(255),
  estimated_premium_low INTEGER,
  estimated_premium_high INTEGER,
  priority VARCHAR(20) NOT NULL,
  why_it_matters TEXT,
  location_dependent BOOLEAN DEFAULT FALSE,
  trigger_risk_factors TEXT[],
  PRIMARY KEY (id, business_type)
);

CREATE TABLE IF NOT EXISTS risk_factors (
  zip VARCHAR(10) PRIMARY KEY,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(2) NOT NULL,
  risks JSONB NOT NULL,
  emergency_fund_multiplier INTEGER DEFAULT 3
);

CREATE TABLE IF NOT EXISTS business_types (
  id VARCHAR(50) PRIMARY KEY,
  label VARCHAR(255) NOT NULL,
  icon VARCHAR(10)
);
