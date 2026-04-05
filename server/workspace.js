function buildComplianceTemplates(business) {
  const stateName = business.state || 'your state';
  const employees = Number(business.employees ?? 0);

  const baseItems = [
    {
      title: 'Business registration review',
      description: `Confirm ${business.name}'s registration and local licensing are current in ${stateName}.`,
      jurisdiction: 'state',
      jurisdictionName: stateName,
      category: 'registration',
      status: 'not_started',
      isRequired: true,
      applicationUrl: 'https://www.sba.gov/business-guide/launch-your-business/register-your-business',
      estimatedProcessingTime: '30 minutes',
      documentationRequired: ['Entity information', 'Registered business address'],
      cost: 0,
    },
    {
      title: 'Tax account and permit check',
      description: 'Review sales tax, payroll tax, and local permit obligations created by your operating footprint.',
      jurisdiction: 'federal',
      jurisdictionName: 'IRS and local agencies',
      category: 'tax',
      status: 'not_started',
      isRequired: true,
      applicationUrl: 'https://www.irs.gov/businesses/small-businesses-self-employed',
      estimatedProcessingTime: '45 minutes',
      documentationRequired: ['EIN or SSN', 'Operating address', 'Revenue estimate'],
      cost: 0,
    },
  ];

  if (employees > 0) {
    baseItems.push({
      title: 'Workers compensation requirement check',
      description: 'Determine whether your current employee count triggers workers compensation or payroll reporting requirements.',
      jurisdiction: 'state',
      jurisdictionName: stateName,
      category: 'employment',
      status: 'in_progress',
      isRequired: true,
      applicationUrl: 'https://www.dol.gov/general/topic/workcomp',
      estimatedProcessingTime: '20 minutes',
      documentationRequired: ['Employee roster', 'Payroll estimate'],
      cost: 0,
    });
  }

  return baseItems;
}

function buildFallbackFunding(business) {
  const city = business.city || 'your city';
  const state = business.state || 'your state';
  const revenue = Number(business.monthly_revenue_estimate ?? business.monthlyRevenue ?? 0);
  const annualRevenue = revenue * 12;
  const fitBoost = annualRevenue > 120000 ? 8 : 0;

  return [
    {
      name: 'SBA Microloan Program',
      provider: 'U.S. Small Business Administration',
      type: 'microloan',
      amountMin: 5000,
      amountMax: 50000,
      interestRate: 'Varies by intermediary lender',
      repaymentTerms: 'Up to 6 years',
      eligibilityMatch: 82 + fitBoost,
      eligibilityCriteria: [
        { criterion: 'Operating small business in the U.S.', met: true, notes: `${business.name} is operating in ${state}.` },
        { criterion: 'Ability to document business use of funds', met: true, notes: 'Onboarding revenue baseline can support a starter application packet.' },
      ],
      applicationUrl: 'https://www.sba.gov/funding-programs/loans/microloans',
      applicationDeadline: null,
      fitScore: 84 + fitBoost,
      recommendation: `Best fit for ${business.type} operators who need working capital without a full bank underwriting cycle.`,
      estimatedTimeToApply: '30-60 minutes',
    },
    {
      name: 'Kiva U.S. Small Business Loan',
      provider: 'Kiva',
      type: 'microloan',
      amountMin: 1000,
      amountMax: 15000,
      interestRate: '0%',
      repaymentTerms: 'Up to 36 months',
      eligibilityMatch: 76,
      eligibilityCriteria: [
        { criterion: 'U.S.-based business owner', met: true, notes: `Business location is ${city}, ${state}.` },
        { criterion: 'Community-backed application', met: false, notes: 'Requires social proof and borrower profile completion.' },
      ],
      applicationUrl: 'https://www.kiva.org/borrow',
      applicationDeadline: null,
      fitScore: 79,
      recommendation: 'Useful if you need a low-friction first capital source and can complete a community-backed profile.',
      estimatedTimeToApply: '20-40 minutes',
    },
    {
      name: `${state} Local Business Grant Sweep`,
      provider: `${state} Economic Development`,
      type: 'grant',
      amountMin: 5000,
      amountMax: 25000,
      interestRate: null,
      repaymentTerms: null,
      eligibilityMatch: 68,
      eligibilityCriteria: [
        { criterion: 'Location-based eligibility', met: true, notes: `${business.name} already operates in ${state}.` },
        { criterion: 'Competitive or limited-cycle funding', met: false, notes: 'Availability changes by cycle, so this stays in heuristic mode until TinyFish is configured.' },
      ],
      applicationUrl: 'https://www.grants.gov',
      applicationDeadline: null,
      fitScore: 70,
      recommendation: 'Good candidate to watch once live opportunity search is enabled.',
      estimatedTimeToApply: '45-90 minutes',
    },
  ];
}

