/**
 * /api/data/businesses/:businessId/* — full CRUD layer.
 * Mirrors the business.graph.ts service from the Next.js version.
 * All routes verify the business belongs to the current user before operating.
 */
import { Router } from 'express';
import multer from 'multer';
import { put } from '@vercel/blob';
import { requireSession } from '../auth.js';
import { getDb } from '../db.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });

// ─── Ownership guard ──────────────────────────────────────────────────────────
async function requireOwnedBusiness(sql, req, res) {
  const { businessId } = req.params;
  if (!businessId) { res.status(400).json({ error: 'businessId required' }); return null; }

  const rows = req.currentUser?.auth0Id
    ? await sql`SELECT * FROM businesses WHERE id = ${businessId} AND auth0_id = ${req.currentUser.auth0Id} LIMIT 1`
    : await sql`SELECT * FROM businesses WHERE id = ${businessId} LIMIT 1`;

  if (!rows[0]) { res.status(404).json({ error: 'Business not found' }); return null; }
  return rows[0];
}

router.use(requireSession);

// ─── Business CRUD ────────────────────────────────────────────────────────────

router.post('/', async (req, res) => {
  const sql = getDb();
  try {
    const { userId, ...data } = req.body || {};
    const rows = await sql`
      INSERT INTO businesses (auth0_id, name, type, zip, city, state, monthly_revenue_estimate, employees, owner_name, owner_email, entity_type, onboarding_stage)
      VALUES (${req.currentUser.auth0Id || userId || null}, ${data.businessName || data.name || ''}, ${data.businessType || data.type || 'service'}, ${data.zip || ''}, ${data.city || null}, ${data.state || null}, ${data.monthlyRevenue || 0}, ${data.employeeCount || 1}, ${data.ownerName || ''}, ${data.ownerEmail || ''}, ${data.entityType || 'sole_prop'}, ${data.onboardingStage || 'active'})
      ON CONFLICT (auth0_id) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, updated_at = NOW()
      RETURNING *
    `;
    res.status(201).json({ id: String(rows[0].id), ...rows[0] });
  } catch (e) { console.error('Create business error:', e); res.status(500).json({ error: 'Failed to create business' }); }
});

router.get('/', async (req, res) => {
  const sql = getDb();
  try {
    const { userId } = req.query;
    const auth0Id = req.currentUser?.auth0Id || userId;
    const rows = auth0Id
      ? await sql`SELECT * FROM businesses WHERE auth0_id = ${auth0Id} LIMIT 1`
      : await sql`SELECT * FROM businesses ORDER BY id DESC LIMIT 1`;
    res.json(rows[0] ? normalizeBusinessOut(rows[0]) : null);
  } catch (e) { res.status(500).json({ error: 'Failed to get business' }); }
});

router.get('/:businessId', async (req, res) => {
  const sql = getDb();
  const biz = await requireOwnedBusiness(sql, req, res);
  if (!biz) return;
  res.json(normalizeBusinessOut(biz));
});

router.patch('/:businessId', async (req, res) => {
  const sql = getDb();
  const biz = await requireOwnedBusiness(sql, req, res);
  if (!biz) return;
  try {
    const d = req.body || {};
    const rows = await sql`
      UPDATE businesses SET
        name = COALESCE(${d.businessName || d.name || null}, name),
        type = COALESCE(${d.businessType || d.type || null}, type),
        owner_name = COALESCE(${d.ownerName || null}, owner_name),
        owner_email = COALESCE(${d.ownerEmail || null}, owner_email),
        entity_type = COALESCE(${d.entityType || null}, entity_type),
        onboarding_stage = COALESCE(${d.onboardingStage || null}, onboarding_stage),
        monthly_revenue_estimate = COALESCE(${d.monthlyRevenue ?? null}, monthly_revenue_estimate),
        updated_at = NOW()
      WHERE id = ${biz.id} RETURNING *
    `;
    res.json(normalizeBusinessOut(rows[0]));
  } catch (e) { res.status(500).json({ error: 'Failed to update business' }); }
});

