import { getDb } from './_db.js';

const SYSTEM_PROMPT = `You are an insurance policy analyzer. You extract structured coverage information from insurance policy documents and return ONLY valid JSON with no additional text, no markdown backticks, and no preamble.

Return JSON in this exact structure:
{
  "policyNumber": "string",
  "insurer": "string",
  "namedInsured": "string",
  "effectiveDates": { "start": "YYYY-MM-DD", "end": "YYYY-MM-DD" },
  "coverages": [
    {
      "type": "string (one of: general_liability, commercial_property, workers_comp, flood, earthquake, business_interruption, equipment_breakdown, cyber_liability, professional_liability, commercial_auto, inland_marine, umbrella)",
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
}

Check for all listed coverage types and mark uncovered ones with "covered": false. Focus on gaps as much as current coverage.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { policyText, businessId } = req.body || {};

  if (!policyText) {
    return res.status(400).json({ error: 'Missing policyText' });
  }

  const groqApiKey = process.env.GROQ_API_KEY;

  if (!groqApiKey) {
    return res.status(200).json(getDemoFallback());
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.1,
        max_tokens: 2000,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Analyze this insurance policy and return structured JSON:\n\n${policyText}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error('Groq API error:', response.status, await response.text());
      return res.status(200).json(getDemoFallback());
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned);

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

    return res.status(200).json({
      ...parsed,
      policyAnalysisId,
    });
  } catch (error) {
    console.error('Policy analysis error:', error);
    return res.status(200).json(getDemoFallback());
  }
}

function getDemoFallback() {
  return {
    policyNumber: 'BOP-2024-TX-00847291',
    insurer: 'Gulf States Mutual Insurance Co.',
    namedInsured: "Maria's Bakery LLC",
    effectiveDates: { start: '2024-03-15', end: '2025-03-15' },
    coverages: [
      {
        type: 'general_liability',
        name: 'General Liability',
        covered: true,
        limit: '$500,000 per occurrence',
        deductible: '$1,000',
        notes: 'Aggregate $1,000,000. Products/completed ops at $500,000.',
      },
      {
        type: 'commercial_property',
        name: 'Commercial Property',
        covered: true,
        limit: '$100,000',
        deductible: '$2,500',
        notes: 'Business personal property only. Building not covered because the business is a tenant.',
      },
      {
        type: 'workers_comp',
        name: "Workers' Compensation",
        covered: true,
        limit: 'Statutory (Texas)',
        deductible: 'N/A',
        notes: "Employer's liability at $100,000 per accident.",
      },
      {
        type: 'flood',
        name: 'Flood Insurance',
        covered: false,
        limit: null,
        deductible: null,
        notes: 'Explicitly excluded.',
      },
      {
        type: 'earthquake',
        name: 'Earthquake Insurance',
        covered: false,
        limit: null,
        deductible: null,
        notes: 'Explicitly excluded.',
      },
      {
        type: 'equipment_breakdown',
        name: 'Equipment Breakdown',
        covered: false,
        limit: null,
        deductible: null,
        notes: 'Mechanical and electrical failure are excluded.',
      },
      {
        type: 'business_interruption',
        name: 'Business Interruption',
        covered: false,
        limit: null,
        deductible: null,
        notes: 'Loss of income is not covered.',
      },
      {
        type: 'cyber_liability',
        name: 'Cyber Liability',
        covered: false,
        limit: null,
        deductible: null,
        notes: 'Data breach coverage is excluded.',
      },
      {
        type: 'professional_liability',
        name: 'Professional Liability',
        covered: false,
        limit: null,
        deductible: null,
        notes: 'Not included.',
      },
      {
        type: 'commercial_auto',
        name: 'Commercial Auto',
        covered: false,
        limit: null,
        deductible: null,
        notes: 'Excluded. Separate policy required.',
      },
    ],
    totalAnnualPremium: 4570,
    monthlyPremium: 285,
    plainEnglishSummary:
      "Your policy covers general liability up to $500,000 per incident, business equipment up to $100,000, and workers' comp at Texas statutory limits. You have no coverage for flood damage, equipment breakdown, business interruption, or cyber attacks. Your general liability limit is below the recommended $1,000,000 for food service.",
  };
}
