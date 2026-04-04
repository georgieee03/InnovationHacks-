import { getDb } from './_db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sql = getDb();

  try {
    const businessTypes = await sql`
      SELECT *
      FROM business_types
      ORDER BY label ASC
    `;

    return res.status(200).json(businessTypes);
  } catch (error) {
    console.error('Get business types error:', error);
    return res.status(500).json({ error: 'Failed to get business types' });
  }
}
