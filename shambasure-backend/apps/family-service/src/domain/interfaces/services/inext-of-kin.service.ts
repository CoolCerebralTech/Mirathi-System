export interface INextOfKinService {
  // NOK determination policy
  determineNextOfKin(
    memberId: string,
    context?: 'MEDICAL' | 'LEGAL' | 'FINANCIAL',
  ): Promise<
    Array<{
      personId: string;
      relationship: string;
      priority: number;
      contactInfo: {
        phone?: string;
        email?: string;
        address?: string;
      };
    }>
  >;

  // Emergency contact management
  updateEmergencyContacts(
    memberId: string,
    contacts: Array<{
      name: string;
      relationship: string;
      phone: string;
      email?: string;
      priority: number;
    }>,
  ): Promise<void>;

  // NOK designation validation
  validateNokDesignation(
    designatorId: string,
    designeeId: string,
    relationship: string,
  ): Promise<{
    valid: boolean;
    legalBasis: string;
    restrictions: string[];
    overridePossible: boolean;
  }>;

  // Multiple NOK scenarios
  handleMultipleNok(
    memberId: string,
    noks: Array<{
      personId: string;
      relationship: string;
      priority: number;
    }>,
  ): Promise<{
    consensusRequired: boolean;
    decisionHierarchy: string[];
    conflictResolution: string;
  }>;

  // NOK notification system
  notifyNextOfKin(
    memberId: string,
    eventType: 'MEDICAL_EMERGENCY' | 'LEGAL_MATTER' | 'DEATH',
    message: string,
  ): Promise<
    Map<
      string,
      {
        notified: boolean;
        method: string;
        timestamp: Date;
        response?: string;
      }
    >
  >;

  // NOK decision-making authority
  determineDecisionAuthority(
    memberId: string,
    decisionType: string,
    nokList: string[],
  ): Promise<{
    primaryDecisionMaker: string;
    alternates: string[];
    consensusThreshold: number;
  }>;

  // NOK verification for institutions
  verifyNokForInstitution(
    memberId: string,
    institutionType: 'HOSPITAL' | 'BANK' | 'SCHOOL' | 'GOVERNMENT',
  ): Promise<{
    verified: boolean;
    verificationLevel: string;
    acceptedDocuments: string[];
  }>;

  // Cross-border NOK considerations
  handleInternationalNok(
    memberId: string,
    nokResidingIn: string,
  ): Promise<{
    jurisdictionIssues: string[];
    documentRequirements: string[];
    embassyInvolvement: boolean;
  }>;

  // NOK succession rights
  assessNokInheritanceRights(
    memberId: string,
    nokId: string,
  ): Promise<{
    hasRights: boolean;
    priority: number;
    sharePercentage?: number;
    conditions: string[];
  }>;
}
