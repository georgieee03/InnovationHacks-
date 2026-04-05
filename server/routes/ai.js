/**
 * AI routes — ported from LaunchPad's Next.js API routes to Express.
 * All routes use Groq for JSON generation.
 */
import { Router } from 'express';
import { requireSession } from '../auth.js';
import { getDb } from '../db.js';
import { groqJSON, groqVisionJSON, isGroqConfigured } from '../lib/groq.js';

const router = Router();

// ─── Business Advisor (onboarding AI) ─────────────────────────────────────────

router.post('/ai/business-advisor', async (req, res) => {
  if (!isGroqConfigured()) {
    return res.status(503).json({ error: 'GROQ_API_KEY is not configured' });
  }

  try {
    const body = req.body || {};
    const prompt = `You are a business formation advisor. Generate a business plan for this new business owner.

BUSINESS: ${body.businessDescription}
WORK STRUCTURE: ${body.workStructure}
PERSONAL ASSETS USED: ${body.personalAssets}
INCOME SOURCE: ${body.incomeSource}
BUSINESS NAME: ${body.businessName || "Not yet decided"}
ESTIMATED MONTHLY REVENUE: ${body.estimatedRevenue}
${body.helpDetails ? `HELP DETAILS: ${body.helpDetails}` : ""}

Rules: Recommend LLC over sole prop if physical client interaction. Flag commercial auto gap if personal vehicle used. Warn about quarterly estimated taxes. Flag employee vs contractor risk if applicable.

Return ONLY valid JSON (no markdown):
{
  "businessProfile": {
    "businessName": "string",
    "businessType": "string",
    "naicsCode": "string",
    "entityType": "sole_prop|llc|s_corp|c_corp|partnership",
    "entityState": "2-letter state code",
    "ownerName": "",
    "ownerEmail": "",
    "hasOtherJob": boolean,
    "isFirstTimeBusiness": true,
    "serviceTypes": [{"id":"1","name":"string","description":"string","basePrice":0,"estimatedDuration":60}],
    "targetMarket": "residential|commercial|both",
    "usesPersonalVehicle": boolean,
    "hasEmployees": boolean,
    "employeeCount": 0,
    "hasContractors": boolean,
    "contractorCount": 0,
    "businessAddress": {"street":"","city":"string","state":"string","zip":"","county":"string"},
    "operatingJurisdictions": ["string"],
    "onboardingStage": "formation",
    "completedSteps": []
  },
  "entityRecommendation": {
    "recommended": "sole_prop|llc|s_corp|c_corp|partnership",
    "reasoning": "2-3 sentences specific to their situation",
    "filingCost": number,
    "processingTime": "string",
    "filingUrl": "string",
    "alternativeConsiderations": "string"
  },
  "nameAnalysis": {
    "name": "string",
    "available": true,
    "trademarkRisk": "low|medium|high",
    "domainAvailable": true,
    "suggestions": ["string","string","string"]
  },
  "formationChecklist": [
    {"id":"string","title":"string","description":"string","estimatedTime":"string","estimatedCost":0,"link":"string","dependencies":[],"category":"legal|tax|insurance|licensing|banking"}
  ],
  "complianceItems": [
    {"title":"string","description":"string","jurisdiction":"federal|state|county|city","jurisdictionName":"string","category":"license|registration|permit|tax_filing|insurance|report","isRequired":true,"legalCitation":null,"applicationUrl":null,"cost":0,"renewalFrequency":"annual","estimatedProcessingTime":"string","documentationRequired":[],"penaltyForNonCompliance":null}
  ],
  "keyInsights": ["string","string","string"],
  "urgentWarnings": ["string"]
}`;

    const result = await groqJSON(prompt, { maxTokens: 6000 });
    return res.json(result);
  } catch (err) {
    console.error('business-advisor error:', err);
    return res.status(500).json({ error: 'Failed to generate business plan' });
  }
});


// ─── Analyze Receipt ──────────────────────────────────────────────────────────

