// src/application/guardianship/commands/impl/record-conflict-of-interest.command.ts
import { ConflictType } from '../../../../domain/entities/guardian-assignment.entity';
import { BaseCommand } from '../../../common/base/base.command';
import { ICommand } from '../../../common/interfaces/use-case.interface';

export class RecordConflictOfInterestCommand extends BaseCommand implements ICommand {
  constructor(
    public readonly guardianshipId: string,
    public readonly guardianId: string,
    public readonly conflictType: ConflictType,
    public readonly description: string,
    public readonly severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    public readonly userId: string, // Who reported this?
  ) {
    super({ userId });

    if (!description || description.length < 10) {
      throw new Error('Description must be detailed (min 10 chars)');
    }
  }
}
