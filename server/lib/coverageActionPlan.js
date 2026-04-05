import { createHash } from 'node:crypto';
import { computeProtectionScore, computeProjectedProtectionScore } from '../../src/services/gapAnalyzer.js';
import { groqJSON, isGroqConfigured } from './groq.js';
import {
  getCatalogEntry,
  STATE_FARM_CATALOG,
  STATE_FARM_CATALOG_VERSION,
} from '../data/stateFarmCatalog.js';

const PRIORITY_WEIGHT = {
  critical: 0,
  recommended: 1,
  conditional: 2,
};

const EXECUTION_PHASES = {
  NOW: 'Now',
  RENEWAL: 'This renewal cycle',
  REVIEW: 'After quote/agent review',
};

function stableSerialize(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableSerialize).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`).join(',')}}`;
  }

  return JSON.stringify(value);
}

function buildHash(value) {
  return createHash('sha256').update(stableSerialize(value)).digest('hex');
}

function normalizePriority(priority) {
  return PRIORITY_WEIGHT[priority] !== undefined ? priority : 'recommended';
}

function normalizeActionableGaps(results) {
  return (Array.isArray(results) ? results : [])
    .filter((item) => item?.status === 'gap' || item?.status === 'underinsured')
    .sort((left, right) => {
      const priorityCompare = (PRIORITY_WEIGHT[normalizePriority(left.priority)] ?? 9)
        - (PRIORITY_WEIGHT[normalizePriority(right.priority)] ?? 9);

      if (priorityCompare !== 0) {
        return priorityCompare;
      }

      return String(left.name || left.id || '').localeCompare(String(right.name || right.id || ''));
    });
}

function getBusinessExposure(business, actionableGaps) {
  const employees = Number(business?.employees || 0);
  const usesVehicle = Boolean(business?.uses_personal_vehicle)
    || actionableGaps.some((gap) => gap.id === 'commercial_auto')
    || String(business?.type || '').toLowerCase() === 'contractor';

  return {
    hasEmployees: Boolean(business?.has_employees) || employees > 1,
    usesVehicle,
  };
}

function getAverageMonthlyCost(premiumRange) {
  const low = Number(premiumRange?.low);
  const high = Number(premiumRange?.high);

  if (Number.isFinite(low) && Number.isFinite(high) && low > 0 && high > 0) {
    return Math.round(((low + high) / 2) / 12);
  }

  if (Number.isFinite(low) && low > 0) {
    return Math.round(low / 12);
  }

  if (Number.isFinite(high) && high > 0) {
    return Math.round(high / 12);
  }

  return null;
}

function combinePremiumRanges(gaps) {
  const values = gaps
    .map((gap) => gap?.estimatedAnnualPremium)
    .filter(Boolean);

  if (!values.length) {
    return null;
  }

  const lows = values.map((item) => Number(item.low)).filter((value) => Number.isFinite(value) && value > 0);
  const highs = values.map((item) => Number(item.high)).filter((value) => Number.isFinite(value) && value > 0);

  if (!lows.length && !highs.length) {
    return null;
  }

  return {
    low: lows.length ? Math.min(...lows) : null,
    high: highs.length ? Math.max(...highs) : null,
  };
}

function computeBudgetImpactSignal(monthlyCost, financialMetrics) {
  if (!Number.isFinite(monthlyCost) || monthlyCost <= 0) {
    return 'unknown';
  }

  const monthlyNet = Number(financialMetrics?.averageMonthlyIncome || 0) - Number(financialMetrics?.averageMonthlyExpenses || 0);
  const reserves = Number(financialMetrics?.currentReserves || 0);

  if (monthlyNet <= 0) {
    return reserves >= monthlyCost * 6 ? 'medium' : 'high';
  }

  const ratio = monthlyCost / monthlyNet;

  if (ratio <= 0.18) {
    return 'low';
  }

  if (ratio <= 0.4) {
    return 'medium';
  }

  return 'high';
}

