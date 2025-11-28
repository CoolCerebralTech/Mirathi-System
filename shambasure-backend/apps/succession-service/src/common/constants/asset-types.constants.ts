/**
 * Asset Types and Classification Constants
 * Based on Kenyan asset categories and succession law
 */

// Core Asset Types
export const ASSET_TYPES = {
  // Land and Real Estate
  LAND_PARCEL: {
    code: 'LAND_PARCEL',
    label: 'Land Parcel',
    category: 'IMMOVABLE',
    description: 'Plot of land with or without improvements',
    kenyanSpecific: true,
    valuationMethod: 'MARKET_COMPARISON',
    registration: 'LAND_REGISTRY',
  },

  PROPERTY: {
    code: 'PROPERTY',
    label: 'Property',
    category: 'IMMOVABLE',
    description: 'Building or structure on land',
    subTypes: ['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'AGRICULTURAL'],
    valuationMethod: 'COST_APPROACH',
    registration: 'VARIOUS',
  },

  // Financial Assets
  FINANCIAL_ASSET: {
    code: 'FINANCIAL_ASSET',
    label: 'Financial Asset',
    category: 'FINANCIAL',
    description: 'Bank accounts, investments, and financial instruments',
    subTypes: ['BANK_ACCOUNT', 'SACCO_SHARES', 'INVESTMENTS', 'BONDS'],
    valuationMethod: 'ACCOUNT_STATEMENT',
    registration: 'FINANCIAL_INSTITUTION',
  },

  // Digital Assets
  DIGITAL_ASSET: {
    code: 'DIGITAL_ASSET',
    label: 'Digital Asset',
    category: 'DIGITAL',
    description: 'Online accounts, cryptocurrencies, digital content',
    subTypes: ['CRYPTOCURRENCY', 'SOCIAL_MEDIA', 'ONLINE_BUSINESS', 'DOMAIN_NAMES'],
    valuationMethod: 'MARKET_VALUE',
    registration: 'DIGITAL_PLATFORM',
  },

  // Business Interests
  BUSINESS_INTEREST: {
    code: 'BUSINESS_INTEREST',
    label: 'Business Interest',
    category: 'BUSINESS',
    description: 'Ownership in business enterprises',
    subTypes: ['SOLE_PROPRIETORSHIP', 'PARTNERSHIP', 'COMPANY_SHARES', 'FRANCHISE'],
    valuationMethod: 'INCOME_APPROACH',
    registration: 'COMPANIES_REGISTRY',
  },

  // Vehicles and Equipment
  VEHICLE: {
    code: 'VEHICLE',
    label: 'Vehicle',
    category: 'MOVABLE',
    description: 'Motor vehicles, machinery, and equipment',
    subTypes: ['PERSONAL_CAR', 'COMMERCIAL_VEHICLE', 'MOTORCYCLE', 'AGRICULTURAL_EQUIPMENT'],
    valuationMethod: 'DEPRECIATION',
    registration: 'NTSA',
  },

  // Livestock and Agriculture
  LIVESTOCK: {
    code: 'LIVESTOCK',
    label: 'Livestock',
    category: 'MOVABLE',
    description: 'Animals kept for agricultural purposes',
    subTypes: ['CATTLE', 'GOATS', 'SHEEP', 'POULTRY', 'BEE_HIVES'],
    valuationMethod: 'MARKET_RATE',
    registration: 'LOCAL_AUTHORITY',
  },

  // Personal Effects
  PERSONAL_EFFECTS: {
    code: 'PERSONAL_EFFECTS',
    label: 'Personal Effects',
    category: 'MOVABLE',
    description: 'Personal belongings and household items',
    subTypes: ['JEWELRY', 'ART', 'FURNITURE', 'ELECTRONICS', 'COLLECTIBLES'],
    valuationMethod: 'APPRAISAL',
    registration: 'NONE',
  },

  // Intellectual Property
  INTELLECTUAL_PROPERTY: {
    code: 'INTELLECTUAL_PROPERTY',
    label: 'Intellectual Property',
    category: 'INTANGIBLE',
    description: 'Copyrights, patents, trademarks',
    subTypes: ['COPYRIGHT', 'PATENT', 'TRADEMARK', 'DESIGN_RIGHT'],
    valuationMethod: 'ROYALTY_STREAM',
    registration: 'KIPI',
  },

  // Other Assets
  OTHER: {
    code: 'OTHER',
    label: 'Other Asset',
    category: 'OTHER',
    description: 'Other types of assets not categorized above',
    valuationMethod: 'MANUAL_ASSESSMENT',
    registration: 'VARIOUS',
  },
} as const;

// Kenyan Specific Asset Categories
export const KENYAN_ASSET_CATEGORIES = {
  // Land Classification
  LAND_CLASSIFICATION: {
    AGRICULTURAL: {
      types: ['FARM_LAND', 'RANCH', 'PLANTATION'],
      valuation: 'PRODUCTIVITY_BASED',
    },
    RESIDENTIAL: {
      types: ['URBAN', 'RURAL', 'SUBDIVIDED'],
      valuation: 'LOCATION_BASED',
    },
    COMMERCIAL: {
      types: ['COMMERCIAL_PLOT', 'INDUSTRIAL_PLOT'],
      valuation: 'INCOME_POTENTIAL',
    },
  },

  // Special Kenyan Assets
  SPECIAL_ASSETS: {
    TEA_FARM: {
      description: 'Tea plantation with bushes',
      valuation: 'BUSHEL_COUNT',
    },
    COFFEE_FARM: {
      description: 'Coffee plantation with trees',
      valuation: 'TREE_COUNT',
    },
    GROUP_REPRESENTATIVE_LAND: {
      description: 'Land held under group representative',
      specialRules: true,
    },
  },
} as const;

// Asset Ownership Types
export const OWNERSHIP_TYPES = {
  SOLE: {
    code: 'SOLE',
    label: 'Sole Ownership',
    description: 'Single individual owns 100% of asset',
    transferable: true,
    requiresConsent: false,
  },

  JOINT_TENANCY: {
    code: 'JOINT_TENANCY',
    label: 'Joint Tenancy',
    description: 'Joint owners with right of survivorship',
    transferable: true,
    requiresConsent: true,
    rightOfSurvivorship: true,
  },

  TENANCY_IN_COMMON: {
    code: 'TENANCY_IN_COMMON',
    label: 'Tenancy in Common',
    description: 'Shared ownership with defined shares',
    transferable: true,
    requiresConsent: false,
    rightOfSurvivorship: false,
  },

  COMMUNITY_PROPERTY: {
    code: 'COMMUNITY_PROPERTY',
    label: 'Community Property',
    description: 'Marital property regime assets',
    transferable: true,
    requiresConsent: true,
    maritalProperty: true,
  },
} as const;

// Asset Documentation Requirements
export const DOCUMENTATION_REQUIREMENTS = {
  LAND_PARCEL: ['TITLE_DEED', 'SURVEY_PLAN', 'RATES_CLEARANCE', 'LAND_SEARCH'],

  PROPERTY: ['TITLE_DEED', 'BUILDING_PLANS', 'OCCUPANCY_CERTIFICATE', 'RATES_RECEIPTS'],

  VEHICLE: ['LOG_BOOK', 'INSURANCE_COVER', 'INSPECTION_REPORT'],

  FINANCIAL_ASSET: ['ACCOUNT_STATEMENT', 'CERTIFICATE_OF_DEPOSIT', 'SHARE_CERTIFICATE'],

  BUSINESS_INTEREST: ['CERTIFICATE_OF_INCORPORATION', 'SHARE_CERTIFICATE', 'BUSINESS_PERMIT'],
} as const;

// Asset Valuation Methods
export const VALUATION_METHODS = {
  MARKET_COMPARISON: {
    code: 'MARKET_COMPARISON',
    label: 'Market Comparison Approach',
    description: 'Based on recent sales of similar assets',
    suitableFor: ['LAND_PARCEL', 'PROPERTY', 'VEHICLE'],
    accuracy: 'HIGH',
  },

  INCOME_APPROACH: {
    code: 'INCOME_APPROACH',
    label: 'Income Approach',
    description: 'Based on income generation potential',
    suitableFor: ['PROPERTY', 'BUSINESS_INTEREST'],
    accuracy: 'MEDIUM',
  },

  COST_APPROACH: {
    code: 'COST_APPROACH',
    label: 'Cost Approach',
    description: 'Based on replacement cost',
    suitableFor: ['PROPERTY', 'SPECIALIZED_EQUIPMENT'],
    accuracy: 'MEDIUM',
  },

  PROFESSIONAL_APPRAISAL: {
    code: 'PROFESSIONAL_APPRAISAL',
    label: 'Professional Appraisal',
    description: 'Certified professional valuation',
    suitableFor: ['ALL_ASSETS'],
    accuracy: 'HIGH',
  },
} as const;

// Kenyan Regulatory Bodies
export const REGULATORY_BODIES = {
  LAND_REGISTRY: {
    name: 'Ministry of Lands and Physical Planning',
    role: 'Land registration and titling',
    jurisdiction: 'NATIONAL',
  },

  NTSA: {
    name: 'National Transport and Safety Authority',
    role: 'Vehicle registration',
    jurisdiction: 'NATIONAL',
  },

  KIPI: {
    name: 'Kenya Industrial Property Institute',
    role: 'Intellectual property registration',
    jurisdiction: 'NATIONAL',
  },

  CAPITAL_MARKETS: {
    name: 'Capital Markets Authority',
    role: 'Financial assets regulation',
    jurisdiction: 'NATIONAL',
  },
} as const;

export default {
  ASSET_TYPES,
  KENYAN_ASSET_CATEGORIES,
  OWNERSHIP_TYPES,
  DOCUMENTATION_REQUIREMENTS,
  VALUATION_METHODS,
  REGULATORY_BODIES,
};
