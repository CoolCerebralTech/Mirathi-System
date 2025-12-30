// src/estate-service/src/domain/enums/valuation-source.enum.ts

/**
 * Valuation Source Enum
 *
 * Legal Context:
 * - Different sources have different credibility for tax/court purposes
 * - Registered valuers are preferred for high-value assets
 * - Market estimates are acceptable for low-value assets
 * - Self-declared values require verification
 */
export enum ValuationSource {
  // Professional Sources (High Credibility)
  REGISTERED_VALUER = 'REGISTERED_VALUER', // Licensed by Institution of Surveyors of Kenya
  CHARTERED_SURVEYOR = 'CHARTERED_SURVEYOR', // RICS accredited
  LICENSED_AUCTIONEER = 'LICENSED_AUCTIONEER', // Licensed by Auctioneers Board

  // Official Sources
  GOVERNMENT_VALUER = 'GOVERNMENT_VALUER', // Ministry of Lands valuers
  NTSA_VALUATION = 'NTSA_VALUATION', // National Transport and Safety Authority
  KRA_VALUATION = 'KRA_VALUATION', // Kenya Revenue Authority

  // Market Sources
  REAL_ESTATE_AGENT = 'REAL_ESTATE_AGENT', // Licensed agent valuation
  MARKET_COMPARABLE = 'MARKET_COMPARABLE', // Comparable sales analysis
  INSURANCE_VALUATION = 'INSURANCE_VALUATION', // Insurance company valuation

  // Financial Sources
  BANK_VALUATION = 'BANK_VALUATION', // Bank valuation for loan purposes
  FINANCIAL_ADVISOR = 'FINANCIAL_ADVISOR', // Certified financial advisor

  // User Sources (Lower Credibility)
  SELF_DECLARED = 'SELF_DECLARED', // Owner's declaration
  INHERITED_VALUE = 'INHERITED_VALUE', // Value from previous owner
  PURCHASE_PRICE = 'PURCHASE_PRICE', // Original purchase price

  // Other
  EXPERT_ESTIMATE = 'EXPERT_ESTIMATE', // Subject matter expert
  ONLINE_VALUATION = 'ONLINE_VALUATION', // Online valuation tool
  OTHER = 'OTHER', // Other unspecified source
}

/**
 * Valuation Source Helper Methods
 */
export class ValuationSourceHelper {
  /**
   * Check if source is professional (high credibility)
   */
  static isProfessionalSource(source: ValuationSource): boolean {
    const professionalSources = [
      ValuationSource.REGISTERED_VALUER,
      ValuationSource.CHARTERED_SURVEYOR,
      ValuationSource.LICENSED_AUCTIONEER,
      ValuationSource.GOVERNMENT_VALUER,
    ];
    return professionalSources.includes(source);
  }

  /**
   * Check if source is acceptable for court evidence
   */
  static isCourtAcceptable(source: ValuationSource): boolean {
    const courtAcceptable = [
      ValuationSource.REGISTERED_VALUER,
      ValuationSource.CHARTERED_SURVEYOR,
      ValuationSource.GOVERNMENT_VALUER,
      ValuationSource.NTSA_VALUATION,
      ValuationSource.KRA_VALUATION,
    ];
    return courtAcceptable.includes(source);
  }

  /**
   * Check if source is acceptable for tax purposes (KRA)
   */
  static isTaxAcceptable(source: ValuationSource): boolean {
    const taxAcceptable = [
      ValuationSource.REGISTERED_VALUER,
      ValuationSource.GOVERNMENT_VALUER,
      ValuationSource.KRA_VALUATION,
      ValuationSource.BANK_VALUATION,
    ];
    return taxAcceptable.includes(source);
  }

  /**
   * Check if source requires verification
   */
  static requiresVerification(source: ValuationSource): boolean {
    const verificationRequired = [
      ValuationSource.SELF_DECLARED,
      ValuationSource.ONLINE_VALUATION,
      ValuationSource.EXPERT_ESTIMATE,
      ValuationSource.OTHER,
    ];
    return verificationRequired.includes(source);
  }