// ─── Contracts ────────────────────────────────────────────────────────────────

router.get('/:businessId/contracts', async (req, res) => {
  const sql = getDb();
  const biz = await requireOwnedBusiness(sql, req, res);
  if (!biz) return;
  try {
    const rows = await sql`SELECT * FROM contracts WHERE business_id = ${biz.id} ORDER BY created_at DESC`;
    res.json(rows.map(normalizeContractOut));
  } catch (e) { res.status(500).json({ error: 'Failed to load contracts' }); }
});

router.post('/:businessId/contracts', async (req, res) => {
  const sql = getDb();
  const biz = await requireOwnedBusiness(sql, req, res);
  if (!biz) return;
  try {
    const d = req.body || {};
    const rows = await sql`
      INSERT INTO contracts (business_id, file_name, file_url, file_type, contract_type, counterparty_name, effective_date, expiration_date, auto_renews, total_value, monthly_value, health_score, status, analysis, obligations)
      VALUES (${biz.id}, ${d.fileName || ''}, ${d.fileUrl || ''}, ${d.fileType || 'pdf'}, ${d.contractType || 'service'}, ${d.counterpartyName || ''}, ${d.effectiveDate || null}, ${d.expirationDate || null}, ${Boolean(d.autoRenews)}, ${d.totalValue || null}, ${d.monthlyValue || null}, ${d.healthScore || 100}, ${d.status || 'draft'}, ${JSON.stringify(d.analysis || {})}::jsonb, ${JSON.stringify(d.obligations || [])}::jsonb)
      RETURNING *
    `;
    res.status(201).json({ id: String(rows[0].id), ...normalizeContractOut(rows[0]) });
  } catch (e) { console.error('Create contract error:', e); res.status(500).json({ error: 'Failed to create contract' }); }
});

router.get('/:businessId/contracts/:contractId', async (req, res) => {
  const sql = getDb();
  const biz = await requireOwnedBusiness(sql, req, res);
  if (!biz) return;
  try {
    const rows = await sql`SELECT * FROM contracts WHERE id = ${req.params.contractId} AND business_id = ${biz.id} LIMIT 1`;
    if (!rows[0]) return res.status(404).json({ error: 'Contract not found' });
    res.json(normalizeContractOut(rows[0]));
  } catch (e) { res.status(500).json({ error: 'Failed to get contract' }); }
});

router.patch('/:businessId/contracts/:contractId', async (req, res) => {
  const sql = getDb();
  const biz = await requireOwnedBusiness(sql, req, res);
  if (!biz) return;
  try {
    const d = req.body || {};
    const rows = await sql`
      UPDATE contracts SET
        contract_type = COALESCE(${d.contractType || null}, contract_type),
        counterparty_name = COALESCE(${d.counterpartyName || null}, counterparty_name),
        status = COALESCE(${d.status || null}, status),
        health_score = COALESCE(${d.healthScore ?? null}, health_score),
        analysis = COALESCE(${d.analysis ? JSON.stringify(d.analysis) + '::jsonb' : null}, analysis),
        obligations = COALESCE(${d.obligations ? JSON.stringify(d.obligations) + '::jsonb' : null}, obligations),
        updated_at = NOW()
      WHERE id = ${req.params.contractId} AND business_id = ${biz.id} RETURNING *
    `;
    if (!rows[0]) return res.status(404).json({ error: 'Contract not found' });
    res.json(normalizeContractOut(rows[0]));
  } catch (e) { res.status(500).json({ error: 'Failed to update contract' }); }
});

router.delete('/:businessId/contracts/:contractId', async (req, res) => {
  const sql = getDb();
  const biz = await requireOwnedBusiness(sql, req, res);
  if (!biz) return;
  try {
    await sql`DELETE FROM contracts WHERE id = ${req.params.contractId} AND business_id = ${biz.id}`;
    res.status(204).end();
  } catch (e) { res.status(500).json({ error: 'Failed to delete contract' }); }
});