function computeBudgetImpactReason(signal, monthlyCost, financialMetrics) {
  if (!Number.isFinite(monthlyCost) || monthlyCost <= 0) {
    return 'SafeGuard does not have enough carrier-backed pricing evidence to estimate a reliable monthly cost for this action.';
  }

  const runway = Number(financialMetrics?.monthsOfRunway || 0);

  if (signal === 'low') {
    return `Estimated at about $${monthlyCost}/month, this looks absorbable relative to your current monthly margin.`;
  }

  if (signal === 'medium') {
    return `Estimated at about $${monthlyCost}/month, this is manageable but should be timed against your current margin and reserve position.`;
  }

  return `Estimated at about $${monthlyCost}/month, this could strain the business right now given ${runway.toFixed(1)} months of runway and current cashflow.`;
}

function getExecutionPhase(item) {
  if (item.actionType === 'agent_question' || item.productId === 'clup') {
    return EXECUTION_PHASES.REVIEW;
  }

  if (item.budgetImpactSignal === 'high') {
    return EXECUTION_PHASES.RENEWAL;
  }

  if (item.priority === 'critical') {
    return EXECUTION_PHASES.NOW;
  }

  return EXECUTION_PHASES.RENEWAL;
}

function createBasePlanItem({
  itemId,
  gapIds,
  sourceGaps,
  productId = null,
  actionType,
  title,
  recommendedChange,
  carrierRecommendation,
  officialProductName = null,
  officialSourceUrl = null,
  fitReason,
  dependencies = [],
  notes = '',
  fallbackCarrier = false,
}, financialMetrics) {
  const leadGap = sourceGaps[0];
  const premiumRange = combinePremiumRanges(sourceGaps);
  const estimatedMonthlyCost = getAverageMonthlyCost(premiumRange);
  const budgetImpactSignal = computeBudgetImpactSignal(estimatedMonthlyCost, financialMetrics);

  const item = {
    id: itemId,
    gapId: leadGap?.id || itemId,
    gapName: leadGap?.name || title,
    productId,
    status: leadGap?.status || 'gap',
    priority: normalizePriority(leadGap?.priority),
    actionType,
    title,
    recommendedChange,
    whyThisMatters: leadGap?.whyItMatters || 'This recommendation closes a material protection gap in the business.',
    carrierRecommendation,
    officialProductName,
    officialSourceUrl,
    fitReason,
    dependencies,
    scoreDelta: 0,
    budgetImpactSignal,
    budgetImpactReason: computeBudgetImpactReason(budgetImpactSignal, estimatedMonthlyCost, financialMetrics),
    implementationSteps: [],
    agentQuestions: [],
    coveredRisksResolved: gapIds,
    notes,
    estimatedMonthlyCost,
    fallbackCarrier,
  };

  item.executionPhase = getExecutionPhase(item);
  return item;
}

