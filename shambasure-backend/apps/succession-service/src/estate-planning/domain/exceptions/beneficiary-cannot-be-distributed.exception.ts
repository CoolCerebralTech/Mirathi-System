// domain/exceptions/beneficiary-cannot-be-distributed.exception.ts
export class BeneficiaryCannotBeDistributedException extends Error {
  constructor(beneficiaryAssignmentId: string) {
    super(`Beneficiary assignment ${beneficiaryAssignmentId} cannot be distributed`);
    this.name = 'BeneficiaryCannotBeDistributedException';
  }
}
