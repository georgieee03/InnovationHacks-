/**
 * AI routes — ported from LaunchPad's Next.js API routes to Express.
 * All routes use Groq for JSON generation.
 */
import { Router } from 'express';
import { requireSession } from '../auth.js';
import { getDb } from '../db.js';
import { groqJSON, groqVisionJSON, isGroqConfigured } from '../lib/groq.js';
import {
  generateCoverageActionPlan,
  loadCoveragePlanContext,
  saveCoverageActionPlan,
} from '../lib/coverageActionPlan.js';

const router = Router();

router.get('/ai/coverage-action-plan', requireSession, async (req, res) => {
  const { businessId } = req.query || {};
  if (!businessId) {
    return res.status(400).json({ error: 'businessId is required' });
  }

  try {
    const sql = getDb();
    const context = await loadCoveragePlanContext(sql, businessId, req.currentUser);

    if (!context.business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    return res.json(context);
  } catch (error) {
    console.error('coverage-action-plan get error:', error);
    return res.status(500).json({ error: 'Failed to load coverage action plan' });
  }
});

router.post('/ai/generate-coverage-action-plan', requireSession, async (req, res) => {
  const { businessId, financialMetrics = null, riskFactors = null } = req.body || {};
  if (!businessId) {
    return res.status(400).json({ error: 'businessId is required' });
  }

  try {
    const sql = getDb();
    const context = await loadCoveragePlanContext(sql, businessId, req.currentUser);

    if (!context.business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    if (!context.latestGapAnalysis) {
      return res.status(422).json({ error: 'Complete insurance analysis before generating an action plan.' });
    }

    const generatedPlan = await generateCoverageActionPlan({
      business: context.business,
      latestGapAnalysis: context.latestGapAnalysis,
      financialMetrics,
      riskFactors,
    });

    const savedPlan = await saveCoverageActionPlan(sql, businessId, context.latestGapAnalysis, generatedPlan);

    return res.json({
      business: context.business,
      latestGapAnalysis: context.latestGapAnalysis,
      latestPlan: savedPlan,
      currentScore: generatedPlan.currentScore,
      stale: false,
    });
  } catch (error) {
    console.error('coverage-action-plan generate error:', error);
    return res.status(500).json({ error: 'Failed to generate coverage action plan' });
  }
});

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

const CONTRACT_TYPE_LABELS = {
  service_agreement: 'Service Agreement',
  vendor_agreement: 'Vendor Agreement',
  nda: 'Non-Disclosure Agreement',
  independent_contractor: 'Independent Contractor Agreement',
  subcontractor_agreement: 'Subcontractor Agreement',
  retainer_agreement: 'Monthly Retainer Agreement',
  equipment_rental: 'Equipment Rental Agreement',
  partnership_agreement: 'Partnership Agreement',
};

/**
 * Section definitions per contract type.
 * Each entry is the ordered list of section keys the AI must populate.
 * The assembler renders them in this exact order with standardized headings.
 */
const CONTRACT_SECTIONS = {
  service_agreement: [
    'recitals', 'scope_of_services', 'compensation_and_payment', 'change_orders',
    'term_and_termination', 'independent_contractor_status', 'confidentiality',
    'intellectual_property', 'representations_and_warranties', 'limitation_of_liability',
    'indemnification', 'insurance', 'dispute_resolution', 'governing_law',
    'general_provisions',
  ],
  vendor_agreement: [
    'recitals', 'products_and_services', 'pricing_and_payment', 'delivery_and_acceptance',
    'term_and_termination', 'confidentiality', 'representations_and_warranties',
    'limitation_of_liability', 'indemnification', 'dispute_resolution',
    'governing_law', 'general_provisions',
  ],
  nda: [
    'recitals', 'definition_of_confidential_information', 'obligations_of_receiving_party',
    'exclusions', 'term', 'return_of_information', 'remedies',
    'governing_law', 'general_provisions',
  ],
  independent_contractor: [
    'recitals', 'services', 'compensation', 'independent_contractor_status',
    'work_product_and_ip', 'confidentiality', 'non_solicitation',
    'term_and_termination', 'representations_and_warranties', 'limitation_of_liability',
    'indemnification', 'governing_law', 'general_provisions',
  ],
  subcontractor_agreement: [
    'recitals', 'scope_of_work', 'compensation_and_payment', 'independent_contractor_status',
    'work_product_and_ip', 'confidentiality', 'compliance_with_prime_contract',
    'term_and_termination', 'limitation_of_liability', 'indemnification',
    'governing_law', 'general_provisions',
  ],
  retainer_agreement: [
    'recitals', 'scope_of_services', 'retainer_fee_and_billing', 'additional_services',
    'term_and_termination', 'independent_contractor_status', 'confidentiality',
    'intellectual_property', 'limitation_of_liability', 'indemnification',
    'dispute_resolution', 'governing_law', 'general_provisions',
  ],
  equipment_rental: [
    'recitals', 'equipment_description', 'rental_term_and_fees', 'delivery_and_return',
    'condition_and_maintenance', 'risk_of_loss', 'insurance',
    'default_and_remedies', 'limitation_of_liability', 'governing_law', 'general_provisions',
  ],
  partnership_agreement: [
    'recitals', 'formation_and_purpose', 'capital_contributions', 'profit_and_loss_allocation',
    'management_and_voting', 'partner_duties', 'transfer_restrictions',
    'dissolution_and_winding_up', 'confidentiality', 'dispute_resolution',
    'governing_law', 'general_provisions',
  ],
};

const SECTION_HEADINGS = {
  recitals: 'Recitals',
  scope_of_services: 'Scope of Services',
  scope_of_work: 'Scope of Work',
  services: 'Services',
  products_and_services: 'Products and Services',
  compensation_and_payment: 'Compensation and Payment',
  compensation: 'Compensation',
  retainer_fee_and_billing: 'Retainer Fee and Billing',
  additional_services: 'Additional Services',
  pricing_and_payment: 'Pricing and Payment',
  rental_term_and_fees: 'Rental Term and Fees',
  change_orders: 'Change Orders',
  delivery_and_acceptance: 'Delivery and Acceptance',
  delivery_and_return: 'Delivery and Return',
  equipment_description: 'Equipment Description',
  condition_and_maintenance: 'Condition and Maintenance',
  risk_of_loss: 'Risk of Loss',
  term_and_termination: 'Term and Termination',
  term: 'Term',
  default_and_remedies: 'Default and Remedies',
  independent_contractor_status: 'Independent Contractor Status',
  confidentiality: 'Confidentiality',
  definition_of_confidential_information: 'Definition of Confidential Information',
  obligations_of_receiving_party: 'Obligations of Receiving Party',
  exclusions: 'Exclusions from Confidential Information',
  return_of_information: 'Return or Destruction of Information',
  remedies: 'Remedies',
  intellectual_property: 'Intellectual Property',
  work_product_and_ip: 'Work Product and Intellectual Property',
  non_solicitation: 'Non-Solicitation',
  compliance_with_prime_contract: 'Compliance with Prime Contract',
  representations_and_warranties: 'Representations and Warranties',
  limitation_of_liability: 'Limitation of Liability',
  indemnification: 'Indemnification',
  insurance: 'Insurance',
  dispute_resolution: 'Dispute Resolution',
  governing_law: 'Governing Law and Jurisdiction',
  general_provisions: 'General Provisions',
  formation_and_purpose: 'Formation and Purpose',
  capital_contributions: 'Capital Contributions',
  profit_and_loss_allocation: 'Profit and Loss Allocation',
  management_and_voting: 'Management and Voting',
  partner_duties: 'Partner Duties and Obligations',
  transfer_restrictions: 'Transfer Restrictions',
  dissolution_and_winding_up: 'Dissolution and Winding Up',
};

/**
 * Assembles a fully formatted, print-ready HTML contract from structured JSON sections.
 * All layout, typography, and numbering is controlled here — not by the LLM.
 */
function assembleContractHtml(params) {
  const {
    typeLabel, contractNumber, effectiveDate,
    providerName, providerEntity, providerState, providerSignatory,
    clientName, clientEmail, clientCompany,
    sections, sectionKeys,
  } = params;

  const displayClient = clientCompany ? `${clientName}, on behalf of ${clientCompany}` : clientName;

  // Build numbered section HTML
  let sectionHtml = '';
  let sectionNum = 1;
  for (const key of sectionKeys) {
    const heading = SECTION_HEADINGS[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const content = sections[key] ?? '';
    if (!content) continue;

    // Convert plain newlines to paragraphs, preserve any sub-items starting with a number or bullet
    const paragraphs = content
      .split(/\n{1,}/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        // Sub-numbered items like "1.1" or "(a)" get indented
        if (/^(\d+\.\d+|\([a-z]\)|\([ivx]+\))/i.test(line)) {
          return `<p class="sub-clause">${line}</p>`;
        }
        return `<p>${line}</p>`;
      })
      .join('');

    sectionHtml += `
      <div class="section">
        <h2><span class="section-num">${sectionNum}.</span> ${heading}</h2>
        <div class="section-body">${paragraphs}</div>
      </div>`;
    sectionNum++;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${typeLabel} — ${providerName} / ${clientName}</title>
<style>
  /* ── Reset & base ── */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { font-size: 11pt; }
  body {
    font-family: "Times New Roman", Times, serif;
    color: #111;
    background: #fff;
    max-width: 8.5in;
    margin: 0 auto;
    padding: 1in 1.1in;
    line-height: 1.65;
  }

  /* ── Cover block ── */
  .cover {
    text-align: center;
    padding-bottom: 36pt;
    border-bottom: 2px solid #111;
    margin-bottom: 28pt;
  }
  .cover-label {
    font-size: 8pt;
    letter-spacing: .18em;
    text-transform: uppercase;
    color: #555;
    margin-bottom: 10pt;
  }
  .cover h1 {
    font-size: 18pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .06em;
    line-height: 1.25;
    margin-bottom: 18pt;
  }
  .cover-meta {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6pt 24pt;
    text-align: left;
    max-width: 420pt;
    margin: 0 auto;
    font-size: 9.5pt;
  }
  .cover-meta dt { color: #555; font-style: italic; }
  .cover-meta dd { font-weight: 600; }

  /* ── Parties block ── */
  .parties {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12pt 32pt;
    background: #f8f8f8;
    border: 1px solid #ddd;
    border-radius: 4pt;
    padding: 16pt 20pt;
    margin-bottom: 28pt;
    font-size: 9.5pt;
  }
  .party-label {
    font-size: 7.5pt;
    letter-spacing: .14em;
    text-transform: uppercase;
    color: #777;
    margin-bottom: 4pt;
  }
  .party-name { font-weight: 700; font-size: 11pt; }
  .party-detail { color: #444; margin-top: 2pt; }

  /* ── Sections ── */
  .section { margin-bottom: 22pt; }
  .section h2 {
    font-size: 10pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .08em;
    border-bottom: 1px solid #ccc;
    padding-bottom: 4pt;
    margin-bottom: 8pt;
    display: flex;
    gap: 6pt;
  }
  .section-num { color: #888; min-width: 18pt; }
  .section-body p {
    margin-bottom: 6pt;
    text-align: justify;
    hyphens: auto;
  }
  .section-body p.sub-clause {
    padding-left: 18pt;
    color: #222;
  }

  /* ── Signature block ── */
  .sig-block {
    margin-top: 40pt;
    padding-top: 20pt;
    border-top: 2px solid #111;
  }
  .sig-block h2 {
    font-size: 9pt;
    text-transform: uppercase;
    letter-spacing: .12em;
    color: #555;
    margin-bottom: 20pt;
    text-align: center;
  }
  .sig-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 32pt;
  }
  .sig-col { font-size: 9.5pt; }
  .sig-party-label {
    font-size: 7.5pt;
    letter-spacing: .12em;
    text-transform: uppercase;
    color: #777;
    margin-bottom: 32pt;
  }
  .sig-line {
    border-top: 1px solid #333;
    margin-bottom: 6pt;
  }
  .sig-field { margin-bottom: 10pt; }
  .sig-field-label { color: #666; font-size: 8.5pt; }
  .sig-field-value { font-weight: 600; white-space: pre-line; }

  /* ── Footer ── */
  .doc-footer {
    margin-top: 32pt;
    padding-top: 10pt;
    border-top: 1px solid #ddd;
    font-size: 8pt;
    color: #999;
    display: flex;
    justify-content: space-between;
  }

  /* ── Print ── */
  @media print {
    body { padding: .75in .9in; font-size: 10.5pt; }
    .section { page-break-inside: avoid; }
    .sig-block { page-break-inside: avoid; }
  }
</style>
</head>
<body>

<!-- Cover -->
<div class="cover">
  <p class="cover-label">Legal Agreement</p>
  <h1>${typeLabel}</h1>
  <dl class="cover-meta">
    <dt>Contract No.</dt><dd>${contractNumber}</dd>
    <dt>Effective Date</dt><dd>${effectiveDate}</dd>
    <dt>Governing Law</dt><dd>State of ${providerState}</dd>
    <dt>Document Type</dt><dd>${typeLabel}</dd>
  </dl>
</div>

<!-- Parties -->
<div class="parties">
  <div>
    <p class="party-label">Provider ("Company")</p>
    <p class="party-name">${providerName}</p>
    <p class="party-detail">${providerEntity} · ${providerState}</p>
    ${providerSignatory ? `<p class="party-detail">Signatory: ${providerSignatory}</p>` : ''}
  </div>
  <div>
    <p class="party-label">Client ("Client")</p>
    <p class="party-name">${displayClient}</p>
    ${clientEmail ? `<p class="party-detail">${clientEmail}</p>` : ''}
  </div>
</div>

<!-- Body sections -->
${sectionHtml}

<!-- Signature block -->
<div class="sig-block">
  <h2>Signatures</h2>
  <p style="font-size:9pt;color:#555;text-align:center;margin-bottom:20pt;">
    By signing below, each party agrees to be bound by the terms of this ${typeLabel}.
  </p>
  <div class="sig-grid">
    <div class="sig-col">
      <p class="sig-party-label">Provider — ${providerName}</p>
      <div class="sig-line"></div>
      <div class="sig-field">
        <p class="sig-field-label">Authorized Signature</p>
      </div>
      <div class="sig-field">
        <p class="sig-field-label">Printed Name</p>
        <p class="sig-field-value">${providerSignatory || providerName}</p>
      </div>
      <div class="sig-field">
        <p class="sig-field-label">Title</p>
        <p class="sig-field-value">Owner / Authorized Representative</p>
      </div>
      <div class="sig-field">
        <p class="sig-field-label">Date</p>
        <p class="sig-field-value">___________________________</p>
      </div>
    </div>
    <div class="sig-col">
      <p class="sig-party-label">Client — ${clientCompany || clientName}</p>
      <div class="sig-line"></div>
      <div class="sig-field">
        <p class="sig-field-label">Authorized Signature</p>
      </div>
      <div class="sig-field">
        <p class="sig-field-label">Printed Name</p>
        <p class="sig-field-value">${clientName}</p>
      </div>
      <div class="sig-field">
        <p class="sig-field-label">Title</p>
        <p class="sig-field-value">___________________________</p>
      </div>
      <div class="sig-field">
        <p class="sig-field-label">Date</p>
        <p class="sig-field-value">___________________________</p>
      </div>
    </div>
  </div>
</div>

<!-- Footer -->
<div class="doc-footer">
  <span>${typeLabel} · Contract No. ${contractNumber}</span>
  <span>Confidential — ${providerName} / ${clientCompany || clientName}</span>
</div>

</body>
</html>`;
}

router.post('/ai/generate-contract', requireSession, async (req, res) => {
  if (!isGroqConfigured()) {
    return res.status(503).json({ error: 'GROQ_API_KEY is not configured' });
  }

  try {
    const { businessId, contractType, clientName, clientEmail, customFields } = req.body || {};
    if (!clientName) return res.status(400).json({ error: 'clientName is required' });

    const sql = getDb();
    const bizRows = await sql`SELECT * FROM businesses WHERE id = ${businessId} LIMIT 1`;
    const biz = bizRows[0];

    const typeLabel = CONTRACT_TYPE_LABELS[contractType] ?? 'Service Agreement';
    const sectionKeys = CONTRACT_SECTIONS[contractType] ?? CONTRACT_SECTIONS.service_agreement;
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const contractNumber = `${(contractType ?? 'SVC').slice(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    const customFieldsText = customFields
      ? Object.entries(customFields).map(([k, v]) => `${k}: ${v}`).join('\n')
      : '';

    // Ask the LLM only for section text — all formatting is handled by assembleContractHtml
    const prompt = `You are a commercial contracts attorney drafting a ${typeLabel}.

PARTIES:
- Provider ("Company"): ${biz?.name || 'Company'}, a ${biz?.entity_type || 'LLC'} organized in ${biz?.state || 'the US'}. Signatory: ${biz?.owner_name || 'Owner'}.
- Client: ${clientName}${clientEmail ? ` (${clientEmail})` : ''}${customFields?.['Client company'] ? `, ${customFields['Client company']}` : ''}
- Effective Date: ${today}

CONTRACT TERMS:
${customFieldsText || 'Standard commercial terms apply.'}

Write the body text for each of these sections. Use plain English — no legalese jargon without explanation. Be specific and concrete. Protect the Provider.

Return ONLY a JSON object where each key is a section identifier and the value is the full paragraph text for that section. Use \\n to separate sub-paragraphs within a section. Do not include section headings or numbers in the values.

Required sections (use these exact keys):
${sectionKeys.map((k) => `"${k}"`).join(', ')}

Example format:
{
  "recitals": "This ${typeLabel} (the \\"Agreement\\") is entered into as of ${today}, by and between ${biz?.name || 'Company'} (\\"Company\\") and ${clientName} (\\"Client\\"). The parties desire to set forth the terms and conditions under which Company will provide services to Client.",
  "scope_of_services": "Company shall provide the following services: ...",
  ...
}`;

    const sections = await groqJSON(prompt, { maxTokens: 4096 });

    const fullHtml = assembleContractHtml({
      typeLabel,
      contractNumber,
      effectiveDate: today,
      providerName: biz?.name || 'Company',
      providerEntity: biz?.entity_type || 'LLC',
      providerState: biz?.state || 'US',
      providerSignatory: biz?.owner_name || '',
      clientName,
      clientEmail: clientEmail || '',
      clientCompany: customFields?.['Client company'] || '',
      sections,
      sectionKeys,
    });

    return res.json({ html: fullHtml, contractType, clientName });
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
