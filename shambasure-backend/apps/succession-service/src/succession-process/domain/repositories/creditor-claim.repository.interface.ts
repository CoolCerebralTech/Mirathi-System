import { CreditorClaim, ClaimStatus, DebtType } from '../entities/creditor-claim.entity';

export interface CreditorClaimRepositoryInterface {
  // Basic CRUD operations
  findById(id: string): Promise<CreditorClaim | null>;
  findAll(): Promise<CreditorClaim[]>;
  save(claim: CreditorClaim): Promise<CreditorClaim>;
  delete(id: string): Promise<void>;

  // Domain-specific queries
  findByEstateId(estateId: string): Promise<CreditorClaim[]>;
  findByStatus(status: ClaimStatus): Promise<CreditorClaim[]>;
  findByCreditorName(creditorName: string): Promise<CreditorClaim[]>;
  findByDebtType(debtType: DebtType): Promise<CreditorClaim[]>;

  // Financial queries
  findAcceptedClaims(estateId: string): Promise<CreditorClaim[]>;
  findPendingClaims(estateId: string): Promise<CreditorClaim[]>;
  findRejectedClaims(estateId: string): Promise<CreditorClaim[]>;
  findDisputedClaims(estateId: string): Promise<CreditorClaim[]>;

  // Amount-based queries
  findClaimsAboveAmount(amount: number): Promise<CreditorClaim[]>;
  findClaimsByPriority(estateId: string): Promise<CreditorClaim[]>;

  // Statistical queries
  getTotalClaimAmount(estateId: string): Promise<number>;
  getAcceptedClaimAmount(estateId: string): Promise<number>;
  getPendingClaimAmount(estateId: string): Promise<number>;

  // Complex queries
  findOverdueClaims(): Promise<CreditorClaim[]>;
  findClaimsRequiringPayment(): Promise<CreditorClaim[]>;
  findClaimsWithInterest(): Promise<CreditorClaim[]>;

  // Bulk operations
  saveAll(claims: CreditorClaim[]): Promise<CreditorClaim[]>;
  updateStatus(claimIds: string[], status: ClaimStatus): Promise<void>;

  // Validation queries
  existsByCreditorAndAmount(
    estateId: string,
    creditorName: string,
    amount: number,
  ): Promise<boolean>;
}
