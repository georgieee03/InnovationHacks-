import { Router } from 'express';
import { isAuthConfigured } from '../auth.js';
import { getDb } from '../db.js';
import { deriveBusinessProfile, ensureBusinessWorkspace } from '../workspace.js';

const router = Router();

router.post('/', async (req, res) => {
  const sql = getDb();
  const authEnabled = isAuthConfigured();
  const currentUser = req.currentUser || null;

  if (authEnabled && !currentUser?.auth0Id) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const payload = deriveBusinessProfile(req.body || {}, currentUser);

  try {
    let business;

    if (currentUser?.auth0Id) {
      business = await sql`
        INSERT INTO businesses (
          auth0_id,
          owner_name,
          owner_email,
          name,
          type,
          zip,
          city,
          state,
          monthly_revenue_estimate,
          employees,
          entity_type,
          onboarding_stage,
          target_market,
          has_employees,
          has_contractors,
          contractor_count,
          service_types,
          completed_steps,
          profile_metadata,
          monthly_revenue_avg,
          total_revenue_ytd,
          financials_updated_at
        )
        VALUES (
          ${currentUser.auth0Id},
          ${payload.ownerName || currentUser.name},
          ${payload.ownerEmail || currentUser.email},
          ${payload.name},
          ${payload.type},
          ${payload.zip},
          ${payload.city || null},
          ${payload.state || null},
          ${payload.monthlyRevenue || null},
          ${payload.employees || 1},
          ${payload.entityType},
          ${payload.onboardingStage},
          ${payload.targetMarket},
          ${payload.hasEmployees},
          ${payload.hasContractors},
          ${payload.contractorCount},
          ${payload.serviceTypes}::jsonb,
          ${payload.completedSteps}::jsonb,
          ${payload.profileMetadata}::jsonb,
          ${payload.monthlyRevenueAvg || 0},
          ${(payload.monthlyRevenue || 0) * 12},
          NOW()
        )
        ON CONFLICT (auth0_id) DO UPDATE SET
          owner_name = EXCLUDED.owner_name,
          owner_email = EXCLUDED.owner_email,
          name = EXCLUDED.name,
          type = EXCLUDED.type,
          zip = EXCLUDED.zip,
          city = EXCLUDED.city,
          state = EXCLUDED.state,
          monthly_revenue_estimate = EXCLUDED.monthly_revenue_estimate,
          employees = EXCLUDED.employees,
          entity_type = EXCLUDED.entity_type,
          onboarding_stage = EXCLUDED.onboarding_stage,
          target_market = EXCLUDED.target_market,
          has_employees = EXCLUDED.has_employees,
          has_contractors = EXCLUDED.has_contractors,
          contractor_count = EXCLUDED.contractor_count,
          service_types = EXCLUDED.service_types,
          completed_steps = EXCLUDED.completed_steps,
          profile_metadata = EXCLUDED.profile_metadata,
          monthly_revenue_avg = EXCLUDED.monthly_revenue_avg,
          total_revenue_ytd = EXCLUDED.total_revenue_ytd,
          financials_updated_at = NOW()
        RETURNING *
      `;
    } else {
      business = await sql`
        INSERT INTO businesses (
          name,
          type,
          zip,
          city,
          state,
          monthly_revenue_estimate,
          employees,
          owner_name,
          owner_email,
          entity_type,
          onboarding_stage,
          target_market,
          has_employees,
          has_contractors,
          contractor_count,
          service_types,
          completed_steps,
          profile_metadata,
          monthly_revenue_avg,
          total_revenue_ytd,
          financials_updated_at
        )
        VALUES (
          ${payload.name},
          ${payload.type},
          ${payload.zip},
          ${payload.city || null},
          ${payload.state || null},
          ${payload.monthlyRevenue || null},
          ${payload.employees || 1},
          ${payload.ownerName || null},
          ${payload.ownerEmail || null},
          ${payload.entityType},
          ${payload.onboardingStage},
          ${payload.targetMarket},
          ${payload.hasEmployees},
          ${payload.hasContractors},
          ${payload.contractorCount},
          ${payload.serviceTypes}::jsonb,
          ${payload.completedSteps}::jsonb,
          ${payload.profileMetadata}::jsonb,
          ${payload.monthlyRevenueAvg || 0},
          ${(payload.monthlyRevenue || 0) * 12},
          NOW()
        )
        RETURNING *
      `;
    }

    await ensureBusinessWorkspace(sql, business[0]);
    res.status(201).json(business[0]);
  } catch (error) {
    console.error('Create business error:', error);
    res.status(500).json({ error: 'Failed to create business' });
  }
});

router.get('/', async (req, res) => {
  const { id } = req.query;
  const sql = getDb();
  try {
    let business;

    if (req.currentUser?.auth0Id) {
      business = id
        ? await sql`SELECT * FROM businesses WHERE id = ${id} AND auth0_id = ${req.currentUser.auth0Id} LIMIT 1`
        : await sql`SELECT * FROM businesses WHERE auth0_id = ${req.currentUser.auth0Id} LIMIT 1`;
    } else {
      business = id
        ? await sql`SELECT * FROM businesses WHERE id = ${id} LIMIT 1`
        : await sql`SELECT * FROM businesses ORDER BY id ASC LIMIT 1`;
    }

    if (!business[0]) return res.status(404).json({ error: 'Business not found' });
    await ensureBusinessWorkspace(sql, business[0]);
    res.json(business[0]);
  } catch (error) {
    console.error('Get business error:', error);
    res.status(500).json({ error: 'Failed to get business' });
  }
});

export default router;
