// src/application/guardianship/commands/impl/suspend-guardian.command.ts
import { BaseCommand } from '../../../common/base/base.command';
import { ICommand } from '../../../common/interfaces/use-case.interface';

export class SuspendGuardianCommand extends BaseCommand implements ICommand {
  constructor(
    public readonly guardianshipId: string,
    public readonly guardianId: string, // The Member ID
    public readonly reason: string,
    public readonly userId: string,
  ) {
    super({ userId });

    if (!reason || reason.length < 10) {
      throw new Error('A detailed reason (min 10 chars) is required for suspension');
    }
  }
}
