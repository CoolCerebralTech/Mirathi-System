// domain/exceptions/beneficiary-eligibility.exception.ts
export class BeneficiaryEligibilityException extends Error {
  constructor(beneficiaryAssignmentId: string, reason: string) {
    super(`Beneficiary ${beneficiaryAssignmentId} is not eligible: ${reason}`);
    this.name = 'BeneficiaryEligibilityException';
  }
}