const RECEIPT_SCHEMA = `{
  "vendor":"string","amount":number,"date":"YYYY-MM-DD",
  "lineItems":[{"description":"","quantity":number,"unitPrice":number,"totalPrice":number}],
  "category":"supplies|vehicle_fuel|vehicle_maintenance|insurance|rent|utilities|marketing|equipment|professional_services|meals_entertainment|office_supplies|software|training|other",
  "taxClassification":"cogs|expense|asset|personal|mixed",
  "businessPercentage":0-100,"deductibleAmount":number,
  "taxNotes":"brief explanation",
  "associatedMileage":number|null,
  "needsMoreInfo":boolean,"pendingQuestion":"string|null"
}`;

const RECEIPT_RULES = `Gas→vehicle_fuel. Restaurant→meals_entertainment,businessPercentage=50. Phone/internet→utilities,50-80%. deductibleAmount=amount×(businessPercentage/100).`;

router.post('/ai/analyze-receipt', requireSession, async (req, res) => {
  if (!isGroqConfigured()) {
    return res.status(503).json({ error: 'GROQ_API_KEY is not configured' });
  }

  try {
    const { fileBase64, fileMimeType, businessId } = req.body || {};
    if (!businessId || !fileBase64) {
      return res.status(400).json({ error: 'businessId and fileBase64 are required' });
    }

    const sql = getDb();
    const bizRows = await sql`SELECT name, type FROM businesses WHERE id = ${businessId} LIMIT 1`;
    const biz = bizRows[0];
    const bizCtx = biz ? `${biz.name} (${biz.type})` : 'small business';

    const isImage = /^image\/(jpeg|png|webp|gif)$/i.test(fileMimeType || '');
    const prompt = `You are a bookkeeper. Analyze this receipt for ${bizCtx}. Return ONLY JSON:\n${RECEIPT_SCHEMA}\n${RECEIPT_RULES}`;

    let result;
    if (isImage) {
      try {
        result = await groqVisionJSON(prompt, fileBase64, fileMimeType);
      } catch {
        // Vision failed, fall through to text analysis
      }
    }

    if (!result) {
      // For PDFs or vision fallback, ask Groq to analyze based on description
      result = await groqJSON(
        `${prompt}\n\nThe receipt is a ${fileMimeType} file uploaded by the business owner. Since you cannot see the image, generate a reasonable placeholder analysis and set needsMoreInfo to true with pendingQuestion asking the user to provide vendor name and amount.`
      );
    }

    return res.json(result);
  } catch (err) {
    console.error('analyze-receipt error:', err);
    return res.status(500).json({ error: 'Receipt analysis failed' });
  }
});

// ─── Analyze Taxes ────────────────────────────────────────────────────────────

router.post('/ai/analyze-taxes', requireSession, async (req, res) => {
  if (!isGroqConfigured()) {
    return res.status(503).json({ error: 'GROQ_API_KEY is not configured' });
  }

  try {
    const { businessId } = req.body || {};
    if (!businessId) {
      return res.status(400).json({ error: 'businessId required' });
    }

    const sql = getDb();
    const [bizRows, receiptRows, quoteRows] = await Promise.all([
      sql`SELECT * FROM businesses WHERE id = ${businessId} LIMIT 1`,
      sql`SELECT vendor, amount, category, date, tax_classification, business_percentage, deductible_amount, associated_mileage, tax_notes FROM receipts WHERE business_id = ${businessId} ORDER BY date DESC LIMIT 200`,
      sql`SELECT total FROM quotes WHERE business_id = ${businessId} AND status = 'paid'`,
    ]);

    const biz = bizRows[0];
    if (!biz) return res.status(404).json({ error: 'Business not found' });

    const ytdRevenue = quoteRows.reduce((s, q) => s + Number(q.total || 0), 0);
    const ytdExpenses = receiptRows.reduce((s, r) => s + Number(r.deductible_amount || r.amount || 0), 0);

    const expenseByCategory = {};
    for (const r of receiptRows) {
      expenseByCategory[r.category] = (expenseByCategory[r.category] || 0) + Number(r.deductible_amount || r.amount || 0);
    }

    const totalMiles = receiptRows.reduce((s, r) => s + Number(r.associated_mileage || 0), 0);

    const receiptSample = receiptRows.slice(0, 50).map((r) => ({
      vendor: r.vendor, amount: Number(r.amount), category: r.category,
      date: r.date, taxClassification: r.tax_classification,
      businessPct: Number(r.business_percentage), mileage: Number(r.associated_mileage || 0),
    }));

    const prompt = `You are a CPA and small business tax strategist.

BUSINESS: ${biz.name} (${biz.type}), entity: ${biz.entity_type || 'sole_prop'} in ${biz.state || 'unknown'}
Uses personal vehicle: ${Boolean(biz.uses_personal_vehicle)}
Has employees: ${Boolean(biz.has_employees)} (${biz.employees || 0})
YTD Revenue: $${Math.round(ytdRevenue)}, YTD Expenses: $${Math.round(ytdExpenses)}, Net: $${Math.round(ytdRevenue - ytdExpenses)}
Miles tracked: ${totalMiles}

EXPENSE CATEGORIES:
${Object.entries(expenseByCategory).sort(([,a],[,b]) => b - a).map(([cat, amt]) => `- ${cat}: $${Math.round(amt)}`).join('\n') || 'No receipts yet.'}

SAMPLE RECEIPTS: ${JSON.stringify(receiptSample)}

Identify missed deductions, under-claimed expenses, and tax-saving actions based on THEIR ACTUAL DATA.

Return ONLY JSON:
{
  "summary": "2-3 sentence overview",
  "missedDeductions": [{"title":"string","description":"string","estimatedAnnualSavings":number,"estimatedDeductionAmount":number,"evidenceFromData":"string","howToClaim":"string","irsForm":"string|null","documentationNeeded":["string"],"priority":"high|medium|low","difficulty":"easy|moderate|complex"}],
  "actionItems": [{"action":"string","deadline":"string|null","estimatedImpact":"string"}],
  "totalEstimatedSavings": number,
  "entityAdvice": "string|null"
}`;

    const result = await groqJSON(prompt, { maxTokens: 4000 });
    return res.json(result);
  } catch (err) {
    console.error('analyze-taxes error:', err);
    return res.status(500).json({ error: 'Tax analysis failed' });
  }
});