function buildGrowthActions(business, fundingOpportunities = []) {
  const employees = Number(business.employees ?? 0);
  const monthlyRevenue = Number(business.monthly_revenue_estimate ?? business.monthlyRevenue ?? 0);
  const actions = [
    {
      type: 'operations',
      title: 'Convert onboarding data into a reusable business profile',
      impact: 'high',
      reasoning: 'Your SafeGuard onboarding answers now power quotes, receipts, compliance, and funding recommendations.',
      urgency: 'high',
      effort: 'low',
    },
    {
      type: 'finance',
      title: 'Track expense receipts alongside insurance and cashflow',
      impact: 'high',
      reasoning: 'Receipt capture closes the loop between operating spend and the reserve guidance already shown in SafeGuard.',
      urgency: 'medium',
      effort: 'medium',
    },
  ];

  if (monthlyRevenue < 15000) {
    actions.push({
      type: 'revenue',
      title: 'Tighten quoting workflow for faster close rates',
      impact: 'high',
      reasoning: 'At the current revenue baseline, a more disciplined quote-to-signed-workflow has immediate impact on monthly cashflow.',
      urgency: 'high',
      effort: 'medium',
    });
  }

  if (employees > 3) {
    actions.push({
      type: 'compliance',
      title: 'Review payroll and workers compensation obligations',
      impact: 'medium',
      reasoning: 'Employee growth changes compliance and insurance exposure. Keep that aligned before scaling further.',
      urgency: 'medium',
      effort: 'medium',
    });
  }

  if (fundingOpportunities.length) {
    actions.push({
      type: 'funding',
      title: 'Prepare a lightweight capital packet',
      impact: 'medium',
      reasoning: 'You already have at least one candidate funding path. A short packet with revenue baseline, use of funds, and owner summary increases application speed.',
      urgency: 'medium',
      effort: 'low',
    });
  }

  return actions;
}

export function deriveBusinessProfile(input = {}, currentUser = null) {
  const employees = Number(input.employees ?? 1);
  const businessType = String(input.type || 'restaurant');
  const monthlyRevenue = Number(input.monthlyRevenue ?? input.monthly_revenue_estimate ?? 0);

  return {
    name: String(input.name || '').trim(),
    type: businessType,
    zip: String(input.zip || '').trim(),
    city: String(input.city || '').trim(),
    state: String(input.state || '').trim().toUpperCase(),
    monthlyRevenue,
    employees,
    ownerName: String(input.ownerName || currentUser?.name || '').trim(),
    ownerEmail: String(input.ownerEmail || currentUser?.email || '').trim(),
    entityType: String(input.entityType || 'sole_prop').trim(),
    onboardingStage: monthlyRevenue > 0 ? 'operating' : 'active',
    targetMarket: ['restaurant', 'retail'].includes(businessType) ? 'local_foot_traffic' : 'local_service',
    hasEmployees: employees > 0,
    hasContractors: businessType === 'contractor',
    contractorCount: businessType === 'contractor' ? Math.max(1, Math.round(employees / 2)) : 0,
    serviceTypes: JSON.stringify([businessType]),
    completedSteps: JSON.stringify(['identity', 'location', 'financials', 'launchpad']),
    profileMetadata: JSON.stringify({
      importedWorkspace: 'launchpadmerge',
      onboardingSource: 'safeguard',
      locationLabel: input.city && input.state ? `${input.city}, ${input.state}` : '',
    }),
    monthlyRevenueAvg: monthlyRevenue,
  };
}

