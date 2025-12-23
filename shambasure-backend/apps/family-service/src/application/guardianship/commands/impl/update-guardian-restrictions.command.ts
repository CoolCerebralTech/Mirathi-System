// application/guardianship/commands/impl/update-guardian-restrictions.command.ts
import { BaseCommand } from '../base.command';

export interface UpdateGuardianRestrictionsCommandPayload {
  guardianshipId: string;
  guardianId: string;
  restrictions: string[];
}

export class UpdateGuardianRestrictionsCommand extends BaseCommand {
  public readonly guardianshipId: string;
  public readonly guardianId: string;
  public readonly restrictions: string[];

  constructor(
    payload: UpdateGuardianRestrictionsCommandPayload,
    baseProps: { userId: string; correlationId?: string; causationId?: string },
  ) {
    super(baseProps);
    this.guardianshipId = payload.guardianshipId;
    this.guardianId = payload.guardianId;
    this.restrictions = payload.restrictions;

    this.validate();
  }

  validate(): void {
    super.validate();
    if (!this.guardianshipId) throw new Error('Guardianship ID is required');
    if (!this.guardianId) throw new Error('Guardian ID is required');
    if (!Array.isArray(this.restrictions)) throw new Error('Restrictions must be an array');
  }
}