function buildDeterministicPlanItems({ business, gapResults, financialMetrics }) {
  const actionableGaps = normalizeActionableGaps(gapResults);
  const exposures = getBusinessExposure(business, actionableGaps);
  const gapMap = new Map(actionableGaps.map((gap) => [gap.id, gap]));
  const consumed = new Set();
  const items = [];

  const addItem = (item) => {
    items.push(item);
    item.coveredRisksResolved.forEach((gapId) => consumed.add(gapId));
  };

  const coreGaps = ['general_liability', 'commercial_property']
    .map((id) => gapMap.get(id))
    .filter(Boolean);
  const bopAttachables = ['business_interruption', 'equipment_breakdown']
    .map((id) => gapMap.get(id))
    .filter(Boolean);
  const bopGap = gapMap.get('bop');
  const shouldUseBop = coreGaps.length > 0 || (bopGap && bopAttachables.length > 0);

  if (shouldUseBop) {
    const catalogEntry = getCatalogEntry('bop');
    const sourceGaps = [bopGap, ...coreGaps, ...bopAttachables].filter(Boolean);
    const gapIds = Array.from(new Set(sourceGaps.map((gap) => gap.id)));
    addItem(createBasePlanItem({
      itemId: 'plan_bop_bundle',
      gapIds,
      sourceGaps,
      productId: 'bop',
      actionType: 'bundle_replace',
      title: "Replace fragmented core coverage with a State Farm BOP",
      recommendedChange:
        'Ask State Farm for a Business Owner’s Policy that closes your liability and property gap first, then confirm whether loss-of-income and equipment-breakdown coverage can be added in the same conversation.',
      carrierRecommendation: "State Farm Business Owner's Policy",
      officialProductName: catalogEntry.productName,
      officialSourceUrl: catalogEntry.officialSourceUrl,
      fitReason:
        'Your current protection issues cluster around the core liability + property stack, which is the exact place where a BOP is stronger than piecemeal fixes.',
      dependencies: [],
    }, financialMetrics));
  }

  const workersCompGap = gapMap.get('workers_comp');
  if (workersCompGap && !consumed.has('workers_comp') && exposures.hasEmployees) {
    const catalogEntry = getCatalogEntry('workers_comp');
    addItem(createBasePlanItem({
      itemId: 'plan_workers_comp',
      gapIds: ['workers_comp'],
      sourceGaps: [workersCompGap],
      productId: 'workers_comp',
      actionType: 'add_policy',
      title: "Add workers' compensation coverage",
      recommendedChange:
        "Review workers' compensation with a State Farm agent and confirm payroll class codes, medical coverage, and employer liability protections for your current team setup.",
      carrierRecommendation: "State Farm Workers' Compensation",
      officialProductName: catalogEntry.productName,
      officialSourceUrl: catalogEntry.officialSourceUrl,
      fitReason:
        'Your business profile shows employee exposure, which makes workers’ compensation both an injury-risk control and a compliance conversation.',
    }, financialMetrics));
  }

  const autoGap = gapMap.get('commercial_auto');
  if (autoGap && !consumed.has('commercial_auto') && exposures.usesVehicle) {
    const catalogEntry = getCatalogEntry('commercial_auto');
    addItem(createBasePlanItem({
      itemId: 'plan_commercial_auto',
      gapIds: ['commercial_auto'],
      sourceGaps: [autoGap],
      productId: 'commercial_auto',
      actionType: 'add_policy',
      title: 'Move business vehicle exposure onto commercial auto coverage',
      recommendedChange:
        'Use a State Farm commercial auto review to move delivery, service, or job-site driving exposure off any personal-auto assumptions and onto business coverage.',
      carrierRecommendation: 'State Farm Commercial Auto',
      officialProductName: catalogEntry.productName,
      officialSourceUrl: catalogEntry.officialSourceUrl,
      fitReason:
        'Your current operating profile has vehicle exposure, so this is more than a paperwork cleanup; it is a direct liability fix.',
    }, financialMetrics));
  }

  const professionalLiabilityGap = gapMap.get('professional_liability');
  const proLiabSupported = ['salon', 'contractor'].includes(String(business?.type || '').toLowerCase());
  if (professionalLiabilityGap && !consumed.has('professional_liability')) {
    if (proLiabSupported) {
      const catalogEntry = getCatalogEntry('professional_liability_supported');
      addItem(createBasePlanItem({
        itemId: 'plan_professional_liability_supported',
        gapIds: ['professional_liability'],
        sourceGaps: [professionalLiabilityGap],
        productId: 'professional_liability_supported',
        actionType: 'agent_question',
        title: 'Confirm whether professional liability can be added for your business type',
        recommendedChange:
          'Ask whether your occupation qualifies for State Farm professional liability support and what errors-and-omissions protections are available for the services you actually perform.',
        carrierRecommendation: 'State Farm professional liability availability review',
        officialProductName: catalogEntry.productName,
        officialSourceUrl: catalogEntry.officialSourceUrl,
        fitReason:
          'Your business type aligns with the occupations most likely to need service-quality or workmanship protection, but final carrier fit still depends on underwriting.',
      }, financialMetrics));
    } else {
      addItem(createBasePlanItem({
        itemId: 'plan_professional_liability_generic',
        gapIds: ['professional_liability'],
        sourceGaps: [professionalLiabilityGap],
        actionType: 'agent_question',
        title: 'Validate professional liability or E&O options with an agent',
        recommendedChange:
          'Use this as an agent conversation item and confirm whether your services create negligence, advice, or workmanship exposure that needs professional liability or E&O coverage.',
        carrierRecommendation: 'Carrier-specific fit not confirmed',
        fitReason:
          'SafeGuard’s current State Farm source catalog does not confirm a direct professional-liability fit for this exact business profile.',
        officialSourceUrl: null,
        fallbackCarrier: true,
      }, financialMetrics));
    }
  }

  const hasUnderlyingLiability = Boolean(gapMap.get('general_liability')?.status === 'underinsured')
    || items.some((item) => item.productId === 'bop')
    || items.some((item) => item.productId === 'commercial_auto');

  const liabilityPressureGap = ['general_liability', 'commercial_auto']
    .map((id) => gapMap.get(id))
    .find((gap) => gap?.status === 'underinsured');

  if (liabilityPressureGap && hasUnderlyingLiability) {
    const catalogEntry = getCatalogEntry('clup');
    addItem(createBasePlanItem({
      itemId: 'plan_clup_review',
      gapIds: [liabilityPressureGap.id],
      sourceGaps: [liabilityPressureGap],
      productId: 'clup',
      actionType: 'agent_question',
      title: 'Review whether a commercial umbrella layer should sit on top of your base liability coverage',
      recommendedChange:
        'Once the base liability layer is confirmed, ask if a State Farm Commercial Liability Umbrella Policy is appropriate to extend your protection above the underlying limit.',
      carrierRecommendation: 'State Farm Commercial Liability Umbrella Policy',
      officialProductName: catalogEntry.productName,
      officialSourceUrl: catalogEntry.officialSourceUrl,
      fitReason:
        'Your current liability stack looks thin relative to the exposure being carried, so an umbrella review is the cleanest next conversation after the underlying policy is fixed.',
      dependencies: ['Underlying liability coverage must already be active or added first.'],
    }, financialMetrics));
  }

  actionableGaps.forEach((gap) => {
    if (consumed.has(gap.id) || gap.id === 'bop') {
      return;
    }

    if (gap.id === 'workers_comp' && !exposures.hasEmployees) {
      return;
    }

    if (gap.id === 'commercial_auto' && !exposures.usesVehicle) {
      return;
    }

    addItem(createBasePlanItem({
      itemId: `plan_${gap.id}`,
      gapIds: [gap.id],
      sourceGaps: [gap],
      actionType: gap.status === 'underinsured' ? 'increase_limit' : 'add_policy',
      title: `Close the ${gap.name} gap`,
      recommendedChange:
        gap.status === 'underinsured'
          ? `Increase the limit or broaden the form for ${gap.name} so it better matches the business exposure shown in your current analysis.`
          : `Ask for a dedicated ${gap.name} solution or endorsement so this risk is no longer left uninsured.`,
      carrierRecommendation: 'Carrier-specific fit not confirmed',
      fitReason:
        'SafeGuard can confirm the protection issue, but the current State Farm source catalog does not clearly map this item to a named State Farm product without agent review.',
      officialSourceUrl: null,
      fallbackCarrier: true,
      notes: 'Treat this as a targeted agent conversation item rather than a named carrier recommendation.',
    }, financialMetrics));
  });

  return items.map((item) => ({
    ...item,
    executionPhase: getExecutionPhase(item),
  }));
}

