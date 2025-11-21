import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

// Commands
import { CreateFamilyCommand } from '../commands/create-family.command';
import { UpdateFamilyCommand } from '../commands/update-family.command';
import { RefreshTreeVisualizationCommand } from '../commands/refresh-tree-visualization.command';

// Queries
import { GetFamilyQuery } from '../queries/get-family.query';
import { ListFamiliesQuery } from '../queries/list-families.query';
import { GetFamilyTreeQuery } from '../queries/get-family-tree.query';

// DTOs
import { CreateFamilyDto } from '../dto/request/create-family.dto';
import { UpdateFamilyDto } from '../dto/request/update-family.dto';
import { FamilyResponseDto } from '../dto/response/family.response.dto';
import { FamilyTreeResponseDto } from '../dto/response/family-tree.response.dto';

@Injectable()
export class FamilyService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // --------------------------------------------------------------------------
  // WRITE OPERATIONS
  // --------------------------------------------------------------------------

  /**
   * Initializes a new Family Tree.
   * Also creates the "Root Node" representing the User.
   */
  async createFamily(
    userId: string,
    userDetails: { firstName: string; lastName: string; email: string },
    dto: CreateFamilyDto,
  ): Promise<string> {
    return this.commandBus.execute(new CreateFamilyCommand(userId, userDetails, dto));
  }

  /**
   * Updates metadata (Name, Description).
   */
  async updateFamily(familyId: string, userId: string, dto: UpdateFamilyDto): Promise<void> {
    return this.commandBus.execute(new UpdateFamilyCommand(familyId, userId, dto));
  }

  /**
   * Forces a re-calculation of the visualization graph cache.
   * Useful after bulk updates or if the UI reports sync issues.
   */
  async refreshTreeCache(familyId: string): Promise<void> {
    return this.commandBus.execute(new RefreshTreeVisualizationCommand(familyId));
  }

  // --------------------------------------------------------------------------
  // READ OPERATIONS
  // --------------------------------------------------------------------------

  /**
   * Gets the primary family tree details for the user.
   */
  async getFamily(userId: string): Promise<FamilyResponseDto> {
    return this.queryBus.execute(new GetFamilyQuery(userId));
  }

  /**
   * Lists all trees owned by the user (usually just one).
   */
  async listFamilies(userId: string): Promise<FamilyResponseDto[]> {
    return this.queryBus.execute(new ListFamiliesQuery(userId));
  }

  /**
   * Returns the complex Nodes & Edges JSON for the frontend graph library.
   * Uses a read-through cache strategy.
   */
  async getFamilyTreeGraph(familyId: string, userId: string): Promise<FamilyTreeResponseDto> {
    return this.queryBus.execute(new GetFamilyTreeQuery(familyId, userId));
  }
}
