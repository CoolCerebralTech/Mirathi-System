/**
 * Data Transfer Object for Adding a Codicil (Amendment).
 *
 * LEGAL CONTEXT (S.11 LSA):
 * - A Codicil is a supplement to a Will.
 * - Must be executed with the same formalities as the Will (Signature + 2 Witnesses).
 * - Used to revoke, explain, add to, or alter the original Will.
 */
export interface AddCodicilDto {
  /**
   * Title of the amendment (e.g., "First Codicil regarding Holiday Home").
   */
  title: string;

  /**
   * The actual text of the amendment.
   */
  content: string;

  /**
   * Date the codicil was written/signed.
   */
  date: Date;

  /**
   * Type of amendment.
   */
  amendmentType: 'ADDITION' | 'MODIFICATION' | 'REVOCATION';

  /**
   * References to specific clause IDs in the original Will that are being changed.
   * Required for MODIFICATION and REVOCATION.
   */
  affectedClauses?: string[];

  /**
   * Legal justification (optional).
   */
  legalBasis?: string;

  /**
   * Execution details (S.11 Compliance).
   */
  executionDetails: {
    date: Date;
    location: string;
    timezone?: string;
    witnessesPresent: number;
  };

  /**
   * List of witness IDs or Names who signed this Codicil.
   * Minimum 2 required by Entity validation.
   */
  witnessIds: string[];
}
