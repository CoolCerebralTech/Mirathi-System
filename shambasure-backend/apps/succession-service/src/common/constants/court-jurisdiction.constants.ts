/**
 * Kenyan Court Jurisdiction Constants
 */

// Court Types and Jurisdiction
export const COURT_JURISDICTION = {
  HIGH_COURT: {
    name: 'High Court of Kenya',
    jurisdiction: 'UNLIMITED',
    threshold: 5000000, // KES 5M
    locations: [
      'Nairobi',
      'Mombasa',
      'Kisumu',
      'Nakuru',
      'Eldoret',
      'Meru',
      'Nyeri',
      'Machakos',
      'Kakamega',
      'Malindi',
    ],
    probateDivision: true,
    complexCases: true,
    appeals: true,
  },

  MAGISTRATE_COURT: {
    name: 'Magistrate Court',
    jurisdiction: 'LIMITED',
    threshold: 5000000, // KES 5M
    grades: {
      CHIEF: {
        jurisdiction: 'UNLIMITED',
        locations: ['All County Headquarters'],
        probatePowers: true,
      },
      SENIOR: {
        jurisdiction: 7000000, // KES 7M
        locations: ['Major Towns'],
        probatePowers: true,
      },
      PRINCIPAL: {
        jurisdiction: 5000000, // KES 5M
        locations: ['Sub-County Headquarters'],
        probatePowers: true,
      },
    },
  },

  KADHIS_COURT: {
    name: 'Kadhis Court',
    jurisdiction: 'MUSLIM_LAW',
    threshold: null,
    locations: [
      'Nairobi',
      'Mombasa',
      'Malindi',
      'Lamu',
      'Garissa',
      'Wajir',
      'Mandera',
      'Isiolo',
      'Marsabit',
    ],
    applicableLaw: 'MUSLIM_LAW',
    successionMatters: true,
    shariaCompliantAssets: true,
  },

  ENVIRONMENT_LAND_COURT: {
    name: 'Environment and Land Court',
    jurisdiction: 'LAND_DISPUTES',
    threshold: null,
    locations: [
      'Nairobi',
      'Mombasa',
      'Kisumu',
      'Nakuru',
      'Eldoret',
      'Meru',
      'Malindi',
      'Kakamega',
      'Machakos',
    ],
    landSuccession: true,
    boundaryDisputes: true,
  },
} as const;

// Court Locations by County
export const COURT_LOCATIONS = {
  NAIROBI: {
    highCourt: 'Nairobi Law Courts',
    chiefMagistrate: 'Nairobi Chief Magistrates Court',
    kadhisCourt: 'Nairobi Kadhis Court',
    landCourt: 'Nairobi Environment and Land Court',
  },
  MOMBASA: {
    highCourt: 'Mombasa Law Courts',
    chiefMagistrate: 'Mombasa Chief Magistrates Court',
    kadhisCourt: 'Mombasa Kadhis Court',
    landCourt: 'Mombasa Environment and Land Court',
  },
  KISUMU: {
    highCourt: 'Kisumu Law Courts',
    chiefMagistrate: 'Kisumu Chief Magistrates Court',
    landCourt: 'Kisumu Environment and Land Court',
  },
  NAKURU: {
    highCourt: 'Nakuru Law Courts',
    chiefMagistrate: 'Nakuru Chief Magistrates Court',
    landCourt: 'Nakuru Environment and Land Court',
  },
} as const;

// Jurisdiction Rules
export const JURISDICTION_RULES = {
  PROBATE_JURISDICTION: {
    HIGH_COURT: [
      'Estates over KES 5,000,000',
      'Complex succession matters',
      'Testamentary trusts',
      'International elements',
      'Contentious probate',
    ],
    MAGISTRATE_COURT: [
      'Estates up to KES 5,000,000',
      'Straightforward succession',
      'Uncontested applications',
      'Small estates',
    ],
    KADHIS_COURT: ['Muslim succession matters', 'Islamic law application', 'Muslim personal law'],
  },

  VENUE_RULES: {
    DECEASED_RESIDENCE: 'Primary venue based on last residence',
    ASSET_LOCATION: 'Alternative venue based on asset location',
    COURT_DISTRICT: "Within court's territorial jurisdiction",
    CONSENT_TRANSFER: 'Transfer by consent or court order',
  },
} as const;

// Court Contact Information
export const COURT_CONTACTS = {
  HIGH_COURT_NAIROBI: {
    address: 'City Hall Way, Nairobi',
    phone: '+254-20-2221221',
    email: 'highcourt@judiciary.go.ke',
    probateRegistry: 'Room 15, 1st Floor',
  },
  CHIEF_MAGISTRATE_NAIROBI: {
    address: 'Makadara Law Courts, Nairobi',
    phone: '+254-20-2221221',
    email: 'makadara@judiciary.go.ke',
  },
} as const;

// --- Helper: Succession Court Mapping ---
export const getProbateCourtForEstate = (
  estateValue: number,
  isComplex: boolean,
  law: 'KENYAN' | 'MUSLIM' = 'KENYAN',
) => {
  if (law === 'MUSLIM') return COURT_JURISDICTION.KADHIS_COURT;

  if (isComplex || estateValue > COURT_JURISDICTION.HIGH_COURT.threshold) {
    return COURT_JURISDICTION.HIGH_COURT;
  }

  return COURT_JURISDICTION.MAGISTRATE_COURT;
};

export default {
  COURT_JURISDICTION,
  COURT_LOCATIONS,
  JURISDICTION_RULES,
  COURT_CONTACTS,
  getProbateCourtForEstate,
};
