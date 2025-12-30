import { SignatureType } from '../../../../domain/entities/will-witness.entity';

/**
 * Data Transfer Object for recording a witness signature.
 *
 * USE CASE:
 * Used when a witness who was previously added (Status: PENDING)
 * digitally signs the document or acknowledges their physical signature.
 */
export interface RecordWitnessSignatureDto {
  /**
   * The ID of the specific witness entity to update.
   */
  witnessId: string;

  /**
   * How they signed (e.g., DIGITAL_SIGNATURE, WET_SIGNATURE).
   */
  signatureType: SignatureType;

  /**
   * Where they were when they signed (for jurisdiction/audit).
   */
  location?: string;

  /**
   * Optional notes (e.g., "Signed via iPad at Lawyer's office").
   */
  notes?: string;
}
