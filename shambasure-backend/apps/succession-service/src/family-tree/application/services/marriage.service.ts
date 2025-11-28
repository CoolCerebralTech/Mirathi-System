import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

// Commands
import { CreateMarriageCommand } from '../commands/create-marriage.command';
import { DissolveMarriageCommand } from '../commands/dissolve-marriage.command';
import { UpdateMarriageCommand } from '../commands/update-marriage.command';
// DTOs
import { CreateMarriageDto } from '../dto/request/create-marriage.dto';
import { DissolveMarriageDto } from '../dto/request/dissolve-marriage.dto';
import { UpdateMarriageDto } from '../dto/request/update-marriage.dto';
import { MarriageResponseDto } from '../dto/response/marriage.response.dto';
// Queries
import { GetMarriagesQuery } from '../queries/get-marriages.query';
import { GetMemberMarriagesQuery } from '../queries/get-member-marriages.query';

@Injectable()
export class MarriageService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // --------------------------------------------------------------------------
  // WRITE OPERATIONS
  // --------------------------------------------------------------------------

  /**
   * Registers a new marriage between two family members.
   * Enforces Polygamy/Monogamy rules based on Kenyan Marriage Act 2014.
   */
  async registerMarriage(
    familyId: string,
    userId: string,
    dto: CreateMarriageDto,
  ): Promise<string> {
    return this.commandBus.execute(new CreateMarriageCommand(familyId, userId, dto));
  }

  /**
   * Legally dissolves a marriage (Divorce/Annulment).
   * Requires a Decree Absolute or Court Order reference.
   */
  async dissolveMarriage(
    familyId: string,
    userId: string,
    marriageId: string,
    dto: DissolveMarriageDto,
  ): Promise<void> {
    return this.commandBus.execute(new DissolveMarriageCommand(familyId, userId, marriageId, dto));
  }

  /**
   * Updates marriage details (e.g., adding a certificate number later).
   */
  async updateMarriage(
    familyId: string,
    userId: string,
    marriageId: string,
    dto: UpdateMarriageDto,
  ): Promise<void> {
    return this.commandBus.execute(new UpdateMarriageCommand(familyId, userId, marriageId, dto));
  }

  // --------------------------------------------------------------------------
  // READ OPERATIONS
  // --------------------------------------------------------------------------

  /**
   * Gets all marriages in the family tree.
   * Used for visualizing the "Dashed Lines" in the HeirLink™ graph.
   */
  async getMarriages(familyId: string, userId: string): Promise<MarriageResponseDto[]> {
    return this.queryBus.execute(new GetMarriagesQuery(familyId, userId));
  }

  /**
   * Gets the marital history of a specific person.
   * Includes Active and Dissolved unions.
   */
  async getMemberMarriages(memberId: string, userId: string): Promise<MarriageResponseDto[]> {
    return this.queryBus.execute(new GetMemberMarriagesQuery(memberId, userId));
  }
}