// ─── Receipts ─────────────────────────────────────────────────────────────────

router.get('/:businessId/receipts', async (req, res) => {
  const sql = getDb();
  const biz = await requireOwnedBusiness(sql, req, res);
  if (!biz) return;
  try {
    const { category, startDate, endDate } = req.query;
    let rows = await sql`SELECT * FROM receipts WHERE business_id = ${biz.id} ORDER BY date DESC, id DESC`;
    if (category) rows = rows.filter(r => r.category === category);
    if (startDate) rows = rows.filter(r => r.date >= startDate);
    if (endDate) rows = rows.filter(r => r.date <= endDate);
    res.json(rows.map(normalizeReceiptOut));
  } catch (e) { res.status(500).json({ error: 'Failed to load receipts' }); }
});

router.post('/:businessId/receipts', async (req, res) => {
  const sql = getDb();
  const biz = await requireOwnedBusiness(sql, req, res);
  if (!biz) return;
  try {
    const d = req.body || {};
    const amount = Number(d.amount || 0);
    const pct = Number(d.businessPercentage || 100);
    const deductible = Number(d.deductibleAmount || amount * pct / 100);
    const rows = await sql`
      INSERT INTO receipts (business_id, image_url, vendor, amount, date, line_items, category, tax_classification, business_percentage, deductible_amount, tax_notes, is_reconciled, associated_mileage, needs_more_info, pending_question)
      VALUES (${biz.id}, ${d.imageUrl || ''}, ${d.vendor || ''}, ${amount}, ${d.date || new Date().toISOString().slice(0, 10)}, ${JSON.stringify(d.lineItems || [])}::jsonb, ${d.category || 'other'}, ${d.taxClassification || 'expense'}, ${pct}, ${deductible}, ${d.taxNotes || ''}, ${Boolean(d.isReconciled)}, ${d.associatedMileage || null}, ${Boolean(d.needsMoreInfo)}, ${d.pendingQuestion || null})
      RETURNING *
    `;
    res.status(201).json({ id: String(rows[0].id), ...normalizeReceiptOut(rows[0]) });
  } catch (e) { console.error('Create receipt error:', e); res.status(500).json({ error: 'Failed to create receipt' }); }
});

router.patch('/:businessId/receipts/:receiptId', async (req, res) => {
  const sql = getDb();
  const biz = await requireOwnedBusiness(sql, req, res);
  if (!biz) return;
  try {
    const d = req.body || {};
    const rows = await sql`
      UPDATE receipts SET
        vendor = COALESCE(${d.vendor || null}, vendor),
        amount = COALESCE(${d.amount ?? null}, amount),
        category = COALESCE(${d.category || null}, category),
        tax_classification = COALESCE(${d.taxClassification || null}, tax_classification),
        business_percentage = COALESCE(${d.businessPercentage ?? null}, business_percentage),
        deductible_amount = COALESCE(${d.deductibleAmount ?? null}, deductible_amount),
        tax_notes = COALESCE(${d.taxNotes || null}, tax_notes),
        is_reconciled = COALESCE(${d.isReconciled ?? null}, is_reconciled)
      WHERE id = ${req.params.receiptId} AND business_id = ${biz.id} RETURNING *
    `;
    if (!rows[0]) return res.status(404).json({ error: 'Receipt not found' });
    res.json(normalizeReceiptOut(rows[0]));
  } catch (e) { res.status(500).json({ error: 'Failed to update receipt' }); }
});

router.delete('/:businessId/receipts/:receiptId', async (req, res) => {
  const sql = getDb();
  const biz = await requireOwnedBusiness(sql, req, res);
  if (!biz) return;
  try {
    await sql`DELETE FROM receipts WHERE id = ${req.params.receiptId} AND business_id = ${biz.id}`;
    res.status(204).end();
  } catch (e) { res.status(500).json({ error: 'Failed to delete receipt' }); }
});

