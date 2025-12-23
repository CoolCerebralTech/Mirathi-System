// application/guardianship/commands/impl/grant-property-powers.command.ts
import { BaseCommand } from '../base.command';

export interface GrantPropertyPowersCommandPayload {
  guardianshipId: string;
  guardianId: string;
  courtOrderNumber?: string;
  restrictions?: string[];
}

export class GrantPropertyPowersCommand extends BaseCommand {
  public readonly guardianshipId: string;
  public readonly guardianId: string;
  public readonly courtOrderNumber?: string;
  public readonly restrictions?: string[];

  constructor(
    payload: GrantPropertyPowersCommandPayload,
    baseProps: { userId: string; correlationId?: string; causationId?: string },
  ) {
    super(baseProps);
    this.guardianshipId = payload.guardianshipId;
    this.guardianId = payload.guardianId;
    this.courtOrderNumber = payload.courtOrderNumber;
    this.restrictions = payload.restrictions;

    this.validate();
  }

  validate(): void {
    super.validate();

    if (!this.guardianshipId) throw new Error('Guardianship ID is required');
    if (!this.guardianId) throw new Error('Guardian ID is required');
  }
}
