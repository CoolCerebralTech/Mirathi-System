import { MarriageStatus } from '@prisma/client';
import { KenyanMarriage } from '../value-objects/kenyan-marriage.vo';

export interface CustomaryMarriageValidation {
  isValid: boolean;
  requirementsMet: string[];
  requirementsMissing: string[];
  recommendations: string[];
  legalStatus: 'FULLY_RECOGNIZED' | 'PARTIALLY_RECOGNIZED' | 'NOT_RECOGNIZED';
}

export class CustomaryMarriagePolicy {
  /**
   * Validates customary marriage according to Kenyan law and community standards
   */
  validateCustomaryMarriage(marriage: KenyanMarriage): CustomaryMarriageValidation {
    const requirementsMet: string[] = [];
    const requirementsMissing: string[] = [];
    const recommendations: string[] = [];

    const details = marriage.getDetails();
    const customaryDetails = details.customaryDetails;

    if (!customaryDetails) {
      return {
        isValid: false,
        requirementsMet: [],
        requirementsMissing: ['Customary marriage details are required'],
        recommendations: ['Provide details of the customary marriage ceremony and community'],
        legalStatus: 'NOT_RECOGNIZED',
      };
    }

    // Basic requirements for customary marriage recognition
    if (customaryDetails.community) {
      requirementsMet.push('Community specification');
    } else {
      requirementsMissing.push('Community must be specified');
    }

    if (customaryDetails.eldersInvolved && customaryDetails.eldersInvolved.length > 0) {
      requirementsMet.push('Elder involvement');
    } else {
      requirementsMissing.push('Elders or community leaders should be involved');
    }

    if (
      customaryDetails.traditionalRitesPerformed &&
      customaryDetails.traditionalRitesPerformed.length > 0
    ) {
      requirementsMet.push('Traditional rites performed');
    } else {
      requirementsMissing.push('Traditional marriage rites should be performed');
    }

    // Bride price considerations
    if (customaryDetails.bridePricePaid) {
      requirementsMet.push('Bride price payment acknowledged');
      if (!customaryDetails.bridePriceDetails) {
        recommendations.push('Document bride price details for legal clarity');
      }
    } else {
      recommendations.push('Consider documenting bride price arrangements, even if not paid');
    }

    // Legal registration
    if (details.certificateNumber) {
      requirementsMet.push('Customary marriage registered');
    } else {
      requirementsMissing.push('Customary marriage registration certificate');
      recommendations.push('Register the customary marriage for full legal recognition');
    }

    // Determine legal status
    let legalStatus: 'FULLY_RECOGNIZED' | 'PARTIALLY_RECOGNIZED' | 'NOT_RECOGNIZED' =
      'NOT_RECOGNIZED';

    if (requirementsMissing.length === 0 && details.certificateNumber) {
      legalStatus = 'FULLY_RECOGNIZED';
    } else if (requirementsMissing.length <= 2) {
      legalStatus = 'PARTIALLY_RECOGNIZED';
    }

    const isValid = legalStatus !== 'NOT_RECOGNIZED';

    return {
      isValid,
      requirementsMet,
      requirementsMissing,
      recommendations,
      legalStatus,
    };
  }

