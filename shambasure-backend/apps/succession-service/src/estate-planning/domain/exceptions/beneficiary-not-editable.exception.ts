// domain/exceptions/beneficiary-not-editable.exception.ts
export class BeneficiaryNotEditableException extends Error {
  constructor(beneficiaryAssignmentId: string) {
    super(`Beneficiary assignment ${beneficiaryAssignmentId} is not editable`);
    this.name = 'BeneficiaryNotEditableException';
  }
}
