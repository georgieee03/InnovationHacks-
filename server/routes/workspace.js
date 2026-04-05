import { Router } from 'express';
import multer from 'multer';
import { put } from '@vercel/blob';
import { TinyFish } from '@tiny-fish/sdk';
import { requireSession } from '../auth.js';
import { getDb } from '../db.js';
import { ensureBusinessWorkspace } from '../workspace.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

function sanitizeFileName(fileName = 'file') {
  return String(fileName)
    .replace(/[^\w.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'file';
}

async function getCurrentBusiness(sql, auth0Id) {
  const rows = auth0Id
    ? await sql`
      SELECT *
      FROM businesses
      WHERE auth0_id = ${auth0Id}
      LIMIT 1
    `
    : await sql`
      SELECT *
      FROM businesses
      ORDER BY id DESC
      LIMIT 1
    `;

  return rows[0] || null;
}

async function requireBusiness(sql, req, res) {
  const business = await getCurrentBusiness(sql, req.currentUser.auth0Id);

  if (!business) {
    res.status(404).json({ error: 'Business profile not found. Complete onboarding first.' });
    return null;
  }

  await ensureBusinessWorkspace(sql, business);
  return business;
}

router.use(requireSession);

router.get('/contracts', async (req, res) => {
  const sql = getDb();

  try {
    const business = await requireBusiness(sql, req, res);
    if (!business) return;

    const rows = await sql`
      SELECT *
      FROM contracts
      WHERE business_id = ${business.id}
      ORDER BY created_at DESC
    `;

    res.json(rows);
  } catch (error) {
    console.error('List contracts error:', error);
    res.status(500).json({ error: 'Failed to load contracts' });
  }
});

router.post('/contracts', async (req, res) => {
  const sql = getDb();

  try {
    const business = await requireBusiness(sql, req, res);
    if (!business) return;

    const payload = req.body || {};
    const rows = await sql`
      INSERT INTO contracts (
        business_id,
        uploaded_file_id,
        file_name,
        file_url,
        file_type,
        contract_type,
        counterparty_name,
        effective_date,
        expiration_date,
        auto_renews,
        total_value,
        monthly_value,
        health_score,
        status,
        analysis,
        obligations
      )
      VALUES (
        ${business.id},
        ${payload.uploadedFileId || null},
        ${payload.fileName || 'Uploaded contract'},
        ${payload.fileUrl || ''},
        ${payload.fileType || 'pdf'},
        ${payload.contractType || 'service'},
        ${payload.counterpartyName || ''},
        ${payload.effectiveDate || null},
        ${payload.expirationDate || null},
        ${Boolean(payload.autoRenews)},
        ${payload.totalValue || null},
        ${payload.monthlyValue || null},
        ${payload.healthScore || 82},
        ${payload.status || 'active'},
        ${JSON.stringify(payload.analysis || {
          summary: 'Imported into SafeGuard workspace. Detailed AI contract analysis can be added later.',
        })}::jsonb,
        ${JSON.stringify(payload.obligations || [])}::jsonb
      )
      RETURNING *
    `;

    if (payload.uploadedFileId) {
      await sql`
        UPDATE uploaded_files
        SET linked_type = 'contract', linked_id = ${String(rows[0].id)}, analysis_status = 'complete'
        WHERE id = ${payload.uploadedFileId} AND business_id = ${business.id}
      `;
    }

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Create contract error:', error);
    res.status(500).json({ error: 'Failed to create contract' });
  }
});

router.get('/quotes', async (req, res) => {
  const sql = getDb();

  try {
    const business = await requireBusiness(sql, req, res);
    if (!business) return;

    const rows = await sql`
      SELECT *
      FROM quotes
      WHERE business_id = ${business.id}
      ORDER BY created_at DESC
    `;

    res.json(rows);
  } catch (error) {
    console.error('List quotes error:', error);
    res.status(500).json({ error: 'Failed to load quotes' });
  }
});

router.post('/quotes', async (req, res) => {
  const sql = getDb();

  try {
    const business = await requireBusiness(sql, req, res);
    if (!business) return;

    const payload = req.body || {};
    const services = Array.isArray(payload.services)
      ? payload.services
      : String(payload.services || '')
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean)
        .map((label) => ({ label }));

    const subtotal = Number(payload.subtotal || 0);
    const taxRate = Number(payload.taxRate || 0);
    const taxAmount = Number(payload.taxAmount || subtotal * taxRate);
    const total = Number(payload.total || subtotal + taxAmount);

    const rows = await sql`
      INSERT INTO quotes (
        business_id,
        client_name,
        client_email,
        client_phone,
        services,
        subtotal,
        tax_rate,
        tax_amount,
        total,
        pricing_analysis,
        status,
        scheduled_date,
        scheduled_time,
        scheduled_address
      )
      VALUES (
        ${business.id},
        ${payload.clientName || ''},
        ${payload.clientEmail || ''},
        ${payload.clientPhone || ''},
        ${JSON.stringify(services)}::jsonb,
        ${subtotal},
        ${taxRate},
        ${taxAmount},
        ${total},
        ${JSON.stringify(payload.pricingAnalysis || {
          confidence: 'baseline',
          source: 'safeguard-onboarding',
        })}::jsonb,
        ${payload.status || 'draft'},
        ${payload.scheduledDate || null},
        ${payload.scheduledTime || null},
        ${payload.scheduledAddress || null}
      )
      RETURNING *
    `;

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Create quote error:', error);
    res.status(500).json({ error: 'Failed to create quote' });
  }
});

router.get('/receipts', async (req, res) => {
  const sql = getDb();

  try {
    const business = await requireBusiness(sql, req, res);
    if (!business) return;

    const rows = await sql`
      SELECT *
      FROM receipts
      WHERE business_id = ${business.id}
      ORDER BY date DESC, id DESC
    `;

    res.json(rows);
  } catch (error) {
    console.error('List receipts error:', error);
    res.status(500).json({ error: 'Failed to load receipts' });
  }
});

router.post('/receipts', async (req, res) => {
  const sql = getDb();

  try {
    const business = await requireBusiness(sql, req, res);
    if (!business) return;

    const payload = req.body || {};
    const amount = Number(payload.amount || 0);
    const businessPercentage = Number(payload.businessPercentage || 100);
    const deductibleAmount = Number(
      payload.deductibleAmount
      || amount * Math.max(0, Math.min(100, businessPercentage)) / 100
    );

    const rows = await sql`
      INSERT INTO receipts (
        business_id,
        uploaded_file_id,
        image_url,
        vendor,
        amount,
        date,
        line_items,
        category,
        tax_classification,
        business_percentage,
        deductible_amount,
        tax_notes,
        is_reconciled,
        associated_mileage,
        needs_more_info,
        pending_question
      )
      VALUES (
        ${business.id},
        ${payload.uploadedFileId || null},
        ${payload.imageUrl || ''},
        ${payload.vendor || ''},
        ${amount},
        ${payload.date || new Date().toISOString().slice(0, 10)},
        ${JSON.stringify(payload.lineItems || [])}::jsonb,
        ${payload.category || 'operations'},
        ${payload.taxClassification || 'expense'},
        ${businessPercentage},
        ${deductibleAmount},
        ${payload.taxNotes || ''},
        ${Boolean(payload.isReconciled)},
        ${payload.associatedMileage || null},
        ${Boolean(payload.needsMoreInfo)},
        ${payload.pendingQuestion || null}
      )
      RETURNING *
    `;

    if (payload.uploadedFileId) {
      await sql`
        UPDATE uploaded_files
        SET linked_type = 'receipt', linked_id = ${String(rows[0].id)}, analysis_status = 'complete'
        WHERE id = ${payload.uploadedFileId} AND business_id = ${business.id}
      `;
    }

    await sql`
      UPDATE businesses
      SET
        total_expenses_ytd = COALESCE(total_expenses_ytd, 0) + ${deductibleAmount},
        monthly_expense_avg = GREATEST(COALESCE(monthly_expense_avg, 0), ${deductibleAmount}),
        financials_updated_at = NOW()
      WHERE id = ${business.id}
    `;

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Create receipt error:', error);
    res.status(500).json({ error: 'Failed to create receipt' });
  }
});

router.get('/compliance', async (req, res) => {
  const sql = getDb();

  try {
    const business = await requireBusiness(sql, req, res);
    if (!business) return;

    const rows = await sql`
      SELECT *
      FROM compliance_items
      WHERE business_id = ${business.id}
      ORDER BY is_required DESC, created_at ASC
    `;

    res.json(rows);
  } catch (error) {
    console.error('List compliance error:', error);
    res.status(500).json({ error: 'Failed to load compliance items' });
  }
});

router.patch('/compliance/:id', async (req, res) => {
  const sql = getDb();

  try {
    const business = await requireBusiness(sql, req, res);
    if (!business) return;

    const payload = req.body || {};
    const rows = await sql`
      UPDATE compliance_items
      SET
        status = ${payload.status || 'not_started'},
        updated_at = NOW()
      WHERE id = ${req.params.id} AND business_id = ${business.id}
      RETURNING *
    `;

    if (!rows[0]) {
      return res.status(404).json({ error: 'Compliance item not found' });
    }

    return res.json(rows[0]);
  } catch (error) {
    console.error('Update compliance error:', error);
    return res.status(500).json({ error: 'Failed to update compliance item' });
  }
});

async function refreshFundingIfTinyFishConfigured(sql, business) {
  if (!process.env.TINYFISH_API_KEY) {
    return { refreshed: false, source: 'fallback' };
  }

  try {
    const client = new TinyFish({ apiKey: process.env.TINYFISH_API_KEY });
    const annualRevenue = Math.round(Number(business.monthly_revenue_estimate || 0) * 12);

    const goal = `Find all active funding opportunities (grants, microloans, SBA loans, competitions) for a ${business.type} business named "${business.name}" in ${business.city || ''}, ${business.state || ''} with ~$${annualRevenue} annual revenue.
Search SBA.gov, Grants.gov, Kiva.org, Accion.org, and state economic development sites.
For each opportunity extract: name, provider, type (grant/loan/microloan/line_of_credit), amount range (min/max), interest rate, repayment terms, eligibility requirements, application URL, deadline, and fit score 0-100.`;

    const stream = await client.agent.stream({ url: 'https://sba.gov/funding-programs', goal });

    const chunks = [];
    for await (const event of stream) {
      const text = event?.content ?? event?.text ?? event?.delta ?? '';
      if (text) chunks.push(text);
    }

    const agentOutput = chunks.join('');
    if (!agentOutput) return { refreshed: false, source: 'fallback' };

    // Parse agent output into structured results via JSON extraction
    const jsonMatch = agentOutput.match(/\[[\s\S]*\]/);
    const results = jsonMatch ? (() => { try { return JSON.parse(jsonMatch[0]); } catch { return []; } })() : [];

    if (!results.length) return { refreshed: false, source: 'tinyfish' };

    await sql`DELETE FROM funding_opportunities WHERE business_id = ${business.id} AND status = 'discovered'`;

    for (const item of results.slice(0, 8)) {
      await sql`
        INSERT INTO funding_opportunities (
          business_id, name, provider, type, amount_min, amount_max,
          interest_rate, repayment_terms, eligibility_match, eligibility_criteria,
          application_url, application_deadline, status, application_progress,
          prefilled_fields, fit_score, recommendation, estimated_time_to_apply
        )
        VALUES (
          ${business.id},
          ${item.name || item.title || 'Funding opportunity'},
          ${item.provider || item.source || 'TinyFish'},
          ${item.type || 'other'},
          ${Number(item.amountMin || item.minAmount || 0)},
          ${Number(item.amountMax || item.maxAmount || 0)},
          ${item.interestRate || null},
          ${item.repaymentTerms || item.terms || null},
          ${Number(item.eligibilityMatch || item.match || 72)},
          ${JSON.stringify([])}::jsonb,
          ${item.applicationUrl || item.url || ''},
          ${item.deadline || null},
          'discovered', 0,
          ${JSON.stringify({ source: 'tinyfish', businessName: business.name })}::jsonb,
          ${Number(item.fitScore || item.eligibilityMatch || 72)},
          ${item.recommendation || item.description || 'Sourced via TinyFish live research.'},
          ${'20-40 minutes'}
        )
      `;
    }

    return { refreshed: true, source: 'tinyfish' };
  } catch (error) {
    console.error('TinyFish refresh error:', error);
    return { refreshed: false, source: 'fallback' };
  }
}

router.get('/growth', async (req, res) => {
  const sql = getDb();

  try {
    const business = await requireBusiness(sql, req, res);
    if (!business) return;

    const fundingRows = await sql`
      SELECT *
      FROM funding_opportunities
      WHERE business_id = ${business.id}
      ORDER BY fit_score DESC, created_at DESC
    `;

    const actionRows = await sql`
      SELECT *
      FROM growth_actions
      WHERE business_id = ${business.id}
      ORDER BY created_at ASC
    `;

    res.json({
      funding: fundingRows,
      actions: actionRows,
      tinyFishConfigured: Boolean(process.env.TINYFISH_API_KEY),
      source: process.env.TINYFISH_API_KEY ? 'hybrid' : 'fallback',
    });
  } catch (error) {
    console.error('Load growth workspace error:', error);
    res.status(500).json({ error: 'Failed to load growth workspace' });
  }
});

router.post('/growth/refresh', async (req, res) => {
  const sql = getDb();

  try {
    const business = await requireBusiness(sql, req, res);
    if (!business) return;

    const refreshResult = await refreshFundingIfTinyFishConfigured(sql, business);
    const fundingRows = await sql`
      SELECT *
      FROM funding_opportunities
      WHERE business_id = ${business.id}
      ORDER BY fit_score DESC, created_at DESC
    `;

    res.json({
      funding: fundingRows,
      tinyFishConfigured: Boolean(process.env.TINYFISH_API_KEY),
      source: refreshResult.source,
      refreshed: refreshResult.refreshed,
    });
  } catch (error) {
    console.error('Refresh growth workspace error:', error);
    res.status(500).json({ error: 'Failed to refresh growth workspace' });
  }
});

router.post('/files/upload', upload.single('file'), async (req, res) => {
  const sql = getDb();

  try {
    const business = await requireBusiness(sql, req, res);
    if (!business) return;

    if (!req.file) {
      return res.status(400).json({ error: 'File is required' });
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(503).json({ error: 'Vercel Blob is not configured yet for this project' });
    }

    const folder = String(req.body?.folder || 'general').trim() || 'general';
    const safeName = sanitizeFileName(req.file.originalname);
    const pathname = `business-${business.id}/${folder}/${Date.now()}-${safeName}`;
    const blob = await put(pathname, req.file.buffer, {
      access: 'public',
      addRandomSuffix: false,
      contentType: req.file.mimetype || 'application/octet-stream',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    const rows = await sql`
      INSERT INTO uploaded_files (
        business_id,
        blob_url,
        blob_path,
        file_name,
        file_size,
        mime_type,
        folder,
        analysis_status
      )
      VALUES (
        ${business.id},
        ${blob.url},
        ${pathname},
        ${req.file.originalname},
        ${req.file.size},
        ${req.file.mimetype || 'application/octet-stream'},
        ${folder},
        'pending'
      )
      RETURNING *
    `;

    return res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Blob upload error:', error);
    return res.status(500).json({ error: 'Failed to upload file' });
  }
});

export default router;