// ─── Quotes ───────────────────────────────────────────────────────────────────

router.get('/:businessId/quotes', async (req, res) => {
  const sql = getDb();
  const biz = await requireOwnedBusiness(sql, req, res);
  if (!biz) return;
  try {
    const { status } = req.query;
    const rows = status
      ? await sql`SELECT * FROM quotes WHERE business_id = ${biz.id} AND status = ${status} ORDER BY created_at DESC`
      : await sql`SELECT * FROM quotes WHERE business_id = ${biz.id} ORDER BY created_at DESC`;
    res.json(rows.map(normalizeQuoteOut));
  } catch (e) { res.status(500).json({ error: 'Failed to load quotes' }); }
});

router.post('/:businessId/quotes', async (req, res) => {
  const sql = getDb();
  const biz = await requireOwnedBusiness(sql, req, res);
  if (!biz) return;
  try {
    const d = req.body || {};
    const services = Array.isArray(d.services) ? d.services : String(d.services || '').split('\n').filter(Boolean).map(l => ({ label: l.trim() }));
    const subtotal = Number(d.subtotal || 0);
    const taxRate = Number(d.taxRate || 0);
    const taxAmount = Number(d.taxAmount || subtotal * taxRate);
    const rows = await sql`
      INSERT INTO quotes (business_id, client_name, client_email, client_phone, services, subtotal, tax_rate, tax_amount, total, status, scheduled_date)
      VALUES (${biz.id}, ${d.clientName || ''}, ${d.clientEmail || ''}, ${d.clientPhone || ''}, ${JSON.stringify(services)}::jsonb, ${subtotal}, ${taxRate}, ${taxAmount}, ${Number(d.total || subtotal + taxAmount)}, ${d.status || 'draft'}, ${d.scheduledDate || null})
      RETURNING *
    `;
    res.status(201).json({ id: String(rows[0].id), ...normalizeQuoteOut(rows[0]) });
  } catch (e) { console.error('Create quote error:', e); res.status(500).json({ error: 'Failed to create quote' }); }
});

router.patch('/:businessId/quotes/:quoteId', async (req, res) => {
  const sql = getDb();
  const biz = await requireOwnedBusiness(sql, req, res);
  if (!biz) return;
  try {
    const d = req.body || {};
    const rows = await sql`
      UPDATE quotes SET
        status = COALESCE(${d.status || null}, status),
        client_name = COALESCE(${d.clientName || null}, client_name),
        total = COALESCE(${d.total ?? null}, total),
        updated_at = NOW()
      WHERE id = ${req.params.quoteId} AND business_id = ${biz.id} RETURNING *
    `;
    if (!rows[0]) return res.status(404).json({ error: 'Quote not found' });
    res.json(normalizeQuoteOut(rows[0]));
  } catch (e) { res.status(500).json({ error: 'Failed to update quote' }); }
});

router.delete('/:businessId/quotes/:quoteId', async (req, res) => {
  const sql = getDb();
  const biz = await requireOwnedBusiness(sql, req, res);
  if (!biz) return;
  try {
    await sql`DELETE FROM quotes WHERE id = ${req.params.quoteId} AND business_id = ${biz.id}`;
    res.status(204).end();
  } catch (e) { res.status(500).json({ error: 'Failed to delete quote' }); }
});

// ─── Compliance ───────────────────────────────────────────────────────────────

router.get('/:businessId/compliance', async (req, res) => {
  const sql = getDb();
  const biz = await requireOwnedBusiness(sql, req, res);
  if (!biz) return;
  try {
    const rows = await sql`SELECT * FROM compliance_items WHERE business_id = ${biz.id} ORDER BY is_required DESC, created_at ASC`;
    res.json(rows.map(normalizeComplianceOut));
  } catch (e) { res.status(500).json({ error: 'Failed to load compliance items' }); }
});