function sanitizeStringList(value, fallback) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const cleaned = value
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .slice(0, 5);

  return cleaned.length ? cleaned : fallback;
}

function buildFallbackSummary(items, business) {
  if (!items.length) {
    return `SafeGuard could not find any open insurance actions for ${business?.name || 'this business'} from the latest saved gap analysis.`;
  }

  const criticalCount = items.filter((item) => item.priority === 'critical').length;
  const carrierCount = items.filter((item) => !item.fallbackCarrier).length;

  return `${business?.name || 'This business'} has ${items.length} insurance actions queued, including ${criticalCount} high-priority coverage moves. ${carrierCount > 0 ? `${carrierCount} of them map cleanly to the current State Farm source catalog.` : 'Several items still require a generic agent review because carrier-specific fit is not confirmed.'}`;
}

async function enrichPlanItemsWithAI({
  business,
  gapResults,
  planItems,
  financialMetrics,
  riskFactors,
}) {
  if (!isGroqConfigured() || !planItems.length) {
    return {
      planSummary: buildFallbackSummary(planItems, business),
      items: planItems.map((item) => ({
        ...item,
        implementationSteps: [
          `Review the current ${item.gapName} issue against your saved policy analysis.`,
          'Collect any payroll, vehicle, or property details the agent will need.',
          `Use this conversation to validate ${item.recommendedChange.toLowerCase()}`,
        ],
        agentQuestions: item.dependencies.length
          ? [...item.dependencies]
          : [`What would you need from me to implement ${item.gapName.toLowerCase()} correctly?`],
      })),
    };
  }

  const prompt = `You are building a source-backed insurance action plan for a small business owner.

BUSINESS:
${JSON.stringify({
  name: business?.name,
  type: business?.type,
  state: business?.state,
  employees: business?.employees,
  monthlyRevenueEstimate: business?.monthly_revenue_estimate ?? business?.monthly_revenue_avg ?? null,
}, null, 2)}

FINANCIAL SNAPSHOT:
${JSON.stringify(financialMetrics || {}, null, 2)}

RISK FACTORS:
${JSON.stringify(riskFactors || {}, null, 2)}

LATEST GAP ANALYSIS:
${JSON.stringify(gapResults, null, 2)}

STATE FARM SOURCE CATALOG:
${JSON.stringify(STATE_FARM_CATALOG, null, 2)}

LOCKED PLAN ITEMS:
${JSON.stringify(planItems.map((item) => ({
  id: item.id,
  gapId: item.gapId,
  gapName: item.gapName,
  status: item.status,
  priority: item.priority,
  actionType: item.actionType,
  title: item.title,
  recommendedChange: item.recommendedChange,
  carrierRecommendation: item.carrierRecommendation,
  officialProductName: item.officialProductName,
  officialSourceUrl: item.officialSourceUrl,
  fitReason: item.fitReason,
  budgetImpactSignal: item.budgetImpactSignal,
  dependencies: item.dependencies,
  coveredRisksResolved: item.coveredRisksResolved,
  notes: item.notes,
})), null, 2)}

Rules:
- Do not invent product names, endorsements, source URLs, or quotes.
- Respect the locked product/source fields exactly as provided.
- If carrierRecommendation says "Carrier-specific fit not confirmed", keep that framing.
- No premium quotes or dollar estimates.
- Return concise, practical steps and agent questions in plain English.

Return ONLY JSON:
{
  "planSummary": "string",
  "items": [
    {
      "id": "string",
      "title": "string",
      "recommendedChange": "string",
      "whyThisMatters": "string",
      "fitReason": "string",
      "budgetImpactReason": "string",
      "implementationSteps": ["string"],
      "agentQuestions": ["string"],
      "notes": "string"
    }
  ]
}`;

  try {
    const result = await groqJSON(prompt, { maxTokens: 2600, temperature: 0.2 });
    const modelItems = Array.isArray(result.items) ? result.items : [];
    const itemsById = new Map(modelItems.map((item) => [item.id, item]));

    return {
      planSummary: String(result.planSummary || '').trim() || buildFallbackSummary(planItems, business),
      items: planItems.map((item) => {
        const enriched = itemsById.get(item.id) || {};

        return {
          ...item,
          title: String(enriched.title || item.title).trim(),
          recommendedChange: String(enriched.recommendedChange || item.recommendedChange).trim(),
          whyThisMatters: String(enriched.whyThisMatters || item.whyThisMatters).trim(),
          fitReason: String(enriched.fitReason || item.fitReason).trim(),
          budgetImpactReason: String(enriched.budgetImpactReason || item.budgetImpactReason).trim(),
          implementationSteps: sanitizeStringList(
            enriched.implementationSteps,
            [
              `Review the saved ${item.gapName} issue with your agent.`,
              'Confirm the exact exposure, limits, and underwriting facts involved.',
              'Decide whether to implement now or time it to renewal based on budget impact.',
            ],
          ),
          agentQuestions: sanitizeStringList(
            enriched.agentQuestions,
            item.dependencies.length
              ? item.dependencies
              : [`What underwriting details do you need from me to address ${item.gapName.toLowerCase()}?`],
          ),
          notes: String(enriched.notes || item.notes || '').trim(),
        };
      }),
    };
  } catch (error) {
    console.warn('Coverage action plan AI enrichment failed, using deterministic fallback:', error);
    return {
      planSummary: buildFallbackSummary(planItems, business),
      items: planItems.map((item) => ({
        ...item,
        implementationSteps: [
          `Review the current ${item.gapName} issue against your saved policy analysis.`,
          'Bring updated payroll, property, vehicle, or revenue context into the agent conversation.',
          'Use the result of that conversation to decide whether to bind now or phase at renewal.',
        ],
        agentQuestions: item.dependencies.length
          ? [...item.dependencies]
          : [`What would change in my protection if I implemented ${item.gapName.toLowerCase()} now?`],
      })),
    };
  }
}

