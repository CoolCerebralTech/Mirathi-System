import { AssetType, AssetOwnershipType } from '@prisma/client';
import { AssetValue } from '../value-objects/asset-value.vo';

export interface AssetVerificationContext {
  assetType: AssetType;
  ownershipType: AssetOwnershipType;
  ownershipShare: number;
  estimatedValue: AssetValue;
  hasTitleDocument: boolean;
  documentStatus: 'VERIFIED' | 'PENDING' | 'MISSING';
  location?: {
    county: string;
    subCounty?: string;
    coordinates?: { latitude: number; longitude: number };
  };
  identification?: {
    registrationNumber?: string;
    parcelNumber?: string;
    accountNumber?: string;
  };
  encumbrances: Array<{
    type: string;
    amount?: number;
    creditor?: string;
  }>;
}

export class AssetVerificationPolicy {
  /**
   * Comprehensive asset verification for Kenyan succession purposes
   */
  verifyAsset(context: AssetVerificationContext): {
    isVerified: boolean;
    verificationLevel: 'FULL' | 'PARTIAL' | 'MINIMAL' | 'UNVERIFIED';
    requiredDocuments: string[];
    missingRequirements: string[];
    riskAssessment: 'LOW' | 'MEDIUM' | 'HIGH';
    recommendations: string[];
  } {
    const requiredDocuments: string[] = [];
    const missingRequirements: string[] = [];
    const recommendations: string[] = [];
    let verificationLevel: 'FULL' | 'PARTIAL' | 'MINIMAL' | 'UNVERIFIED' = 'UNVERIFIED';
    let riskAssessment: 'LOW' | 'MEDIUM' | 'HIGH' = 'HIGH';

    // Asset type specific verification
    this.verifyByAssetType(context, requiredDocuments, missingRequirements);

    // Ownership verification
    this.verifyOwnership(context, requiredDocuments, missingRequirements);

    // Value verification
    this.verifyValue(context, recommendations);

    // Document status check
    if (context.documentStatus === 'VERIFIED') {
      verificationLevel = this.calculateVerificationLevel(context, requiredDocuments);
    } else if (context.documentStatus === 'PENDING') {
      verificationLevel = 'PARTIAL';
    }

    // Risk assessment
    riskAssessment = this.assessRisk(context, verificationLevel);

    // Final verification status
    const isVerified = verificationLevel === 'FULL' || verificationLevel === 'PARTIAL';

    return {
      isVerified,
      verificationLevel,
      requiredDocuments,
      missingRequirements,
      riskAssessment,
      recommendations,
    };
  }

  private verifyByAssetType(
    context: AssetVerificationContext,
    requiredDocuments: string[],
    missingRequirements: string[],
  ): void {
    switch (context.assetType) {
      case AssetType.LAND_PARCEL:
        requiredDocuments.push(
          'Title Deed',
          'Land Rates Clearance Certificate',
          'Search Certificate from Lands Registry',
          'Map/Site Plan',
        );
        if (!context.identification?.registrationNumber) {
          missingRequirements.push('Title deed number (LR Number)');
        }
        if (!context.location?.county) {
          missingRequirements.push('Property location details');
        }
        break;

      case AssetType.PROPERTY:
        requiredDocuments.push(
          'Title Deed for Land',
          'Building Plans Approval',
          'NEMA Certificate (if applicable)',
          'Rental Income Records (if income generating)',
        );
        break;

      case AssetType.FINANCIAL_ASSET:
        requiredDocuments.push(
          'Bank Statements (last 6 months)',
          'Account Ownership Proof',
          'SACCO Share Certificate',
          'Investment Statements',
        );
        if (!context.identification?.accountNumber) {
          missingRequirements.push('Account number or investment reference');
        }
        break;

      case AssetType.VEHICLE:
        requiredDocuments.push(
          'Logbook',
          'Purchase Agreement/Invoice',
          'Insurance Certificate',
          'Inspection Certificate',
        );
        if (!context.identification?.registrationNumber) {
          missingRequirements.push('Vehicle registration number');
        }
        break;

      case AssetType.BUSINESS_INTEREST:
        requiredDocuments.push(
          'Business Registration Certificate',
          'Partnership Agreement (if applicable)',
          'Financial Statements (last 2 years)',
          'KRA PIN Certificate',
        );
        break;

      default:
        requiredDocuments.push('Proof of Ownership', 'Purchase Receipt/Agreement');
        break;
    }
  }

  private verifyOwnership(
    context: AssetVerificationContext,
    requiredDocuments: string[],
    missingRequirements: string[],
  ): void {
    if (context.ownershipType === AssetOwnershipType.JOINT_TENANCY) {
      requiredDocuments.push('Joint Ownership Agreement', 'Consent from Co-owners');
    } else if (context.ownershipType === AssetOwnershipType.TENANCY_IN_COMMON) {
      requiredDocuments.push('Share Certificate', 'Co-ownership Agreement');
      if (context.ownershipShare <= 0 || context.ownershipShare > 100) {
        missingRequirements.push('Valid ownership share percentage (0-100)');
      }
    }

    if (!context.hasTitleDocument) {
      missingRequirements.push('Title document or proof of ownership');
    }
  }

