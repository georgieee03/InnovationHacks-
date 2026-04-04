import { Router } from 'express';
import { getDb } from '../db.js';

const router = Router();

router.post('/', async (req, res) => {
  const { name, type, zip, city, state, monthlyRevenue, employees } = req.body || {};
  const sql = getDb();
  try {
    const business = await sql`
      INSERT INTO businesses (name, type, zip, city, state, monthly_revenue_estimate, employees)
      VALUES (${name}, ${type}, ${zip}, ${city || null}, ${state || null}, ${monthlyRevenue || null}, ${employees || 1})
      RETURNING *
    `;
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
    const business = id
      ? await sql`SELECT * FROM businesses WHERE id = ${id} LIMIT 1`
      : await sql`SELECT * FROM businesses ORDER BY id ASC LIMIT 1`;
    if (!business[0]) return res.status(404).json({ error: 'Business not found' });
    res.json(business[0]);
  } catch (error) {
    console.error('Get business error:', error);
    res.status(500).json({ error: 'Failed to get business' });
  }
});

export default router;