function applyScoreDeltas(planItems, gapResults, financialMetrics, currentScore) {
  const items = [];
  const resolvedSoFar = new Set();

  for (const item of planItems) {
    item.coveredRisksResolved.forEach((gapId) => resolvedSoFar.add(gapId));
    const projectedScore = computeProjectedProtectionScore(gapResults, financialMetrics, Array.from(resolvedSoFar));
    items.push({
      ...item,
      scoreDelta: Math.max(0, projectedScore - currentScore - items.reduce((sum, planItem) => sum + planItem.scoreDelta, 0)),
    });
  }

  return items;
}

export async function loadCoveragePlanContext(sql, businessId, currentUser) {
  let businessRows;
  if (currentUser?.auth0Id) {
    businessRows = await sql`
      SELECT *
      FROM businesses
      WHERE id = ${businessId} AND auth0_id = ${currentUser.auth0Id}
      LIMIT 1
    `;
  } else {
    businessRows = await sql`SELECT * FROM businesses WHERE id = ${businessId} LIMIT 1`;
  }

  const business = businessRows[0];
  if (!business) {
    return { business: null, latestGapAnalysis: null, latestPlan: null, currentScore: null, stale: false };
  }

  const gapRows = await sql`
    SELECT
      ga.*,
      pa.summary AS policy_summary,
      pa.id AS linked_policy_analysis_id
    FROM gap_analyses ga
    LEFT JOIN policy_analyses pa ON pa.id = ga.policy_analysis_id
    WHERE ga.business_id = ${businessId}
    ORDER BY ga.created_at DESC, ga.id DESC
    LIMIT 1
  `;

  const latestGapAnalysis = gapRows[0]
    ? {
        id: gapRows[0].id,
        businessId: gapRows[0].business_id,
        policyAnalysisId: gapRows[0].policy_analysis_id,
        linkedPolicyAnalysisId: gapRows[0].linked_policy_analysis_id,
        results: Array.isArray(gapRows[0].results) ? gapRows[0].results : [],
        protectionScore: gapRows[0].protection_score,
        policySummary: gapRows[0].policy_summary || null,
        createdAt: gapRows[0].created_at,
      }
    : null;

  const planRows = await sql`
    SELECT *
    FROM coverage_action_plans
    WHERE business_id = ${businessId}
    ORDER BY created_at DESC, id DESC
    LIMIT 1
  `;

  const latestPlan = planRows[0]
    ? {
        id: planRows[0].id,
        businessId: planRows[0].business_id,
        gapAnalysisId: planRows[0].gap_analysis_id,
        carrierScope: planRows[0].carrier_scope,
        currentScore: planRows[0].current_score,
        projectedScore: planRows[0].projected_score,
        planSummary: planRows[0].plan_summary,
        planItems: Array.isArray(planRows[0].plan_items) ? planRows[0].plan_items : [],
        sourceCatalogVersion: planRows[0].source_catalog_version,
        inputHash: planRows[0].input_hash,
        createdAt: planRows[0].created_at,
        updatedAt: planRows[0].updated_at,
      }
    : null;

  const currentScore = latestGapAnalysis
    ? Number.isFinite(Number(latestGapAnalysis.protectionScore))
      ? Number(latestGapAnalysis.protectionScore)
      : computeProtectionScore(latestGapAnalysis.results)
    : null;

  const stale = Boolean(latestPlan && latestGapAnalysis && latestPlan.gapAnalysisId !== latestGapAnalysis.id);

  return { business, latestGapAnalysis, latestPlan, currentScore, stale };
}