  /**
   * Kenyan communities and their customary marriage requirements
   */
  getCommunityRequirements(community: string): {
    requiredRites: string[];
    typicalBridePrice: string;
    elderRequirements: string;
    documentationNeeded: string[];
  } {
    const communityRequirements: Record<string, any> = {
      Kikuyu: {
        requiredRites: ['Ngurario', 'Ruracio'],
        typicalBridePrice: 'Livestock and monetary payment',
        elderRequirements: 'Family elders from both sides',
        documentationNeeded: ['Ruracio agreement', 'Elder witness statements'],
      },
      Luo: {
        requiredRites: ['Ayie', 'Introduction ceremony'],
        typicalBridePrice: 'Livestock (cows, goats)',
        elderRequirements: 'Jodongo (family spokespersons)',
        documentationNeeded: ['Ayie agreement', 'Elder witness statements'],
      },
      Kamba: {
        requiredRites: ['Ntheo', 'Introduction ceremony'],
        typicalBridePrice: 'Livestock and monetary payment',
        elderRequirements: 'Family elders and spokespersons',
        documentationNeeded: ['Ntheo agreement', 'Elder statements'],
      },
      Kalenjin: {
        requiredRites: ['Tilyet', 'Koito'],
        typicalBridePrice: 'Livestock (cows)',
        elderRequirements: 'Family elders and community leaders',
        documentationNeeded: ['Tilyet agreement', 'Elder witness statements'],
      },
      Luhya: {
        requiredRites: ['Introduction', 'Bride price negotiation'],
        typicalBridePrice: 'Livestock and monetary payment',
        elderRequirements: 'Family elders and spokespersons',
        documentationNeeded: ['Bride price agreement', 'Elder statements'],
      },
      Kisii: {
        requiredRites: ['Esarate', 'Introduction ceremony'],
        typicalBridePrice: 'Livestock and monetary payment',
        elderRequirements: 'Family elders and community leaders',
        documentationNeeded: ['Esarate agreement', 'Elder witness statements'],
      },
      Meru: {
        requiredRites: ['Nkuo', 'Traditional wedding'],
        typicalBridePrice: 'Livestock and monetary payment',
        elderRequirements: 'Family elders and spokespersons',
        documentationNeeded: ['Nkuo agreement', 'Elder statements'],
      },
    };

    return (
      communityRequirements[community] || {
        requiredRites: ['Introduction ceremony', 'Bride price negotiation'],
        typicalBridePrice: 'Community-specific arrangements',
        elderRequirements: 'Family elders and community leaders',
        documentationNeeded: ['Marriage agreement', 'Elder witness statements'],
      }
    );
  }

  /**
   * Validate polygamous marriage under Kenyan law
   */
  validatePolygamousMarriage(
    marriage: KenyanMarriage,
    existingMarriages: KenyanMarriage[],
  ): {
    isValid: boolean;
    issues: string[];
    requirements: string[];
  } {
    const issues: string[] = [];
    const requirements: string[] = [];

    const details = marriage.getDetails();

    if (!details.isPolygamous) {
      return {
        isValid: true,
        issues: [],
        requirements: [],
      };
    }

    // Check if polygamy is approved
    if (!details.polygamyApproved) {
      issues.push('Polygamous marriage requires proper approval under Kenyan law');
      requirements.push('Obtain consent from existing spouse(s) and register as polygamous');
    }

    // Check for conflicts with existing marriages
    const activeMarriages = existingMarriages.filter((m) => m.getIsActive());

    if (activeMarriages.length > 0 && !details.polygamyApproved) {
      issues.push(
        'Existing marriage(s) found - polygamous marriage requires consent from existing spouse(s)',
      );
      requirements.push('Provide evidence of consent from existing spouse(s)');
    }

    // Legal requirements for polygamous marriages
    requirements.push('Register marriage as polygamous with relevant authorities');
    requirements.push(
      'Ensure equal treatment and provision for all spouses in succession planning',
    );
    requirements.push('Document consent from all affected parties');

    return {
      isValid: issues.length === 0,
      issues,
      requirements,
    };
  }

  /**
   * Get succession rights for customary marriages
   */
  getSuccessionRights(marriage: KenyanMarriage): {
    inheritanceRights: string[];
    propertyRights: string[];
    childrensRights: string[];
    limitations: string[];
  } {
    const rights = {
      inheritanceRights: [] as string[],
      propertyRights: [] as string[],
      childrensRights: [] as string[],
      limitations: [] as string[],
    };

    const validation = this.validateCustomaryMarriage(marriage);

    if (validation.legalStatus === 'FULLY_RECOGNIZED') {
      rights.inheritanceRights.push('Equal inheritance rights as civil marriage');
      rights.inheritanceRights.push('Right to share in estate under Law of Succession Act');
      rights.propertyRights.push('Right to matrimonial property');
      rights.propertyRights.push('Right to spousal maintenance if dependent');
      rights.childrensRights.push('Children have equal inheritance rights');
    } else if (validation.legalStatus === 'PARTIALLY_RECOGNIZED') {
      rights.inheritanceRights.push('Limited inheritance rights - may require court determination');
      rights.propertyRights.push('Property rights may require proof of contribution');
      rights.childrensRights.push(
        'Children have inheritance rights regardless of marriage recognition',
      );
      rights.limitations.push('May require additional evidence for full recognition');
    } else {
      rights.limitations.push('Limited legal recognition - succession rights may be challenged');
      rights.limitations.push('Court determination may be required for inheritance');
    }

    // Polygamous marriage considerations
    if (marriage.isPolygamous()) {
      rights.inheritanceRights.push('Equal share with other spouses in polygamous marriage');
      rights.limitations.push('Estate must be divided equally among all spouses');
    }

    return rights;
  }
}