router.post('/:businessId/compliance', async (req, res) => {
  const sql = getDb();
  const biz = await requireOwnedBusiness(sql, req, res);
  if (!biz) return;
  try {
    const d = req.body || {};
    const rows = await sql`
      INSERT INTO compliance_items (business_id, title, description, jurisdiction, jurisdiction_name, category, is_required, legal_citation, application_url, cost, renewal_frequency, estimated_processing_time, documentation_required, penalty_for_non_compliance, status)
      VALUES (${biz.id}, ${d.title || ''}, ${d.description || ''}, ${d.jurisdiction || 'state'}, ${d.jurisdictionName || ''}, ${d.category || 'license'}, ${d.isRequired !== false}, ${d.legalCitation || null}, ${d.applicationUrl || null}, ${Number(d.cost || 0)}, ${d.renewalFrequency || 'annual'}, ${d.estimatedProcessingTime || ''}, ${JSON.stringify(d.documentationRequired || [])}::jsonb, ${d.penaltyForNonCompliance || null}, ${d.status || 'not_started'})
      RETURNING *
    `;
    res.status(201).json({ id: String(rows[0].id), ...normalizeComplianceOut(rows[0]) });
  } catch (e) { res.status(500).json({ error: 'Failed to create compliance item' }); }
});

router.patch('/:businessId/compliance/:itemId', async (req, res) => {
  const sql = getDb();
  const biz = await requireOwnedBusiness(sql, req, res);
  if (!biz) return;
  try {
    const d = req.body || {};
    const rows = await sql`
      UPDATE compliance_items SET
        status = COALESCE(${d.status || null}, status),
        obtained_date = COALESCE(${d.obtainedDate || null}, obtained_date),
        expiration_date = COALESCE(${d.expirationDate || null}, expiration_date),
        proof_url = COALESCE(${d.proofUrl || null}, proof_url),
        updated_at = NOW()
      WHERE id = ${req.params.itemId} AND business_id = ${biz.id} RETURNING *
    `;
    if (!rows[0]) return res.status(404).json({ error: 'Compliance item not found' });
    res.json(normalizeComplianceOut(rows[0]));
  } catch (e) { res.status(500).json({ error: 'Failed to update compliance item' }); }
});

router.delete('/:businessId/compliance/:itemId', async (req, res) => {
  const sql = getDb();
  const biz = await requireOwnedBusiness(sql, req, res);
  if (!biz) return;
  try {
    await sql`DELETE FROM compliance_items WHERE id = ${req.params.itemId} AND business_id = ${biz.id}`;
    res.status(204).end();
  } catch (e) { res.status(500).json({ error: 'Failed to delete compliance item' }); }
});

// ─── Funding Opportunities ────────────────────────────────────────────────────

router.get('/:businessId/funding', async (req, res) => {
  const sql = getDb();
  const biz = await requireOwnedBusiness(sql, req, res);
  if (!biz) return;
  try {
    const rows = await sql`SELECT * FROM funding_opportunities WHERE business_id = ${biz.id} ORDER BY fit_score DESC, created_at DESC`;
    res.json(rows.map(normalizeFundingOut));
  } catch (e) { res.status(500).json({ error: 'Failed to load funding opportunities' }); }
});

router.post('/:businessId/funding', async (req, res) => {
  const sql = getDb();
  const biz = await requireOwnedBusiness(sql, req, res);
  if (!biz) return;
  try {
    const d = req.body || {};
    const rows = await sql`
      INSERT INTO funding_opportunities (business_id, name, provider, type, amount_min, amount_max, interest_rate, repayment_terms, eligibility_match, eligibility_criteria, application_url, application_deadline, status, fit_score, recommendation, estimated_time_to_apply)
      VALUES (${biz.id}, ${d.name || ''}, ${d.provider || ''}, ${d.type || 'other'}, ${Number(d.amountMin || 0)}, ${Number(d.amountMax || 0)}, ${d.interestRate || null}, ${d.repaymentTerms || null}, ${Number(d.eligibilityMatch || 0)}, ${JSON.stringify(d.eligibilityCriteria || [])}::jsonb, ${d.applicationUrl || ''}, ${d.applicationDeadline || null}, ${d.status || 'discovered'}, ${Number(d.fitScore || 0)}, ${d.recommendation || ''}, ${d.estimatedTimeToApply || ''})
      RETURNING *
    `;
    res.status(201).json({ id: String(rows[0].id), ...normalizeFundingOut(rows[0]) });
  } catch (e) { res.status(500).json({ error: 'Failed to create funding opportunity' }); }
});

