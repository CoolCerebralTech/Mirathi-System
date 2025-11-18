// estate-planning/application/commands/update-beneficiary.command.ts
import { BequestConditionType } from '@prisma/client';

export class UpdateBeneficiaryCommand {
  constructor(
    public readonly willId: string,
    public readonly testatorId: string,
    public readonly beneficiaryId: string,
    public readonly updates: {
      sharePercentage?: number;
      specificAmount?: number;
      conditionType?: BequestConditionType;
      conditionDetails?: string;
      priority?: number;
    },
  ) {}
}
