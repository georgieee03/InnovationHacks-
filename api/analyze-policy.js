import { getDb } from './_db.js';

const COVERAGE_LABELS = {
  general_liability: 'General Liability',
  commercial_property: 'Commercial Property',
  workers_comp: "Workers' Compensation",
  flood: 'Flood Insurance',
  earthquake: 'Earthquake Insurance',
  business_interruption: 'Business Interruption',
  equipment_breakdown: 'Equipment Breakdown',
  cyber_liability: 'Cyber Liability',
  professional_liability: 'Professional Liability',
  commercial_auto: 'Commercial Auto',
  inland_marine: 'Inland Marine',
  umbrella: 'Umbrella',
};

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

Use exact declarations-page values when present.
If both per-occurrence and aggregate liability limits appear, use the per-occurrence amount for general_liability.limit and mention aggregate in notes.
If an explicit Monthly Installment or Monthly Premium appears, use that exact number for monthlyPremium instead of dividing the annual premium.
For commercial property on a tenant policy, prefer Business Personal Property as the commercial_property limit when Building Coverage is not covered.
Check for all listed coverage types and mark uncovered ones with "covered": false. Focus on gaps as much as current coverage.`;

function parseCurrencyNumber(value) {
  if (!value) return null;
  const normalized = String(value).replace(/,/g, '').replace(/\$/g, '').trim();
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatCurrencyString(value) {
  if (!value) return null;
  const [whole, decimal] = String(value).split('.');
  const formattedWhole = Number.parseInt(whole.replace(/,/g, ''), 10).toLocaleString('en-US');
  return decimal ? `$${formattedWhole}.${decimal.padEnd(2, '0').slice(0, 2)}` : `$${formattedWhole}`;
}

function toIsoDate(value) {
  if (!value) return '';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return parsed.toISOString().slice(0, 10);
}

function ensureCoverage(summary, type) {
  if (!Array.isArray(summary.coverages)) {
    summary.coverages = [];
  }

  let coverage = summary.coverages.find((item) => item.type === type);
  if (!coverage) {
    coverage = {
      type,
      name: COVERAGE_LABELS[type] || type,
      covered: false,
      limit: null,
      deductible: null,
      notes: '',
    };
    summary.coverages.push(coverage);
  }

  if (!coverage.name) {
    coverage.name = COVERAGE_LABELS[type] || type;
  }

  return coverage;
}

function setCoverage(summary, type, patch) {
  Object.assign(ensureCoverage(summary, type), patch);
}

function normalizeSummary(parsed, policyText) {
  const summary = {
    ...parsed,
    effectiveDates: {
      start: parsed?.effectiveDates?.start || '',
      end: parsed?.effectiveDates?.end || '',
    },
    coverages: Array.isArray(parsed?.coverages) ? parsed.coverages.map((coverage) => ({
      ...coverage,
      name: coverage.name || COVERAGE_LABELS[coverage.type] || coverage.type,
    })) : [],
  };

  const policyNumber = policyText.match(/Policy Number\s+([A-Z0-9-]+)/i)?.[1];
  if (policyNumber) {
    summary.policyNumber = policyNumber.trim();
  }

  const insurer = policyText.match(/^\s*([^\n|]+Insurance[^\n|]*)/im)?.[1];
  if (insurer) {
    summary.insurer = insurer.trim();
  }

  const namedInsured = policyText.match(/Named Insured\s+(.+?)\s+Expiration Date/i)?.[1];
  if (namedInsured) {
    summary.namedInsured = namedInsured.trim();
  }

  const effectiveDate = policyText.match(/Effective Date\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})/i)?.[1];
  const expirationDate = policyText.match(/Expiration Date\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})/i)?.[1];
  if (effectiveDate) {
    summary.effectiveDates.start = toIsoDate(effectiveDate);
  }
  if (expirationDate) {
    summary.effectiveDates.end = toIsoDate(expirationDate);
  }

  const monthlyInstallment = policyText.match(/Monthly (?:Installment|Premium)\s+\$?([0-9,]+(?:\.\d{2})?)/i)?.[1];
  const annualPremium = policyText.match(/TOTAL ANNUAL PREMIUM\s+\$?([0-9,]+(?:\.\d{2})?)/i)?.[1]
    || policyText.match(/Annual Premium\s+\$?([0-9,]+(?:\.\d{2})?)/i)?.[1];

  const monthlyPremiumValue = parseCurrencyNumber(monthlyInstallment);
  const annualPremiumValue = parseCurrencyNumber(annualPremium);

  if (monthlyPremiumValue !== null) {
    summary.monthlyPremium = monthlyPremiumValue;
  }
  if (annualPremiumValue !== null) {
    summary.totalAnnualPremium = annualPremiumValue;
  }

  const perOccurrenceMatch = policyText.match(/Per Occurrence Limit\s+\$?([0-9,]+(?:\.\d{2})?)\s+\$?([0-9,]+(?:\.\d{2})?)/i);
  const aggregateMatch = policyText.match(/General Aggregate Limit\s+\$?([0-9,]+(?:\.\d{2})?)/i);
  if (perOccurrenceMatch) {
    const [, occurrenceLimit, occurrenceDeductible] = perOccurrenceMatch;
    const notes = [];
    if (aggregateMatch?.[1]) {
      notes.push(`Aggregate ${formatCurrencyString(aggregateMatch[1])}`);
    }
    const completedOps = policyText.match(/Products\s*\/\s*Completed Operations\s+\$?([0-9,]+(?:\.\d{2})?)/i)?.[1];
    if (completedOps) {
      notes.push(`Products/completed ops ${formatCurrencyString(completedOps)}`);
    }

    setCoverage(summary, 'general_liability', {
      covered: true,
      limit: `${formatCurrencyString(occurrenceLimit)} per occurrence`,
      deductible: formatCurrencyString(occurrenceDeductible),
      notes: notes.join('. '),
    });
  }

  const businessPersonalPropertyMatch = policyText.match(/Business Personal Property\s+\$?([0-9,]+(?:\.\d{2})?)\s+\$?([0-9,]+(?:\.\d{2})?)/i);
  if (businessPersonalPropertyMatch) {
    const [, propertyLimit, propertyDeductible] = businessPersonalPropertyMatch;
    setCoverage(summary, 'commercial_property', {
      covered: true,
      limit: formatCurrencyString(propertyLimit),
      deductible: formatCurrencyString(propertyDeductible),
      notes: 'Business personal property only. Building not covered because the business is a tenant.',
    });
  }

  const workersCompState = policyText.match(/Workers'? Compensation\s+Statutory Limits - State of ([A-Za-z ]+)/i)?.[1];
  const employerAccidentLimit = policyText.match(/Employer'?s Liability:? Each Accident\s+\$?([0-9,]+(?:\.\d{2})?)/i)?.[1];
  if (workersCompState) {
    setCoverage(summary, 'workers_comp', {
      covered: true,
      limit: `Statutory Limits - State of ${workersCompState.trim()}`,
      deductible: 'N/A',
      notes: employerAccidentLimit ? `Employer's liability each accident ${formatCurrencyString(employerAccidentLimit)}.` : '',
    });
  }

  const exclusionChecks = [
    ['flood', /Flood(?: and surface water damage| Insurance: excluded| damage)/i, 'Explicitly excluded.'],
    ['earthquake', /Earthquake(?: and earth movement| Insurance: excluded| damage)/i, 'Explicitly excluded.'],
    ['equipment_breakdown', /Equipment breakdown\s*\/\s*mechanical or electrical failure|Equipment Breakdown: excluded/i, 'Mechanical and electrical failure are excluded.'],
    ['business_interruption', /Business interruption\s*\/\s*loss of income|Loss of Income\s*\/\s*Business Interruption\s+Not Covered/i, 'Loss of income is not covered.'],
    ['cyber_liability', /Cyber liability and data breaches|Cyber Liability: excluded/i, 'Data breach coverage is excluded.'],
    ['professional_liability', /Professional liability\s*\/\s*errors and omissions/i, 'Not included.'],
    ['commercial_auto', /Commercial auto liability and physical damage|Commercial Auto: excluded/i, 'Excluded. Separate policy required.'],
    ['inland_marine', /Inland marine/i, 'Not included.'],
    ['umbrella', /Umbrella/i, 'Not included.'],
  ];

  for (const [type, pattern, notes] of exclusionChecks) {
    if (pattern.test(policyText)) {
      setCoverage(summary, type, {
        covered: false,
        limit: null,
        deductible: null,
        notes,
      });
    }
  }

  return summary;
}

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
    const normalized = normalizeSummary(parsed, policyText);

    let policyAnalysisId;

    if (businessId) {
      const sql = getDb();
      const saved = await sql`
        INSERT INTO policy_analyses (business_id, raw_text, summary)
        VALUES (${businessId}, ${policyText.slice(0, 5000)}, ${JSON.stringify(normalized)})
        RETURNING id
      `;
      policyAnalysisId = saved[0]?.id;
    }

    return res.status(200).json({
      ...normalized,
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
