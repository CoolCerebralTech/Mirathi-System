// src/application/guardianship/commands/impl/resolve-conflict-of-interest.command.ts
import { BaseCommand } from '../../../common/base/base.command';
import { ICommand } from '../../../common/interfaces/use-case.interface';

export class ResolveConflictOfInterestCommand extends BaseCommand implements ICommand {
  constructor(
    public readonly guardianshipId: string,
    public readonly guardianId: string,
    public readonly conflictIndex: number, // The index in the conflict array
    public readonly resolution: string, // How was it resolved?
    public readonly userId: string,
    public readonly mitigationPlan?: string, // Ongoing steps to prevent recurrence
  ) {
    super({ userId });

    if (!resolution || resolution.length < 5) {
      throw new Error('Resolution details are required');
    }
  }
}
