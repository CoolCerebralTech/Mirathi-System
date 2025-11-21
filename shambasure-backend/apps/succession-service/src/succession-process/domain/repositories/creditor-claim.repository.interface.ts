// succession-service/src/succession-process/domain/repositories/creditor-claim.repository.interface.ts

import { CreditorClaim } from '@prisma/client'; // Assuming entity mapping matches
// Note: If we created a specific Domain Entity for this in Step 1, import that instead.
// Based on previous steps, we mapped Debt logic heavily in EstatePlanning. 
// This interface is for the formal "Claim" process in court.

export interface CreditorClaimRepositoryInterface {
  save(claim: CreditorClaim): Promise<void>; // Using Prisma Type or Domain Entity
  findById(id: string): Promise<CreditorClaim | null>;

  findByEstateId(estateId: string): Promise<CreditorClaim[]>;

  /**
   * Find claims that have been formally accepted by the Executor.
   */
  findAcceptedClaims(estateId: string): Promise<CreditorClaim[]>;

  /**
   * Find disputed claims (Executor rejected, Creditor suing).
   */
  findDisputedClaims(estateId: string): Promise<CreditorClaim[]>;
}
