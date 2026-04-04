import { getDb } from './_db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { businessId } = req.query || {};

  if (!businessId) {
    return res.status(400).json({ error: 'Missing businessId' });
  }

  const sql = getDb();

  try {
    const accounts = await sql`
      SELECT *
      FROM accounts
      WHERE business_id = ${businessId}
      ORDER BY name ASC
    `;

    const transactions = await sql`
      SELECT *
      FROM transactions
      WHERE business_id = ${businessId}
      ORDER BY date DESC, id DESC
    `;

    return res.status(200).json({ accounts, transactions });
  } catch (error) {
    console.error('Get transactions error:', error);
    return res.status(500).json({ error: 'Failed to get transactions' });
  }
}
