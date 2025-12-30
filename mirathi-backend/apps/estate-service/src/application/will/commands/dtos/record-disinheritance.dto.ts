import {
  DisinheritanceEvidenceType,
  DisinheritanceReasonCategory,
} from '../../../../domain/entities/disinheritance-record.entity';

/**
 * Data Transfer Object for Recording a Disinheritance.
 *
 * LEGAL CONTEXT (S.26 LSA):
 * Used to explicitly exclude a potential beneficiary (usually a dependant).
 * Captures the "Reasoning" and "Evidence" required to defend against
 * a "Reasonable Provision" claim in court.
 */
export interface RecordDisinheritanceDto {
  // --- WHO (The Person being excluded) ---
  disinheritedPerson: {
    type: 'USER' | 'FAMILY_MEMBER' | 'EXTERNAL';
    userId?: string;
    familyMemberId?: string;
    externalDetails?: {
      name: string;
      nationalId?: string;
      kraPin?: string;
      relationship?: string; // Critical for S.26 assessment (e.g. "Spouse")
    };
  };

  // --- WHY ( The Legal Justification) ---
  reasonCategory: DisinheritanceReasonCategory;
  reasonDescription: string;

  /**
   * Optional legal basis text.
   * e.g., "Excluded under S.26 because provided for via Trust X"
   */
  legalBasis?: string;

  // --- EVIDENCE (Defense Material) ---
  evidence: {
    type: DisinheritanceEvidenceType;
    description: string;
    documentId?: string; // ID of uploaded Affidavit/Police Abstract etc.
  }[];

  // --- SCOPE ---
  isCompleteDisinheritance: boolean; // True = 100% cut off. False = Partial.
  appliesToBequests?: string[]; // IDs of specific bequests they are barred from

  // --- RISK MANAGEMENT ---
  /**
   * Steps taken to mitigate legal challenge risk.
   * e.g., "Left a token gift", "No-contest clause included".
   */
  riskMitigationSteps?: string[];
}
