// application/guardianship/commands/impl/update-ward-info.command.ts
import { WardInfo } from '../../../../domain/aggregates/guardianship.aggregate';
import { BaseCommand } from '../base.command';

export class UpdateWardInfoCommand extends BaseCommand {
  constructor(
    public readonly guardianshipId: string,
    public readonly wardInfo: Partial<WardInfo>,
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

    if (!this.wardInfo || Object.keys(this.wardInfo).length === 0) {
      throw new Error('Ward information update is required');
    }
  }
}
