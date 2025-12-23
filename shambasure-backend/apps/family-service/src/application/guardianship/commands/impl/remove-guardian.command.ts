// application/guardianship/commands/impl/remove-guardian.command.ts
import { TerminationReason } from '../../../../domain/entities/guardian.entity';
import { BaseCommand } from '../base.command';

export interface RemoveGuardianCommandPayload {
  guardianshipId: string;
  guardianId: string;
  reason: TerminationReason;
  terminationDate: Date;
}

export class RemoveGuardianCommand extends BaseCommand {
  public readonly guardianshipId: string;
  public readonly guardianId: string;
  public readonly reason: TerminationReason;
  public readonly terminationDate: Date;

  constructor(
    payload: RemoveGuardianCommandPayload,
    baseProps: { userId: string; correlationId?: string; causationId?: string },
  ) {
    super(baseProps);
    this.guardianshipId = payload.guardianshipId;
    this.guardianId = payload.guardianId;
    this.reason = payload.reason;
    this.terminationDate = payload.terminationDate;

    this.validate();
  }

  validate(): void {
    super.validate();
    if (!this.guardianshipId) throw new Error('Guardianship ID is required');
    if (!this.guardianId) throw new Error('Guardian ID is required');
    if (!this.reason) throw new Error('Termination reason is required');
    if (!this.terminationDate) throw new Error('Termination date is required');
  }
}