  private verifyValue(context: AssetVerificationContext, recommendations: string[]): void {
    const value = context.estimatedValue.getAmount();

    if (value <= 0) {
      recommendations.push('Asset value should be positive - consider professional valuation');
    } else if (value > 10000000) {
      // 10M KES
      recommendations.push('High-value asset - recommend professional valuation for accuracy');
    }

    // Check if valuation is current (within 1 year)
    const valuationDate = context.estimatedValue.getValuationDate();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    if (valuationDate < oneYearAgo) {
      recommendations.push('Asset valuation is outdated - consider current market valuation');
    }
  }

  private calculateVerificationLevel(
    context: AssetVerificationContext,
    requiredDocuments: string[],
  ): 'FULL' | 'PARTIAL' | 'MINIMAL' | 'UNVERIFIED' {
    // Simplified verification level calculation
    // In reality, this would be more sophisticated

    const hasAllCriticalDocs = this.hasCriticalDocuments(context);
    const hasReasonableValue = context.estimatedValue.getAmount() > 0;
    const hasProperIdentification =
      !!context.identification?.registrationNumber || !!context.identification?.accountNumber;

    if (hasAllCriticalDocs && hasReasonableValue && hasProperIdentification) {
      return 'FULL';
    } else if (hasReasonableValue && hasProperIdentification) {
      return 'PARTIAL';
    } else if (hasReasonableValue) {
      return 'MINIMAL';
    } else {
      return 'UNVERIFIED';
    }
  }

  private hasCriticalDocuments(context: AssetVerificationContext): boolean {
    // Different asset types have different critical documents
    switch (context.assetType) {
      case AssetType.LAND_PARCEL:
        return !!context.identification?.registrationNumber && context.hasTitleDocument;

      case AssetType.FINANCIAL_ASSET:
        return !!context.identification?.accountNumber;

      case AssetType.VEHICLE:
        return !!context.identification?.registrationNumber;

      default:
        return context.hasTitleDocument;
    }
  }

  private assessRisk(
    context: AssetVerificationContext,
    verificationLevel: 'FULL' | 'PARTIAL' | 'MINIMAL' | 'UNVERIFIED',
  ): 'LOW' | 'MEDIUM' | 'HIGH' {
    let riskScore = 0;

    // Verification level impact
    switch (verificationLevel) {
      case 'FULL':
        riskScore += 0;
        break;
      case 'PARTIAL':
        riskScore += 2;
        break;
      case 'MINIMAL':
        riskScore += 4;
        break;
      case 'UNVERIFIED':
        riskScore += 6;
        break;
    }

    // Encumbrances impact
    if (context.encumbrances.length > 0) {
      riskScore += context.encumbrances.length * 2;
    }

    // Ownership type impact
    if (context.ownershipType !== AssetOwnershipType.SOLE) {
      riskScore += 2;
    }

    // High value assets have higher risk
    const value = context.estimatedValue.getAmount();
    if (value > 5000000) {
      // 5M KES
      riskScore += 2;
    }

    if (value > 20000000) {
      // 20M KES
      riskScore += 2;
    }

    // Determine risk level
    if (riskScore <= 2) return 'LOW';
    if (riskScore <= 5) return 'MEDIUM';
    return 'HIGH';
  }

  /**
   * Kenyan regulatory requirements for different asset types
   */
  getRegulatoryRequirements(assetType: AssetType): {
    governingLaws: string[];
    registrationAuthorities: string[];
    taxImplications: string[];
    transferRestrictions: string[];
  } {
    const requirements = {
      governingLaws: [] as string[],
      registrationAuthorities: [] as string[],
      taxImplications: [] as string[],
      transferRestrictions: [] as string[],
    };

    switch (assetType) {
      case AssetType.LAND_PARCEL:
        requirements.governingLaws.push('Land Registration Act', 'Land Act', 'Community Land Act');
        requirements.registrationAuthorities.push('Ministry of Lands', 'County Government');
        requirements.taxImplications.push('Stamp Duty', 'Capital Gains Tax', 'Land Rates');
        requirements.transferRestrictions.push(
          'Consent from Land Control Board for agricultural land',
        );
        break;

      case AssetType.PROPERTY:
        requirements.governingLaws.push('Land Registration Act', 'Physical Planning Act');
        requirements.registrationAuthorities.push('Ministry of Lands', 'NEMA');
        requirements.taxImplications.push('Stamp Duty', 'Rental Income Tax');
        break;

      case AssetType.FINANCIAL_ASSET:
        requirements.governingLaws.push('Banking Act', 'Capital Markets Act');
        requirements.registrationAuthorities.push(
          'Central Bank of Kenya',
          'Capital Markets Authority',
        );
        requirements.taxImplications.push('Withholding Tax', 'Investment Income Tax');
        break;

      case AssetType.BUSINESS_INTEREST:
        requirements.governingLaws.push('Companies Act', 'Partnership Act');
        requirements.registrationAuthorities.push('Business Registration Service', 'KRA');
        requirements.taxImplications.push('Corporate Tax', 'Dividend Withholding Tax');
        break;

      default:
        requirements.governingLaws.push('Law of Succession Act', 'Sale of Goods Act');
        requirements.taxImplications.push('Capital Gains Tax');
    }

    return requirements;
  }
}