export async function generateCoverageActionPlan({ business, latestGapAnalysis, financialMetrics, riskFactors }) {
  const gapResults = Array.isArray(latestGapAnalysis?.results) ? latestGapAnalysis.results : [];
  const currentScore = Number.isFinite(Number(latestGapAnalysis?.protectionScore))
    ? Number(latestGapAnalysis.protectionScore)
    : computeProtectionScore(gapResults, financialMetrics);

  const baseItems = buildDeterministicPlanItems({
    business,
    gapResults,
    financialMetrics,
  });

  const enriched = await enrichPlanItemsWithAI({
    business,
    gapResults,
    planItems: baseItems,
    financialMetrics,
    riskFactors,
  });

  const scoredItems = applyScoreDeltas(enriched.items, gapResults, financialMetrics, currentScore);
  const projectedScore = computeProjectedProtectionScore(
    gapResults,
    financialMetrics,
    scoredItems.flatMap((item) => item.coveredRisksResolved),
  );

  return {
    carrierScope: STATE_FARM_CATALOG_VERSION,
    currentScore,
    projectedScore,
    planSummary: enriched.planSummary,
    planItems: scoredItems,
    sourceCatalogVersion: STATE_FARM_CATALOG_VERSION,
    inputHash: buildHash({
      gapAnalysisId: latestGapAnalysis?.id,
      financialMetrics,
      riskFactors,
      sourceCatalogVersion: STATE_FARM_CATALOG_VERSION,
    }),
  };
}