// ─── Analyze Contract ─────────────────────────────────────────────────────────

router.post('/ai/analyze-contract', requireSession, async (req, res) => {
  if (!isGroqConfigured()) {
    return res.status(503).json({ error: 'GROQ_API_KEY is not configured' });
  }

  try {
    const { contractText, businessId, contractId } = req.body || {};
    if (!contractText) return res.status(400).json({ error: 'contractText required' });

    const sql = getDb();
    const bizRows = await sql`SELECT name, type FROM businesses WHERE id = ${businessId} LIMIT 1`;
    const bizCtx = bizRows[0] ? `${bizRows[0].name} (${bizRows[0].type})` : 'small business';

    const prompt = `You are a contract analyst for ${bizCtx}. Analyze this contract and return structured JSON.

CONTRACT TEXT:
${contractText.slice(0, 8000)}

Return ONLY JSON:
{
  "summary": "plain-English summary of the contract",
  "contractType": "service|vendor|lease|employment|nda|partnership|other",
  "healthScore": 0-100,
  "clauses": [{"id":"string","title":"string","text":"string","risk":"low|medium|high","explanation":"string"}],
  "obligations": [{"id":"string","title":"string","description":"string","dueDate":"string|null","status":"pending","party":"us|them|both"}],
  "missingProtections": ["string"],
  "recommendations": ["string"],
  "keyDates": [{"label":"string","date":"string"}],
  "financialTerms": {"totalValue":number|null,"paymentSchedule":"string|null","penalties":"string|null"}
}`;

    const result = await groqJSON(prompt, { maxTokens: 4000 });

    if (contractId && businessId) {
      await sql`
        UPDATE contracts
        SET analysis = ${JSON.stringify(result)}::jsonb,
            health_score = ${result.healthScore || 82},
            obligations = ${JSON.stringify(result.obligations || [])}::jsonb
        WHERE id = ${contractId} AND business_id = ${businessId}
      `.catch((e) => console.error('Failed to save contract analysis:', e));
    }

    return res.json(result);
  } catch (err) {
    console.error('analyze-contract error:', err);
    return res.status(500).json({ error: 'Contract analysis failed' });
  }
});

// ─── Generate Quote ───────────────────────────────────────────────────────────

