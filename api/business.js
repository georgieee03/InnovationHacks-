import { getDb } from './_db.js';

export default async function handler(req, res) {
  const sql = getDb();

  if (req.method === 'POST') {
    const { name, type, zip, city, state, monthlyRevenue, employees } = req.body || {};

    try {
      const business = await sql`
        INSERT INTO businesses (name, type, zip, city, state, monthly_revenue_estimate, employees)
        VALUES (
          ${name},
          ${type},
          ${zip},
          ${city || null},
          ${state || null},
          ${monthlyRevenue || null},
          ${employees || 1}
        )
        RETURNING *
      `;

      return res.status(201).json(business[0]);
    } catch (error) {
      console.error('Create business error:', error);
      return res.status(500).json({ error: 'Failed to create business' });
    }
  }

  if (req.method === 'GET') {
    const { id } = req.query || {};

    try {
      const business = id
        ? await sql`SELECT * FROM businesses WHERE id = ${id} LIMIT 1`
        : await sql`SELECT * FROM businesses ORDER BY id ASC LIMIT 1`;

      if (!business[0]) {
        return res.status(404).json({ error: 'Business not found' });
      }

      return res.status(200).json(business[0]);
    } catch (error) {
      console.error('Get business error:', error);
      return res.status(500).json({ error: 'Failed to get business' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