  /**
   * Get credibility score (1-10)
   */
  static getCredibilityScore(source: ValuationSource): number {
    const scores: Record<ValuationSource, number> = {
      [ValuationSource.REGISTERED_VALUER]: 10,
      [ValuationSource.CHARTERED_SURVEYOR]: 10,
      [ValuationSource.GOVERNMENT_VALUER]: 9,
      [ValuationSource.NTSA_VALUATION]: 9,
      [ValuationSource.KRA_VALUATION]: 9,
      [ValuationSource.LICENSED_AUCTIONEER]: 8,
      [ValuationSource.BANK_VALUATION]: 8,
      [ValuationSource.REAL_ESTATE_AGENT]: 7,
      [ValuationSource.INSURANCE_VALUATION]: 7,
      [ValuationSource.MARKET_COMPARABLE]: 6,
      [ValuationSource.FINANCIAL_ADVISOR]: 6,
      [ValuationSource.PURCHASE_PRICE]: 5,
      [ValuationSource.EXPERT_ESTIMATE]: 4,
      [ValuationSource.INHERITED_VALUE]: 3,
      [ValuationSource.ONLINE_VALUATION]: 3,
      [ValuationSource.SELF_DECLARED]: 2,
      [ValuationSource.OTHER]: 1,
    };
    return scores[source] || 1;
  }

  /**
   * Check if two sources can be compared
   */
  static areComparable(source1: ValuationSource, source2: ValuationSource): boolean {
    const professional = this.isProfessionalSource(source1) && this.isProfessionalSource(source2);
    const market =
      [
        ValuationSource.MARKET_COMPARABLE,
        ValuationSource.REAL_ESTATE_AGENT,
        ValuationSource.ONLINE_VALUATION,
      ].includes(source1) &&
      [
        ValuationSource.MARKET_COMPARABLE,
        ValuationSource.REAL_ESTATE_AGENT,
        ValuationSource.ONLINE_VALUATION,
      ].includes(source2);

    return professional || market || source1 === source2;
  }

  /**
   * Get source description
   */
  static getDescription(source: ValuationSource): string {
    const descriptions: Record<ValuationSource, string> = {
      [ValuationSource.REGISTERED_VALUER]:
        'Licensed valuer registered with Institution of Surveyors of Kenya',
      [ValuationSource.CHARTERED_SURVEYOR]: 'RICS accredited chartered surveyor',
      [ValuationSource.LICENSED_AUCTIONEER]: 'Licensed auctioneer authorized by Auctioneers Board',
      [ValuationSource.GOVERNMENT_VALUER]: 'Government valuer from Ministry of Lands',
      [ValuationSource.NTSA_VALUATION]: 'Valuation by National Transport and Safety Authority',
      [ValuationSource.KRA_VALUATION]: 'Valuation by Kenya Revenue Authority for tax purposes',
      [ValuationSource.REAL_ESTATE_AGENT]: 'Valuation by licensed real estate agent',
      [ValuationSource.MARKET_COMPARABLE]: 'Market comparable analysis',
      [ValuationSource.INSURANCE_VALUATION]: 'Valuation for insurance purposes',
      [ValuationSource.BANK_VALUATION]: 'Bank valuation for loan collateral',
      [ValuationSource.FINANCIAL_ADVISOR]: 'Valuation by certified financial advisor',
      [ValuationSource.SELF_DECLARED]: 'Owner-declared value',
      [ValuationSource.INHERITED_VALUE]: 'Value inherited from previous owner',
      [ValuationSource.PURCHASE_PRICE]: 'Original purchase price',
      [ValuationSource.EXPERT_ESTIMATE]: 'Expert estimate by subject matter expert',
      [ValuationSource.ONLINE_VALUATION]: 'Online valuation tool estimate',
      [ValuationSource.OTHER]: 'Other valuation source',
    };
    return descriptions[source] || 'Unknown source';
  }

  /**
   * Get recommended sources for asset type
   */
  static getRecommendedSources(assetType: string): ValuationSource[] {
    const recommendations: Record<string, ValuationSource[]> = {
      LAND_PARCEL: [
        ValuationSource.REGISTERED_VALUER,
        ValuationSource.CHARTERED_SURVEYOR,
        ValuationSource.GOVERNMENT_VALUER,
        ValuationSource.MARKET_COMPARABLE,
      ],
      VEHICLE: [
        ValuationSource.NTSA_VALUATION,
        ValuationSource.LICENSED_AUCTIONEER,
        ValuationSource.INSURANCE_VALUATION,
      ],
      FINANCIAL_ASSET: [ValuationSource.BANK_VALUATION, ValuationSource.FINANCIAL_ADVISOR],
      BUSINESS_INTEREST: [
        ValuationSource.CHARTERED_SURVEYOR,
        ValuationSource.FINANCIAL_ADVISOR,
        ValuationSource.EXPERT_ESTIMATE,
      ],
      PROPERTY: [
        ValuationSource.REGISTERED_VALUER,
        ValuationSource.REAL_ESTATE_AGENT,
        ValuationSource.MARKET_COMPARABLE,
      ],
    };

    return (
      recommendations[assetType] || [
        ValuationSource.EXPERT_ESTIMATE,
        ValuationSource.MARKET_COMPARABLE,
        ValuationSource.SELF_DECLARED,
      ]
    );
  }
}
