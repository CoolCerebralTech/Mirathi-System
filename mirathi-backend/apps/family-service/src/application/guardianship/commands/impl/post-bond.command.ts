// src/application/guardianship/commands/impl/post-bond.command.ts
import { BaseCommand } from '../../../common/base/base.command';
import { ICommand } from '../../../common/interfaces/use-case.interface';

export interface BondDetailsDto {
  amount: number;
  suretyCompany: string; // Aligned with VO
  bondReference: string; // Aligned with VO
  courtOrderReference?: string;
  digitalVerificationUrl?: string; // Optional for digital integration
}

export class PostBondCommand extends BaseCommand implements ICommand {
  constructor(
    public readonly guardianshipId: string,
    public readonly guardianId: string,
    public readonly bondDetails: BondDetailsDto,
    public readonly userId: string,
  ) {
    super({ userId });

    if (bondDetails.amount <= 0) {
      throw new Error('Bond amount must be positive');
    }
    if (!bondDetails.suretyCompany) {
      throw new Error('Surety Company is required');
    }
  }
}
