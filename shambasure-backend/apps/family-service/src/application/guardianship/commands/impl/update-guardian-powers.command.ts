// src/application/guardianship/commands/impl/update-guardian-powers.command.ts
import { GuardianshipPowersProps } from '../../../../domain/value-objects/guardianship-powers.vo';
import { BaseCommand } from '../../../common/base/base.command';
import { ICommand } from '../../../common/interfaces/use-case.interface';

export class UpdateGuardianPowersCommand extends BaseCommand implements ICommand {
  constructor(
    public readonly guardianshipId: string,
    public readonly guardianId: string,
    public readonly newPowers: GuardianshipPowersProps, // Using the VO Props DTO
    public readonly userId: string,
    public readonly reason: string, // Audit trail
  ) {
    super({ userId });

    if (!guardianshipId || !guardianId) throw new Error('IDs required');
  }
}
