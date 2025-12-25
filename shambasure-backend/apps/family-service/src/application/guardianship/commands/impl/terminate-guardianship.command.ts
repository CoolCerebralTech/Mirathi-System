// src/application/guardianship/commands/impl/terminate-guardianship.command.ts
import { BaseCommand } from '../../../common/base/base.command';
import { ICommand } from '../../../common/interfaces/use-case.interface';

export interface TerminateGuardianshipDto {
  guardianshipId: string;
  reason: string;
  terminationDate: Date;
}

export class TerminateGuardianshipCommand extends BaseCommand implements ICommand {
  public readonly payload: TerminateGuardianshipDto;

  constructor(props: TerminateGuardianshipDto & { userId: string }) {
    super({ userId: props.userId });
    this.payload = props;
    this.validatePayload();
  }

  private validatePayload(): void {
    if (!this.payload.guardianshipId) {
      throw new Error('Guardianship ID is required');
    }
    if (!this.payload.reason || this.payload.reason.length < 10) {
      throw new Error('A detailed reason (min 10 chars) is required for termination');
    }
    if (!this.payload.terminationDate) {
      throw new Error('Termination date is required');
    }

    // Logic: Termination date can be slightly in the future (e.g., "Effective next month")
    // or past (e.g., "Ward turned 18 yesterday"), but let's prevent distant future.
    const maxFutureDate = new Date();
    maxFutureDate.setMonth(maxFutureDate.getMonth() + 3);

    if (this.payload.terminationDate > maxFutureDate) {
      throw new Error('Termination date cannot be more than 3 months in the future');
    }
  }
}
