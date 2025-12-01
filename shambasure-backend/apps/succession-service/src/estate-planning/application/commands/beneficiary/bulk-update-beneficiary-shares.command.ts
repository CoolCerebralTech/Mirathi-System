// commands/beneficiary/bulk-update-beneficiary-shares.command.ts
import { ICommand } from '@nestjs/cqrs';

export interface BulkBeneficiaryShareUpdate {
  beneficiaryAssignmentId: string;
  sharePercent?: number;
  specificAmount?: number;
}

export class BulkUpdateBeneficiarySharesCommand implements ICommand {
  constructor(
    public readonly willId: string,
    public readonly updates: BulkBeneficiaryShareUpdate[],
    public readonly correlationId?: string,
  ) {}
}
