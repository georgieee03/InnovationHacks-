import { getDb } from './_db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sql = getDb();
  const { zip } = req.query || {};

  try {
    if (zip) {
      const result = await sql`
        SELECT *
        FROM risk_factors
        WHERE zip = ${zip}
        LIMIT 1
      `;

      return res.status(200).json(result[0] || null);
    }

    const all = await sql`SELECT * FROM risk_factors ORDER BY zip ASC`;
    return res.status(200).json(all);
  } catch (error) {
    console.error('Get risk factors error:', error);
    return res.status(500).json({ error: 'Failed to get risk factors' });
  }
}
