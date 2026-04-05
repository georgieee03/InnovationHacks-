import { readFileSync } from 'node:fs';
import { Router } from 'express';
import { getDb } from '../db.js';

const riskFactorFallbacks = JSON.parse(
  readFileSync(new URL('../../src/data/riskFactors.json', import.meta.url), 'utf8')
);

const router = Router();

router.get('/zip-lookup', async (req, res) => {
  const zip = String(req.query.zip || '').trim();
  const fallbackLocation = riskFactorFallbacks[zip] || null;

  if (!/^\d{5}$/.test(zip)) {
    return res.status(400).json({ error: 'ZIP code must be 5 digits' });
  }

  try {
    const response = await fetch(`https://api.zippopotam.us/us/${encodeURIComponent(zip)}`);

    if (response.status === 404) {
      if (fallbackLocation?.city && fallbackLocation?.state) {
        return res.json({
          zip,
          city: fallbackLocation.city,
          state: fallbackLocation.state,
          source: 'local-risk-fallback',
        });
      }

      return res.json(null);
    }

    if (!response.ok) {
      throw new Error(`ZIP lookup failed with status ${response.status}`);
    }

    const payload = await response.json();
    const place = payload?.places?.[0];

    if (!place) {
      if (fallbackLocation?.city && fallbackLocation?.state) {
        return res.json({
          zip,
          city: fallbackLocation.city,
          state: fallbackLocation.state,
          source: 'local-risk-fallback',
        });
      }

      return res.json(null);
    }

    return res.json({
      zip,
      city: place['place name'] || '',
      state: place['state abbreviation'] || '',
      stateName: place.state || '',
      country: payload.country || 'United States',
      source: 'zippopotam',
    });
  } catch (error) {
    console.error('ZIP lookup error:', error);

    if (fallbackLocation?.city && fallbackLocation?.state) {
      return res.json({
        zip,
        city: fallbackLocation.city,
        state: fallbackLocation.state,
        source: 'local-risk-fallback',
      });
    }

    return res.status(500).json({ error: 'Failed to look up ZIP code' });
  }
});

router.get('/business-types', async (_req, res) => {
  const sql = getDb();
  try {
    const types = await sql`SELECT * FROM business_types ORDER BY label ASC`;
    res.json(types);
  } catch (error) {
    console.error('Get business types error:', error);
    res.status(500).json({ error: 'Failed to get business types' });
  }
});

router.get('/risk-factors', async (req, res) => {
  const sql = getDb();
  const { zip } = req.query;
  try {
    if (zip) {
      const result = await sql`SELECT * FROM risk_factors WHERE zip = ${zip} LIMIT 1`;
      return res.json(result[0] || null);
    }
    const all = await sql`SELECT * FROM risk_factors ORDER BY zip ASC`;
    res.json(all);
  } catch (error) {
    console.error('Get risk factors error:', error);
    res.status(500).json({ error: 'Failed to get risk factors' });
  }
});

router.get('/recommendations', async (req, res) => {
  const { businessType } = req.query;
  if (!businessType) return res.status(400).json({ error: 'Missing businessType' });
  const sql = getDb();
  try {
    const recs = await sql`
      SELECT * FROM coverage_recommendations
      WHERE business_type = ${businessType}
      ORDER BY
        CASE priority WHEN 'critical' THEN 0 WHEN 'recommended' THEN 1 WHEN 'conditional' THEN 2 ELSE 3 END,
        name ASC
    `;
    res.json(recs);
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

router.get('/transactions', async (req, res) => {
  const { businessId } = req.query;
  if (!businessId) return res.status(400).json({ error: 'Missing businessId' });
  const sql = getDb();
  try {
    if (req.currentUser?.auth0Id) {
      const ownedBusiness = await sql`
        SELECT id
        FROM businesses
        WHERE id = ${businessId} AND auth0_id = ${req.currentUser.auth0Id}
        LIMIT 1
      `;

      if (!ownedBusiness[0]) {
        return res.status(404).json({ error: 'Business not found' });
      }
    }

    const accounts = await sql`SELECT * FROM accounts WHERE business_id = ${businessId} ORDER BY name ASC`;
    const transactions = await sql`SELECT * FROM transactions WHERE business_id = ${businessId} ORDER BY date DESC, id DESC`;
    res.json({ accounts, transactions });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

export default router;
