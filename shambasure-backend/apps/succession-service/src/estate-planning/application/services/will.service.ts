import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { WillStatus } from '@prisma/client';

// Commands
import { CreateWillCommand } from '../commands/create-will.command';
import { UpdateWillCommand } from '../commands/update-will.command';
import { ActivateWillCommand } from '../commands/activate-will.command';
import { RevokeWillCommand } from '../commands/revoke-will.command';
import { SignWillCommand } from '../commands/sign-will.command';

// Queries
import { GetWillQuery } from '../queries/get-will.query';
import { ListWillsQuery } from '../queries/list-wills.query';
import {
  GetWillCompletenessQuery,
  WillCompletenessResponse,
} from '../queries/get-will-completeness.query';
import { GetWillVersionsQuery, WillVersionSummary } from '../queries/get-will-versions.query';

// DTOs
import { CreateWillDto } from '../dto/request/create-will.dto';
import { UpdateWillDto } from '../dto/request/update-will.dto';
import { RevokeWillDto } from '../dto/request/revoke-will.dto';
import { SignWillDto } from '../dto/request/sign-will.dto';
import { WillResponseDto } from '../dto/response/will.response.dto';

@Injectable()
export class WillService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // --------------------------------------------------------------------------
  // WRITE OPERATIONS (Commands)
  // --------------------------------------------------------------------------

  /**
   * Starts the drafting process.
   * Enforces Section 7 (Testamentary Capacity) checks immediately.
   * @returns The ID of the newly created Will draft.
   */
  async createWill(userId: string, dto: CreateWillDto): Promise<string> {
    return this.commandBus.execute(new CreateWillCommand(userId, dto));
  }

  /**
   * Updates the content of the Will (Assets, Clauses, Wishes).
   * Only allowed if Will is in DRAFT state.
   */
  async updateWill(willId: string, userId: string, dto: UpdateWillDto): Promise<void> {
    return this.commandBus.execute(new UpdateWillCommand(willId, userId, dto));
  }

  /**
   * Records a digital signature (Testator or Witness).
   * This is the legal act of execution under Section 11.
   */
  async signWill(userId: string, dto: SignWillDto): Promise<void> {
    return this.commandBus.execute(new SignWillCommand(userId, dto));
  }

  /**
   * Transitions the Will from DRAFT/WITNESSED to ACTIVE.
   * Runs a comprehensive legal audit (Validation Service) before succeeding.
   */
  async activateWill(willId: string, userId: string): Promise<void> {
    return this.commandBus.execute(new ActivateWillCommand(willId, userId));
  }

  /**
   * Legally invalidates a Will under Section 16.
   * Requires a specific reason and method (e.g., "New Will Created").
   */
  async revokeWill(willId: string, userId: string, dto: RevokeWillDto): Promise<void> {
    return this.commandBus.execute(new RevokeWillCommand(willId, userId, dto));
  }

  // --------------------------------------------------------------------------
  // READ OPERATIONS (Queries)
  // --------------------------------------------------------------------------

  /**
   * Retrieves the full Will document including all relationships.
   */
  async getWill(willId: string, userId: string): Promise<WillResponseDto> {
    return this.queryBus.execute(new GetWillQuery(willId, userId));
  }

  /**
   * Lists all wills for a user.
   * Optional filter for status (e.g., show only ACTIVE wills).
   */
  async listWills(userId: string, status?: WillStatus): Promise<WillResponseDto[]> {
    return this.queryBus.execute(new ListWillsQuery(userId, status));
  }

  /**
   * Runs the validation logic in "Dry Run" mode.
   * Used by the frontend to show a checklist (e.g., "You need 1 more witness").
   */
  async checkCompleteness(willId: string, userId: string): Promise<WillCompletenessResponse> {
    return this.queryBus.execute(new GetWillCompletenessQuery(willId, userId));
  }

  /**
   * Retrieves the audit trail of previous versions.
   * Critical for resolving disputes about *when* changes were made.
   */
  async getVersions(willId: string, userId: string): Promise<WillVersionSummary[]> {
    return this.queryBus.execute(new GetWillVersionsQuery(willId, userId));
  }
}
