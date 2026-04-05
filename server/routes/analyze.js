import { Router } from 'express';
import { getDb } from '../db.js';
import { groqJSON, isGroqConfigured, ACCURATE_MODEL_ID } from '../lib/groq.js';

const router = Router();

router.post('/analyze-policy', async (req, res) => {
  const { policyText, businessId, allowDemoFallback = false } = req.body || {};
  if (!policyText) return res.status(400).json({ error: 'Missing policyText' });

  if (!looksLikeInsurancePolicy(policyText)) {
    return res.status(422).json({
      error: 'The uploaded document does not appear to be a business insurance policy. Upload a declarations page or policy document with coverage, premium, insured, and policy details.',
    });
  }

  if (!isGroqConfigured()) {
    if (allowDemoFallback) {
      return res.json(getDemoFallback());
    }

    return res.status(503).json({ error: 'Policy analysis is unavailable right now.' });
  }

  const POLICY_SCHEMA = `{
  "policyNumber": "string",
  "insurer": "string",
  "namedInsured": "string",
  "effectiveDates": { "start": "YYYY-MM-DD", "end": "YYYY-MM-DD" },
  "coverages": [
    {
      "type": "general_liability|commercial_property|workers_comp|flood|earthquake|business_interruption|equipment_breakdown|cyber_liability|professional_liability|commercial_auto|inland_marine|umbrella",
      "name": "string",
      "covered": true,
      "limit": "string or null",
      "deductible": "string or null",
      "notes": "string"
    }
  ],
  "totalAnnualPremium": number,
  "monthlyPremium": number,
  "plainEnglishSummary": "string"
}`;

  try {
    const parsed = await groqJSON(
      `You are an insurance policy analyzer. Extract structured coverage information from this policy document. Check for all coverage types and mark uncovered ones with "covered": false.\n\nReturn ONLY JSON matching this schema:\n${POLICY_SCHEMA}\n\nPOLICY TEXT:\n${policyText.slice(0, 8000)}`,
      { maxTokens: 2000, model: ACCURATE_MODEL_ID }
    );

    let policyAnalysisId;
    if (businessId) {
      const sql = getDb();
      const saved = await sql`
        INSERT INTO policy_analyses (business_id, raw_text, summary)
        VALUES (${businessId}, ${policyText.slice(0, 5000)}, ${JSON.stringify(parsed)})
        RETURNING id
      `;
      policyAnalysisId = saved[0]?.id;
    }

    if (!isStructuredPolicySummary(parsed)) {
      if (allowDemoFallback) {
        return res.json(getDemoFallback());
      }

      return res.status(422).json({ error: 'The uploaded document could not be recognized as an insurance policy.' });
    }

    return res.json({ ...parsed, policyAnalysisId });
  } catch (error) {
    console.error('Policy analysis error:', error);
    if (allowDemoFallback) {
      return res.json(getDemoFallback());
    }

    return res.status(502).json({ error: 'Policy analysis failed. Please upload a text-based insurance policy and try again.' });
  }
});

router.post('/save-gap-analysis', async (req, res) => {
  const { businessId, policyAnalysisId, results, protectionScore } = req.body || {};
  const sql = getDb();
  try {
    const saved = await sql`
      INSERT INTO gap_analyses (business_id, policy_analysis_id, results, protection_score)
      VALUES (${businessId}, ${policyAnalysisId || null}, ${JSON.stringify(results)}, ${protectionScore || null})
      RETURNING *
    `;
    res.status(201).json(saved[0]);
  } catch (error) {
    console.error('Save gap analysis error:', error);
    res.status(500).json({ error: 'Failed to save gap analysis' });
  }
});

function getDemoFallback() {
  return {
    policyNumber: 'BOP-2024-TX-00847291',
    insurer: 'Gulf States Mutual Insurance Co.',
    namedInsured: "Maria's Bakery LLC",
    effectiveDates: { start: '2024-03-15', end: '2025-03-15' },
    coverages: [
      { type: 'general_liability', name: 'General Liability', covered: true, limit: '$500,000 per occurrence', deductible: '$1,000', notes: 'Aggregate $1,000,000.' },
      { type: 'commercial_property', name: 'Commercial Property', covered: true, limit: '$100,000', deductible: '$2,500', notes: 'Business personal property only.' },
      { type: 'workers_comp', name: "Workers' Compensation", covered: true, limit: 'Statutory (Texas)', deductible: 'N/A', notes: "Employer's liability at $100,000 per accident." },
      { type: 'flood', name: 'Flood Insurance', covered: false, limit: null, deductible: null, notes: 'Explicitly excluded.' },
      { type: 'business_interruption', name: 'Business Interruption', covered: false, limit: null, deductible: null, notes: 'Loss of income is not covered.' },
      { type: 'cyber_liability', name: 'Cyber Liability', covered: false, limit: null, deductible: null, notes: 'Data breach coverage is excluded.' },
      { type: 'equipment_breakdown', name: 'Equipment Breakdown', covered: false, limit: null, deductible: null, notes: 'Mechanical failure excluded.' },
    ],
    totalAnnualPremium: 4570,
    monthlyPremium: 285,
    plainEnglishSummary: "Your policy covers general liability, commercial property, and workers' comp. No coverage for flood, business interruption, cyber, or equipment breakdown.",
  };
}

function looksLikeInsurancePolicy(policyText) {
  const text = String(policyText || '').toLowerCase();
  const signalPatterns = [
    /\bpolicy number\b/,
    /\bnamed insured\b/,
    /\binsurer\b/,
    /\bcarrier\b/,
    /\beffective date\b/,
    /\bexpiration date\b/,
    /\bpolicy period\b/,
    /\bpremium\b/,
    /\bdeductible\b/,
    /\bcoverage\b/,
    /\blimit\b/,
    /\bliability\b/,
    /\bdeclarations\b/,
    /\bper occurrence\b/,
    /\baggregate\b/,
    /\bworkers'? compensation\b/,
    /\bcommercial property\b/,
    /\bgeneral liability\b/,
  ];

  const matches = signalPatterns.filter((pattern) => pattern.test(text)).length;
  return matches >= 3;
}

function isStructuredPolicySummary(parsed) {
  return Boolean(
    parsed &&
    typeof parsed === 'object' &&
    (parsed.policyNumber || parsed.insurer || parsed.namedInsured) &&
    Array.isArray(parsed.coverages) &&
    parsed.coverages.length > 0
  );
}

export default router;
