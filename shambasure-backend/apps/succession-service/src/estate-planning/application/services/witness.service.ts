import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

// Commands
import { AddWitnessCommand } from '../commands/add-witness.command';
import { InviteWitnessCommand } from '../commands/invite-witness.command';
import { RemoveWitnessCommand } from '../commands/remove-witness.command';
// DTOs
import { AddWitnessDto } from '../dto/requests/add-witness.dto';
import { WitnessResponseDto } from '../dto/responses/witness.response.dto';
import { GetWitnessQuery } from '../queries/get-witness.query';
// Queries
import { GetWitnessesQuery } from '../queries/get-witnesses.query';

@Injectable()
export class WitnessService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // --------------------------------------------------------------------------
  // WRITE OPERATIONS (Commands)
  // --------------------------------------------------------------------------

  /**
   * Nominates a witness for a Will.
   * Enforces Section 13 (Conflict of Interest) checks against beneficiaries.
   * @returns The ID of the newly created witness record.
   */
  async addWitness(willId: string, userId: string, dto: AddWitnessDto): Promise<string> {
    return this.commandBus.execute(new AddWitnessCommand(willId, userId, dto));
  }

  /**
   * Removes a witness nomination.
   * Allowed only if the witness hasn't yet signed.
   */
  async removeWitness(willId: string, userId: string, witnessId: string): Promise<void> {
    return this.commandBus.execute(new RemoveWitnessCommand(willId, userId, witnessId));
  }

  /**
   * Triggers an invitation (SMS/Email) to the witness.
   * Allows the Testator to resend invites if the witness didn't receive them.
   */
  async inviteWitness(willId: string, userId: string, witnessId: string): Promise<void> {
    return this.commandBus.execute(new InviteWitnessCommand(willId, userId, witnessId));
  }

  // --------------------------------------------------------------------------
  // READ OPERATIONS (Queries)
  // --------------------------------------------------------------------------

  /**
   * Retrieves all witnesses nominated for a specific Will.
   * Security: Restricted to the Testator.
   */
  async getWitnesses(willId: string, userId: string): Promise<WitnessResponseDto[]> {
    return this.queryBus.execute(new GetWitnessesQuery(willId, userId));
  }

  /**
   * Retrieves specific details of a witness (e.g. to check signing status).
   */
  async getWitness(willId: string, witnessId: string, userId: string): Promise<WitnessResponseDto> {
    return this.queryBus.execute(new GetWitnessQuery(willId, witnessId, userId));
  }
}
