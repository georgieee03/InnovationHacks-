import { getDb } from './_db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { businessId, policyAnalysisId, results, protectionScore } = req.body || {};
  const sql = getDb();

  try {
    const saved = await sql`
      INSERT INTO gap_analyses (business_id, policy_analysis_id, results, protection_score)
      VALUES (
        ${businessId},
        ${policyAnalysisId || null},
        ${JSON.stringify(results)},
        ${protectionScore || null}
      )
      RETURNING *
    `;

    return res.status(201).json(saved[0]);
  } catch (error) {
    console.error('Save gap analysis error:', error);
    return res.status(500).json({ error: 'Failed to save gap analysis' });
  }
}
