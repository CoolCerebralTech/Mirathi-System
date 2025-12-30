/**
 * Data Transfer Object for Revoking a Will.
 *
 * LEGAL CONTEXT (S.18, S.19 LSA):
 * A will can be revoked by:
 * 1. Marriage (automatically, with exceptions).
 * 2. Another Will or Codicil.
 * 3. Burning, tearing, or destroying (Physical destruction).
 */
export interface RevokeWillDto {
  /**
   * The legal method used for revocation.
   * Must match the Domain Enum.
   */
  method:
    | 'NEW_WILL'
    | 'CODICIL'
    | 'DESTRUCTION' // Physical act (burning/tearing)
    | 'COURT_ORDER'
    | 'MARRIAGE' // S.19 LSA: Marriage revokes previous wills
    | 'DIVORCE'
    | 'OTHER';

  /**
   * Detailed explanation or reference (e.g., Court Case Number).
   */
  reason?: string;
}