router.patch('/:businessId/funding/:opportunityId', async (req, res) => {
  const sql = getDb();
  const biz = await requireOwnedBusiness(sql, req, res);
  if (!biz) return;
  try {
    const d = req.body || {};
    const rows = await sql`
      UPDATE funding_opportunities SET
        status = COALESCE(${d.status || null}, status),
        application_progress = COALESCE(${d.applicationProgress ?? null}, application_progress),
        updated_at = NOW()
      WHERE id = ${req.params.opportunityId} AND business_id = ${biz.id} RETURNING *
    `;
    if (!rows[0]) return res.status(404).json({ error: 'Funding opportunity not found' });
    res.json(normalizeFundingOut(rows[0]));
  } catch (e) { res.status(500).json({ error: 'Failed to update funding opportunity' }); }
});

// ─── Bank Transactions ────────────────────────────────────────────────────────

router.get('/:businessId/bank-transactions', async (req, res) => {
  const sql = getDb();
  const biz = await requireOwnedBusiness(sql, req, res);
  if (!biz) return;
  try {
    const { startDate, endDate } = req.query;
    let rows = await sql`SELECT * FROM bank_transactions WHERE business_id = ${biz.id} ORDER BY date DESC, id DESC`;
    if (startDate) rows = rows.filter(r => r.date >= startDate);
    if (endDate) rows = rows.filter(r => r.date <= endDate);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: 'Failed to load bank transactions' }); }
});

// ─── Plaid Connections ────────────────────────────────────────────────────────

router.get('/:businessId/plaid-connections', async (req, res) => {
  const sql = getDb();
  const biz = await requireOwnedBusiness(sql, req, res);
  if (!biz) return;
  try {
    const rows = await sql`SELECT item_id, institution_name, accounts, last_synced_at, status FROM plaid_connections WHERE business_id = ${biz.id}`;
    res.json(rows.map(r => ({
      itemId: r.item_id,
      institutionName: r.institution_name,
      accounts: r.accounts || [],
      lastSyncedAt: r.last_synced_at,
      status: r.status,
    })));
  } catch (e) { res.status(500).json({ error: 'Failed to load Plaid connections' }); }
});

// ─── Growth Actions ───────────────────────────────────────────────────────────

router.get('/:businessId/growth-actions', async (req, res) => {
  const sql = getDb();
  const biz = await requireOwnedBusiness(sql, req, res);
  if (!biz) return;
  try {
    const rows = await sql`SELECT * FROM growth_actions WHERE business_id = ${biz.id} AND dismissed = FALSE ORDER BY created_at ASC`;
    res.json(rows.map(r => ({
      id: String(r.id), type: r.type, title: r.title, impact: r.impact,
      reasoning: r.reasoning, urgency: r.urgency, effort: r.effort, dismissed: r.dismissed,
    })));
  } catch (e) { res.status(500).json({ error: 'Failed to load growth actions' }); }
});

