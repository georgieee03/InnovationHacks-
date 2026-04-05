export const STATE_FARM_CATALOG_VERSION = 'state_farm_v1';

export const STATE_FARM_CATALOG = {
  bop: {
    productId: 'bop',
    productName: "State Farm Business Owner's Policy",
    supportedCoverageIntents: [
      'general_liability',
      'commercial_property',
      'business_interruption',
      'equipment_breakdown',
    ],
    supportedBusinessTypes: ['restaurant', 'retail', 'salon', 'contractor', 'service'],
    bundleStrategy: 'bundle_core_liability_and_property',
    dependencies: [],
    officialSourceUrl: 'https://www.statefarm.com/small-business-solutions/insurance/business-owners-policies?page_id=22694',
    evidence:
      'State Farm positions its Business Owner’s Policy as a way to combine core liability and property protection, and its BOP material references loss of income and equipment breakdown as related coverage paths for eligible businesses.',
  },
  commercial_auto: {
    productId: 'commercial_auto',
    productName: 'State Farm Commercial Auto',
    supportedCoverageIntents: ['commercial_auto'],
    supportedBusinessTypes: ['restaurant', 'retail', 'salon', 'contractor', 'service'],
    bundleStrategy: 'standalone',
    dependencies: [],
    officialSourceUrl: 'https://www.statefarm.com/insurance/small-business/commercial-auto?SPID=98899',
    evidence:
      'State Farm’s commercial auto coverage is presented for business-owned or business-used vehicles, including vans, pickups, and service vehicles used in day-to-day operations.',
  },
  workers_comp: {
    productId: 'workers_comp',
    productName: "State Farm Workers' Compensation",
    supportedCoverageIntents: ['workers_comp'],
    supportedBusinessTypes: ['restaurant', 'retail', 'salon', 'contractor', 'service'],
    bundleStrategy: 'standalone',
    dependencies: [],
    officialSourceUrl: 'https://www.statefarm.com/insurance/small-business/workers-compensation',
    evidence:
      'State Farm’s workers’ compensation material focuses on employee injury coverage, employer liability, payroll-based pricing, and state-specific compliance requirements.',
  },
  clup: {
    productId: 'clup',
    productName: 'State Farm Commercial Liability Umbrella Policy',
    supportedCoverageIntents: ['general_liability', 'commercial_auto', 'umbrella'],
    supportedBusinessTypes: ['restaurant', 'retail', 'salon', 'contractor', 'service'],
    bundleStrategy: 'excess_liability',
    dependencies: ['general_liability_or_auto_required'],
    officialSourceUrl: 'https://www.statefarm.com/insurance/small-business/commercial-umbrella',
    evidence:
      'State Farm’s commercial umbrella coverage is positioned as excess liability protection that sits on top of qualifying underlying business liability coverage in $1 million increments.',
  },
  professional_liability_supported: {
    productId: 'professional_liability_supported',
    productName: 'State Farm Professional Liability (occupation-dependent)',
    supportedCoverageIntents: ['professional_liability'],
    supportedBusinessTypes: ['salon', 'contractor'],
    bundleStrategy: 'occupation_add_on',
    dependencies: [],
    officialSourceUrl: 'https://www.statefarm.com/small-business-solutions/insurance/business-owners-policies?page_id=22694',
    evidence:
      'State Farm’s BOP material notes that certain occupations can add professional liability coverage, so this should be treated as an eligibility-dependent agent conversation rather than a universal fit.',
  },
  products_overview: {
    productId: 'products_overview',
    productName: 'State Farm Small Business Insurance Products',
    supportedCoverageIntents: [],
    supportedBusinessTypes: ['restaurant', 'retail', 'salon', 'contractor', 'service'],
    bundleStrategy: 'overview_only',
    dependencies: [],
    officialSourceUrl: 'https://www.statefarm.com/small-business-solutions/insurance/products',
    evidence:
      'State Farm’s small-business products overview provides the top-level catalog of business insurance product families used as the v1 source map for SafeGuard.',
  },
};

export function getCatalogEntry(productId) {
  return STATE_FARM_CATALOG[productId] || null;
}