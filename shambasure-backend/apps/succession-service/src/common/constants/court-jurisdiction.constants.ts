/**
 * Kenyan Court Jurisdiction Constants
 */

// Court Types and Jurisdiction
export const COURT_JURISDICTION = {
  HIGH_COURT: {
    name: 'High Court of Kenya',
    jurisdiction: 'UNLIMITED',
    // Let's be explicit: this is the minimum value they handle by default
    minJurisdiction: 5000001, // Anything OVER 5M
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
    jurisdiction: 'LIMITED_BY_GRADE', // More descriptive
    grades: {
      CHIEF: {
        name: 'Chief Magistrate',
        // Per the Magistrates' Courts Act, they handle matters the High Court can.
        maxJurisdiction: null, // Representing Unlimited
        probatePowers: true,
      },
      SENIOR: {
        name: 'Senior Principal Magistrate',
        maxJurisdiction: 7000000, // KES 7M
        probatePowers: true,
      },
      PRINCIPAL: {
        name: 'Principal Magistrate',
        maxJurisdiction: 5000000, // KES 5M
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
  isMuslimSuccession: boolean,
) => {
  if (isMuslimSuccession) {
    return { court: COURT_JURISDICTION.KADHIS_COURT, grade: null };
  }

  // Complex cases or those exceeding the highest magistrate limit go to High Court
  if (isComplex || estateValue >= COURT_JURISDICTION.HIGH_COURT.minJurisdiction) {
    return { court: COURT_JURISDICTION.HIGH_COURT, grade: null };
  }

  // Find the appropriate magistrate court grade
  const grades = COURT_JURISDICTION.MAGISTRATE_COURT.grades;
  if (estateValue <= grades.PRINCIPAL.maxJurisdiction) {
    return { court: COURT_JURISDICTION.MAGISTRATE_COURT, grade: grades.PRINCIPAL };
  }
  if (estateValue <= grades.SENIOR.maxJurisdiction) {
    return { court: COURT_JURISDICTION.MAGISTRATE_COURT, grade: grades.SENIOR };
  }
  // In theory, Chief Magistrate has unlimited jurisdiction, but for non-complex cases,
  // it would have been caught by the lower tiers. This can be the fallback.
  return { court: COURT_JURISDICTION.MAGISTRATE_COURT, grade: grades.CHIEF };
};

export default {
  COURT_JURISDICTION,
  COURT_LOCATIONS,
  JURISDICTION_RULES,
  COURT_CONTACTS,
  getProbateCourtForEstate,
};
