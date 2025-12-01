// domain/exceptions/beneficiary-assignment-not-found.exception.ts
export class BeneficiaryAssignmentNotFoundException extends Error {
  constructor(beneficiaryAssignmentId: string) {
    super(`Beneficiary assignment with ID ${beneficiaryAssignmentId} not found`);
    this.name = 'BeneficiaryAssignmentNotFoundException';
  }
}
