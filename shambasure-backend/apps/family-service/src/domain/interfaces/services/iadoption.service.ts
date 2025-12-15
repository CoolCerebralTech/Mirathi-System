import { FamilyMember } from '../../entities/family-member.entity';

export interface IAdoptionService {
  // Adoption validation (Children Act)
  validateAdoptionEligibility(
    adopter: FamilyMember,
    adoptee: FamilyMember,
    adoptionType: 'STATUTORY' | 'CUSTOMARY' | 'INTER_COUNTRY',
  ): Promise<{
    eligible: boolean;
    requirements: string[];
    ageGapOk: boolean;
    homeStudyRequired: boolean;
  }>;

  // Consent management
  validateConsents(
    adoptionType: string,
    parties: {
      biologicalParents: string[];
      adopteeAge: number;
      adopterSpouse?: string;
    },
  ): Promise<{
    consentsRequired: string[];
    consentsObtained: string[];
    missingConsents: string[];
    waiverPossible: boolean;
  }>;

  // Customary adoption validation
  validateCustomaryAdoption(
    ethnicGroup: string,
    adoptionDetails: {
      ceremonyPerformed: boolean;
      elderInvolvement: string[];
      communityRecognition: boolean;
    },
  ): Promise<{
    valid: boolean;
    recognitionLevel: 'FULL' | 'PARTIAL' | 'NONE';
    documentationNeeded: string[];
  }>;

  // Court process guidance
  getCourtProcess(
    adoptionType: string,
    county: string,
  ): Promise<{
    steps: string[];
    forms: string[];
    timelines: Map<string, string>;
    fees: number[];
  }>;

  // Post-adoption monitoring
  schedulePostAdoptionMonitoring(
    adoptionDate: Date,
    adoptionType: string,
  ): Promise<{
    monitoringSchedule: Array<{
      month: number;
      type: 'HOME_VISIT' | 'REPORT' | 'COURT_REVIEW';
    }>;
    finalizationDate?: Date;
  }>;

  // Inheritance rights establishment
  establishInheritanceRights(
    adopteeId: string,
    adoptiveFamilyId: string,
    biologicalFamilyId?: string,
  ): Promise<{
    rightsInAdoptiveFamily: 'FULL' | 'PARTIAL' | 'NONE';
    rightsInBiologicalFamily: 'FULL' | 'PARTIAL' | 'NONE';
    legalBasis: string;
  }>;

  // Adoption revocation/annulment
  processAdoptionRevocation(
    adoptionId: string,
    reason: string,
    initiatedBy: string,
  ): Promise<{
    process: string[];
    legalConsequences: string[];
    childWelfareConsiderations: string[];
  }>;
}