router.post('/ai/generate-quote', requireSession, async (req, res) => {
  if (!isGroqConfigured()) {
    return res.status(503).json({ error: 'GROQ_API_KEY is not configured' });
  }

  try {
    const { businessId, clientName, serviceDescription } = req.body || {};
    const sql = getDb();
    const bizRows = await sql`SELECT * FROM businesses WHERE id = ${businessId} LIMIT 1`;
    const biz = bizRows[0];

    const prompt = `You are a pricing consultant for ${biz?.name || 'a small business'} (${biz?.type || 'service'}).

Client: ${clientName || 'New client'}
Service requested: ${serviceDescription || 'General service'}

Generate a professional quote with competitive pricing. Return ONLY JSON:
{
  "services": [{"label":"string","description":"string","quantity":1,"unitPrice":number,"total":number}],
  "subtotal": number,
  "taxRate": 0.0,
  "taxAmount": number,
  "total": number,
  "pricingAnalysis": {
    "confidence": "high|medium|low",
    "marketComparison": "string",
    "recommendation": "string"
  },
  "validDays": 30,
  "notes": "string"
}`;

    const result = await groqJSON(prompt);
    return res.json(result);
  } catch (err) {
    console.error('generate-quote error:', err);
    return res.status(500).json({ error: 'Quote generation failed' });
  }
});

// ─── Generate Contract ────────────────────────────────────────────────────────

router.post('/ai/generate-contract', requireSession, async (req, res) => {
  if (!isGroqConfigured()) {
    return res.status(503).json({ error: 'GROQ_API_KEY is not configured' });
  }

  try {
    const { businessId, contractType, counterpartyName, terms } = req.body || {};
    const sql = getDb();
    const bizRows = await sql`SELECT * FROM businesses WHERE id = ${businessId} LIMIT 1`;
    const biz = bizRows[0];

    const prompt = `You are a legal document assistant for ${biz?.name || 'a small business'} in ${biz?.state || 'the US'}.

Generate a ${contractType || 'service'} agreement between "${biz?.name || 'Business'}" and "${counterpartyName || 'Client'}".
${terms ? `Additional terms: ${terms}` : ''}

Return ONLY JSON:
{
  "title": "string",
  "sections": [{"heading":"string","content":"string"}],
  "effectiveDate": null,
  "expirationDate": null,
  "totalValue": null,
  "keyTerms": ["string"]
}`;

    const result = await groqJSON(prompt, { maxTokens: 4000 });
    return res.json(result);
  } catch (err) {
    console.error('generate-contract error:', err);
    return res.status(500).json({ error: 'Contract generation failed' });
  }
});

// ─── Generate Compliance ──────────────────────────────────────────────────────

router.post('/ai/generate-compliance', requireSession, async (req, res) => {
  if (!isGroqConfigured()) {
    return res.status(503).json({ error: 'GROQ_API_KEY is not configured' });
  }

  try {
    const { businessId } = req.body || {};
    const sql = getDb();
    const bizRows = await sql`SELECT * FROM businesses WHERE id = ${businessId} LIMIT 1`;
    const biz = bizRows[0];
    if (!biz) return res.status(404).json({ error: 'Business not found' });

    const prompt = `You are a compliance specialist. Generate all required licenses, permits, and filings for:

Business: ${biz.name} (${biz.type})
State: ${biz.state || 'unknown'}, City: ${biz.city || 'unknown'}, ZIP: ${biz.zip || 'unknown'}
Entity type: ${biz.entity_type || 'sole_prop'}
Has employees: ${Boolean(biz.has_employees)}

Return ONLY a JSON array:
[{"title":"string","description":"string","jurisdiction":"federal|state|county|city","jurisdictionName":"string","category":"license|registration|permit|tax_filing|insurance|report","isRequired":true,"legalCitation":null,"applicationUrl":null,"cost":0,"renewalFrequency":"annual|quarterly|monthly|one_time","estimatedProcessingTime":"string","documentationRequired":["string"],"penaltyForNonCompliance":null}]`;

    const result = await groqJSON(prompt);
    const items = Array.isArray(result) ? result : result.complianceItems || [];

    // Save to DB
    for (const item of items) {
      await sql`
        INSERT INTO compliance_items (
          business_id, title, description, jurisdiction, jurisdiction_name,
          category, is_required, legal_citation, application_url, cost,
          renewal_frequency, estimated_processing_time, documentation_required,
          penalty_for_non_compliance, status
        ) VALUES (
          ${biz.id}, ${item.title}, ${item.description || ''},
          ${item.jurisdiction || 'state'}, ${item.jurisdictionName || biz.state || ''},
          ${item.category || 'license'}, ${item.isRequired !== false},
          ${item.legalCitation || null}, ${item.applicationUrl || null},
          ${Number(item.cost || 0)}, ${item.renewalFrequency || 'annual'},
          ${item.estimatedProcessingTime || ''}, ${JSON.stringify(item.documentationRequired || [])}::jsonb,
          ${item.penaltyForNonCompliance || null}, 'not_started'
        )
      `.catch((e) => console.error('Failed to insert compliance item:', e));
    }

    return res.json({ items, count: items.length });
  } catch (err) {
    console.error('generate-compliance error:', err);
    return res.status(500).json({ error: 'Compliance generation failed' });
  }
});