export async function saveCoverageActionPlan(sql, businessId, latestGapAnalysis, generatedPlan) {
  const inserted = await sql`
    INSERT INTO coverage_action_plans (
      business_id,
      gap_analysis_id,
      carrier_scope,
      current_score,
      projected_score,
      plan_summary,
      plan_items,
      source_catalog_version,
      input_hash,
      created_at,
      updated_at
    )
    VALUES (
      ${businessId},
      ${latestGapAnalysis?.id || null},
      ${generatedPlan.carrierScope},
      ${generatedPlan.currentScore},
      ${generatedPlan.projectedScore},
      ${generatedPlan.planSummary},
      ${JSON.stringify(generatedPlan.planItems)}::jsonb,
      ${generatedPlan.sourceCatalogVersion},
      ${generatedPlan.inputHash},
      NOW(),
      NOW()
    )
    RETURNING *
  `;

  const row = inserted[0];
  return {
    id: row.id,
    businessId: row.business_id,
    gapAnalysisId: row.gap_analysis_id,
    carrierScope: row.carrier_scope,
    currentScore: row.current_score,
    projectedScore: row.projected_score,
    planSummary: row.plan_summary,
    planItems: Array.isArray(row.plan_items) ? row.plan_items : [],
    sourceCatalogVersion: row.source_catalog_version,
    inputHash: row.input_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}