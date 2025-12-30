import { CapacityStatus } from '../../../../domain/value-objects/testator-capacity-declaration.vo';

/**
 * Data Transfer Object for Updating Testator Capacity.
 *
 * LEGAL CONTEXT (S.5 LSA):
 * - To make a valid will, one must be of "Sound Mind".
 * - Burden of proof lies with the propounder of the will.
 * - This record serves as contemporaneous evidence of capacity.
 */
export interface UpdateCapacityDeclarationDto {
  /**
   * The status of the capacity assessment.
   * e.g., 'SELF_DECLARATION' (Standard) or 'MEDICAL_CERTIFICATION' (High assurance).
   */
  status: CapacityStatus;

  /**
   * Date the assessment or declaration was made.
   */
  date: Date;

  /**
   * Who made the assessment? (Required if status is ASSESSED_*)
   * e.g., "Dr. John Doe, Psychiatrist"
   */
  assessedBy?: string;

  /**
   * Clinical notes or personal statement.
   */
  notes?: string;

  /**
   * IDs of uploaded documents (e.g., Medical Report PDF, Video Affidavit).
   */
  documentIds: string[];

  /**
   * Confirmation of freedom from coercion.
   */
  declarations: {
    isVoluntarilyMade: boolean;
    isFreeFromUndueInfluence: boolean;
  };
}