// ─── Scan Opportunities ───────────────────────────────────────────────────────

router.post('/ai/scan-opportunities', requireSession, async (req, res) => {
  if (!isGroqConfigured()) {
    return res.status(503).json({ error: 'GROQ_API_KEY is not configured' });
  }

  try {
    const { businessId } = req.body || {};
    const sql = getDb();
    const bizRows = await sql`SELECT * FROM businesses WHERE id = ${businessId} LIMIT 1`;
    const biz = bizRows[0];
    if (!biz) return res.status(404).json({ error: 'Business not found' });

    const prompt = `You are a growth advisor for small businesses. Identify funding and growth opportunities for:

Business: ${biz.name} (${biz.type}) in ${biz.city || ''}, ${biz.state || ''}
Monthly revenue: $${Number(biz.monthly_revenue_estimate || 0)}
Employees: ${biz.employees || 1}

Return ONLY JSON:
{
  "opportunities": [{"name":"string","provider":"string","type":"grant|loan|line_of_credit|accelerator|tax_credit","amountMin":number,"amountMax":number,"eligibilityMatch":0-100,"applicationUrl":"string","recommendation":"string","fitScore":0-100}],
  "actions": [{"type":"pricing|expense|milestone","title":"string","impact":"string","reasoning":"string","urgency":"high|medium|low","effort":"low|medium|high"}]
}`;

    const result = await groqJSON(prompt);
    return res.json(result);
  } catch (err) {
    console.error('scan-opportunities error:', err);
    return res.status(500).json({ error: 'Opportunity scan failed' });
  }
});

// ─── Scan Funding (TinyFish + AI fallback) ────────────────────────────────────

router.post('/ai/scan-funding', requireSession, async (req, res) => {
  if (!isGroqConfigured()) {
    return res.status(503).json({ error: 'GROQ_API_KEY is not configured' });
  }

  try {
    const { businessId } = req.body || {};
    const sql = getDb();
    const bizRows = await sql`SELECT * FROM businesses WHERE id = ${businessId} LIMIT 1`;
    const biz = bizRows[0];
    if (!biz) return res.status(404).json({ error: 'Business not found' });

    // Try TinyFish first if configured
    if (process.env.TINYFISH_API_KEY) {
      try {
        const tfRes = await fetch('https://api.tinyfish.io/v1/search', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.TINYFISH_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `small business funding grants loans ${biz.type} ${biz.state || ''}`,
            maxResults: 8,
          }),
        });

        if (tfRes.ok) {
          const tfData = await tfRes.json();
          return res.json({ source: 'tinyfish', results: tfData.results || [] });
        }
      } catch {
        // Fall through to AI
      }
    }

    // AI fallback
    const prompt = `Find real funding opportunities for a ${biz.type} business in ${biz.state || 'the US'} with ~$${Number(biz.monthly_revenue_estimate || 0)}/month revenue.

Return ONLY JSON array:
[{"name":"string","provider":"string","type":"grant|loan|line_of_credit","amountMin":number,"amountMax":number,"eligibilityMatch":0-100,"applicationUrl":"","recommendation":"string","fitScore":0-100}]`;

    const result = await groqJSON(prompt);
    return res.json({ source: 'ai-fallback', results: Array.isArray(result) ? result : [] });
  } catch (err) {
    console.error('scan-funding error:', err);
    return res.status(500).json({ error: 'Funding scan failed' });
  }
});

export default router;
