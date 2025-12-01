// domain/exceptions/court-approval-not-required.exception.ts
export class CourtApprovalNotRequiredException extends Error {
  constructor(beneficiaryAssignmentId: string) {
    super(`Beneficiary assignment ${beneficiaryAssignmentId} does not require court approval`);
    this.name = 'CourtApprovalNotRequiredException';
  }
}