router.patch('/:businessId/growth-actions/:actionId', async (req, res) => {
  const sql = getDb();
  const biz = await requireOwnedBusiness(sql, req, res);
  if (!biz) return;
  try {
    const rows = await sql`
      UPDATE growth_actions SET dismissed = ${Boolean(req.body?.dismissed)}
      WHERE id = ${req.params.actionId} AND business_id = ${biz.id} RETURNING *
    `;
    if (!rows[0]) return res.status(404).json({ error: 'Growth action not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: 'Failed to update growth action' }); }
});

// ─── Uploaded Files ───────────────────────────────────────────────────────────

router.get('/:businessId/files', async (req, res) => {
  const sql = getDb();
  const biz = await requireOwnedBusiness(sql, req, res);
  if (!biz) return;
  try {
    const rows = await sql`SELECT * FROM uploaded_files WHERE business_id = ${biz.id} ORDER BY created_at DESC`;
    res.json(rows.map(r => ({
      id: String(r.id), blobUrl: r.blob_url, fileName: r.file_name,
      fileSize: r.file_size, mimeType: r.mime_type, folder: r.folder,
      analysisStatus: r.analysis_status, linkedType: r.linked_type,
      linkedId: r.linked_id, createdAt: r.created_at,
    })));
  } catch (e) { res.status(500).json({ error: 'Failed to load files' }); }
});

router.post('/:businessId/files/upload', upload.single('file'), async (req, res) => {
  const sql = getDb();
  const biz = await requireOwnedBusiness(sql, req, res);
  if (!biz) return;
  if (!req.file) return res.status(400).json({ error: 'File is required' });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return res.status(503).json({ error: 'Blob storage not configured' });

  try {
    const folder = String(req.body?.folder || 'general').trim();
    const safeName = req.file.originalname.replace(/[^\w.-]+/g, '-').slice(0, 80);
    const pathname = `businesses/${biz.id}/${folder}/${Date.now()}_${safeName}`;
    const blob = await put(pathname, req.file.buffer, {
      access: 'public', addRandomSuffix: false,
      contentType: req.file.mimetype || 'application/octet-stream',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    const rows = await sql`
      INSERT INTO uploaded_files (business_id, blob_url, blob_path, file_name, file_size, mime_type, folder, analysis_status)
      VALUES (${biz.id}, ${blob.url}, ${pathname}, ${req.file.originalname}, ${req.file.size}, ${req.file.mimetype}, ${folder}, 'pending')
      RETURNING *
    `;
    res.status(201).json({ id: String(rows[0].id), blobUrl: rows[0].blob_url, fileName: rows[0].file_name, mimeType: rows[0].mime_type, folder: rows[0].folder });
  } catch (e) { console.error('File upload error:', e); res.status(500).json({ error: 'Failed to upload file' }); }
});

// ─── Normalizers — snake_case DB → camelCase API ──────────────────────────────

function normalizeBusinessOut(r) {
  return {
    id: String(r.id),
    auth0Id: r.auth0_id,
    businessName: r.name,
    businessType: r.type,
    entityType: r.entity_type,
    entityState: r.state,
    ownerName: r.owner_name,
    ownerEmail: r.owner_email,
    ownerPhone: r.owner_phone,
    zip: r.zip,
    city: r.city,
    state: r.state,
    onboardingStage: r.onboarding_stage,
    monthlyRevenue: Number(r.monthly_revenue_estimate || r.monthly_revenue_avg || 0),
    employees: Number(r.employees || 1),
    hasEmployees: Boolean(r.has_employees),
    hasContractors: Boolean(r.has_contractors),
    usesPersonalVehicle: Boolean(r.uses_personal_vehicle),
    serviceTypes: r.service_types || [],
    completedSteps: r.completed_steps || [],
    financials: {
      monthlyRevenueAvg: Number(r.monthly_revenue_avg || 0),
      monthlyExpenseAvg: Number(r.monthly_expense_avg || 0),
      totalRevenueYTD: Number(r.total_revenue_ytd || 0),
      totalExpensesYTD: Number(r.total_expenses_ytd || 0),
      lastUpdated: r.financials_updated_at || null,
    },
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function normalizeContractOut(r) {
  return {
    id: String(r.id),
    businessId: String(r.business_id),
    fileName: r.file_name,
    fileUrl: r.file_url,
    fileType: r.file_type,
    contractType: r.contract_type,
    counterpartyName: r.counterparty_name,
    effectiveDate: r.effective_date,
    expirationDate: r.expiration_date,
    autoRenews: Boolean(r.auto_renews),
    autoRenewalDate: r.auto_renewal_date,
    totalValue: r.total_value ? Number(r.total_value) : null,
    monthlyValue: r.monthly_value ? Number(r.monthly_value) : null,
    healthScore: r.health_score ? Number(r.health_score) : null,
    status: r.status,
    analysis: tryParse(r.analysis),
    obligations: tryParse(r.obligations) || [],
    uploadedAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function normalizeReceiptOut(r) {
  return {
    id: String(r.id),
    businessId: String(r.business_id),
    imageUrl: r.image_url,
    vendor: r.vendor,
    amount: Number(r.amount || 0),
    date: r.date,
    lineItems: tryParse(r.line_items) || [],
    category: r.category,
    taxClassification: r.tax_classification,
    businessPercentage: Number(r.business_percentage || 100),
    deductibleAmount: Number(r.deductible_amount || 0),
    taxNotes: r.tax_notes,
    isReconciled: Boolean(r.is_reconciled),
    associatedMileage: r.associated_mileage ? Number(r.associated_mileage) : null,
    needsMoreInfo: Boolean(r.needs_more_info),
    pendingQuestion: r.pending_question,
    uploadedAt: r.created_at,
  };
}

function normalizeQuoteOut(r) {
  return {
    id: String(r.id),
    businessId: String(r.business_id),
    clientName: r.client_name,
    clientEmail: r.client_email,
    clientPhone: r.client_phone,
    services: tryParse(r.services) || [],
    subtotal: Number(r.subtotal || 0),
    taxRate: Number(r.tax_rate || 0),
    taxAmount: Number(r.tax_amount || 0),
    total: Number(r.total || 0),
    pricingAnalysis: tryParse(r.pricing_analysis),
    status: r.status,
    scheduledDate: r.scheduled_date,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function normalizeComplianceOut(r) {
  return {
    id: String(r.id),
    businessId: String(r.business_id),
    title: r.title,
    description: r.description,
    jurisdiction: r.jurisdiction,
    jurisdictionName: r.jurisdiction_name,
    category: r.category,
    isRequired: Boolean(r.is_required),
    status: r.status,
    legalCitation: r.legal_citation,
    applicationUrl: r.application_url,
    cost: r.cost ? Number(r.cost) : null,
    renewalFrequency: r.renewal_frequency,
    estimatedProcessingTime: r.estimated_processing_time,
    documentationRequired: tryParse(r.documentation_required) || [],
    penaltyForNonCompliance: r.penalty_for_non_compliance,
    obtainedDate: r.obtained_date,
    expirationDate: r.expiration_date,
    proofUrl: r.proof_url,
    daysUntilDue: r.days_until_due,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function normalizeFundingOut(r) {
  return {
    id: String(r.id),
    businessId: String(r.business_id),
    name: r.name,
    provider: r.provider,
    type: r.type,
    amountMin: Number(r.amount_min || 0),
    amountMax: Number(r.amount_max || 0),
    interestRate: r.interest_rate,
    repaymentTerms: r.repayment_terms,
    eligibilityMatch: Number(r.eligibility_match || 0),
    eligibilityCriteria: tryParse(r.eligibility_criteria) || [],
    applicationUrl: r.application_url,
    applicationDeadline: r.application_deadline,
    status: r.status,
    applicationProgress: Number(r.application_progress || 0),
    fitScore: Number(r.fit_score || 0),
    recommendation: r.recommendation,
    estimatedTimeToApply: r.estimated_time_to_apply,
    discoveredAt: r.created_at,
  };
}

function tryParse(val) {
  if (!val) return null;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return null; }
}

export default router;