export async function ensureBusinessWorkspace(sql, business) {
  const complianceCount = await sql`
    SELECT COUNT(*)::int AS count
    FROM compliance_items
    WHERE business_id = ${business.id}
  `;

  if (!complianceCount[0]?.count) {
    for (const item of buildComplianceTemplates(business)) {
      await sql`
        INSERT INTO compliance_items (
          business_id,
          title,
          description,
          jurisdiction,
          jurisdiction_name,
          category,
          status,
          is_required,
          application_url,
          estimated_processing_time,
          documentation_required,
          cost
        )
        VALUES (
          ${business.id},
          ${item.title},
          ${item.description},
          ${item.jurisdiction},
          ${item.jurisdictionName},
          ${item.category},
          ${item.status},
          ${item.isRequired},
          ${item.applicationUrl},
          ${item.estimatedProcessingTime},
          ${JSON.stringify(item.documentationRequired)}::jsonb,
          ${item.cost}
        )
      `;
    }
  }

  const fundingCount = await sql`
    SELECT COUNT(*)::int AS count
    FROM funding_opportunities
    WHERE business_id = ${business.id}
  `;

  let fallbackFunding = [];
  if (!fundingCount[0]?.count) {
    fallbackFunding = buildFallbackFunding(business);

    for (const opportunity of fallbackFunding) {
      await sql`
        INSERT INTO funding_opportunities (
          business_id,
          name,
          provider,
          type,
          amount_min,
          amount_max,
          interest_rate,
          repayment_terms,
          eligibility_match,
          eligibility_criteria,
          application_url,
          application_deadline,
          status,
          application_progress,
          prefilled_fields,
          fit_score,
          recommendation,
          estimated_time_to_apply
        )
        VALUES (
          ${business.id},
          ${opportunity.name},
          ${opportunity.provider},
          ${opportunity.type},
          ${opportunity.amountMin},
          ${opportunity.amountMax},
          ${opportunity.interestRate},
          ${opportunity.repaymentTerms},
          ${opportunity.eligibilityMatch},
          ${JSON.stringify(opportunity.eligibilityCriteria)}::jsonb,
          ${opportunity.applicationUrl},
          ${opportunity.applicationDeadline},
          'discovered',
          0,
          ${JSON.stringify({
            businessName: business.name,
            businessType: business.type,
            location: `${business.city}, ${business.state}`,
          })}::jsonb,
          ${opportunity.fitScore},
          ${opportunity.recommendation},
          ${opportunity.estimatedTimeToApply}
        )
      `;
    }
  }

  const growthCount = await sql`
    SELECT COUNT(*)::int AS count
    FROM growth_actions
    WHERE business_id = ${business.id}
  `;

  if (!growthCount[0]?.count) {
    const actions = buildGrowthActions(business, fallbackFunding);

    for (const action of actions) {
      await sql`
        INSERT INTO growth_actions (
          business_id,
          type,
          title,
          impact,
          reasoning,
          urgency,
          effort
        )
        VALUES (
          ${business.id},
          ${action.type},
          ${action.title},
          ${action.impact},
          ${action.reasoning},
          ${action.urgency},
          ${action.effort}
        )
      `;
    }
  }
}

export function buildTinyFishRequest(business) {
  return {
    query: `${business.type} funding grants loans ${business.state} ${business.city}`,
    limit: 12,
    sources: ['sba.gov', 'grants.gov', 'score.org', 'kiva.org', 'accion.org', 'cdfifund.gov'],
  };
}
