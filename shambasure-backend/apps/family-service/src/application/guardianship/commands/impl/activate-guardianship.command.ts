// src/application/guardianship/commands/impl/activate-guardianship.command.ts
import { BaseCommand } from '../../../common/base/base.command';
import { ICommand } from '../../../common/interfaces/use-case.interface';

export class ActivateGuardianshipCommand extends BaseCommand implements ICommand {
  constructor(
    public readonly guardianshipId: string,
    public readonly userId: string,
  ) {
    super({ userId });

    if (!guardianshipId) {
      throw new Error('Guardianship ID is required for activation');
    }
  }
}
