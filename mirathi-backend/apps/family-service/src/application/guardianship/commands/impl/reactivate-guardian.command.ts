// src/application/guardianship/commands/impl/reactivate-guardian.command.ts
import { BaseCommand } from '../../../common/base/base.command';
import { ICommand } from '../../../common/interfaces/use-case.interface';

export class ReactivateGuardianCommand extends BaseCommand implements ICommand {
  constructor(
    public readonly guardianshipId: string,
    public readonly guardianId: string,
    public readonly userId: string,
  ) {
    super({ userId });
  }
}
