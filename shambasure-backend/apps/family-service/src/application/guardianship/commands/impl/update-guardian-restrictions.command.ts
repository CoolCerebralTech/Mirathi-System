// application/guardianship/commands/impl/update-guardian-restrictions.command.ts
import { BaseCommand } from '../base.command';

export class UpdateGuardianRestrictionsCommand extends BaseCommand {
  constructor(
    public readonly guardianshipId: string,
    public readonly guardianId: string,
    public readonly restrictions: string[],
    baseProps: { userId: string; correlationId?: string; causationId?: string },
  ) {
    super(baseProps);
    this.validate();
  }

  validate(): void {
    super.validate();

    if (!this.guardianshipId) {
      throw new Error('Guardianship ID is required');
    }

    if (!this.guardianId) {
      throw new Error('Guardian ID is required');
    }

    if (!Array.isArray(this.restrictions)) {
      throw new Error('Restrictions must be an array');
    }
  }
}
