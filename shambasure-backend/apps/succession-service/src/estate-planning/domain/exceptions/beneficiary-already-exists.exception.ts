// domain/exceptions/beneficiary-already-exists.exception.ts
export class BeneficiaryAlreadyExistsException extends Error {
  constructor(beneficiaryAssignmentId: string) {
    super(`Beneficiary assignment with ID ${beneficiaryAssignmentId} already exists`);
    this.name = 'BeneficiaryAlreadyExistsException';
  }
}
