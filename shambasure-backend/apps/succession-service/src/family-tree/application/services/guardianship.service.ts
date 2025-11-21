import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

// Commands
import { AssignGuardianCommand } from '../commands/assign-guardian.command';
import { RemoveGuardianCommand } from '../commands/remove-guardian.command';

// Queries
import { GetGuardianshipsQuery } from '../queries/get-guardianships.query';

// DTOs
import { AssignGuardianDto } from '../dto/request/assign-guardian.dto';
import { GuardianshipResponseDto } from '../dto/response/guardianship.response.dto';

@Injectable()
export class GuardianshipService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // --------------------------------------------------------------------------
  // WRITE OPERATIONS
  // --------------------------------------------------------------------------

  /**
   * Assigns a legal guardian to a minor.
   * Validates age requirements and calculates expiry (Age 18).
   */
  async assignGuardian(familyId: string, userId: string, dto: AssignGuardianDto): Promise<string> {
    return this.commandBus.execute(new AssignGuardianCommand(familyId, userId, dto));
  }

  /**
   * Revokes a guardianship (e.g., Guardian resignation or Court Order).
   */
  async removeGuardian(
    familyId: string,
    userId: string,
    guardianshipId: string,
    reason: string,
  ): Promise<void> {
    return this.commandBus.execute(
      new RemoveGuardianCommand(familyId, userId, guardianshipId, reason),
    );
  }

  // --------------------------------------------------------------------------
  // READ OPERATIONS
  // --------------------------------------------------------------------------

  /**
   * Lists all active guardianships in the family.
   * Used for the "Minor Protection" dashboard widget.
   */
  async getGuardianships(familyId: string, userId: string): Promise<GuardianshipResponseDto[]> {
    return this.queryBus.execute(new GetGuardianshipsQuery(familyId, userId));
  }
}
