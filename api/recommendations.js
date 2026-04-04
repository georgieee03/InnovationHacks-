import { getDb } from './_db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { businessType } = req.query || {};

  if (!businessType) {
    return res.status(400).json({ error: 'Missing businessType' });
  }

  const sql = getDb();

  try {
    const recommendations = await sql`
      SELECT *
      FROM coverage_recommendations
      WHERE business_type = ${businessType}
      ORDER BY
        CASE priority
          WHEN 'critical' THEN 0
          WHEN 'recommended' THEN 1
          WHEN 'conditional' THEN 2
          ELSE 3
        END,
        name ASC
    `;

    return res.status(200).json(recommendations);
  } catch (error) {
    console.error('Get recommendations error:', error);
    return res.status(500).json({ error: 'Failed to get recommendations' });
  }
}
