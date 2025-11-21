import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

// Commands
import { CreateRelationshipCommand } from '../commands/create-relationship.command';
import { VerifyRelationshipCommand } from '../commands/verify-relationship.command';
import { RemoveRelationshipCommand } from '../commands/remove-relationship.command';

// Queries
import { GetRelationshipsQuery } from '../queries/get-relationships.query';
import { GetChildrenQuery } from '../queries/get-children.query';

// DTOs
import { CreateRelationshipDto } from '../dto/request/create-relationship.dto';
import { VerifyRelationshipDto } from '../dto/request/verify-relationship.dto';
import { RelationshipResponseDto } from '../dto/response/relationship.response.dto';

@Injectable()
export class RelationshipService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // --------------------------------------------------------------------------
  // WRITE OPERATIONS
  // --------------------------------------------------------------------------

  /**
   * Creates a lineage link (e.g. Parent -> Child).
   * Enforces biological consistency (no time travel) and graph integrity (no cycles).
   */
  async createRelationship(
    familyId: string,
    userId: string,
    dto: CreateRelationshipDto,
  ): Promise<string> {
    return this.commandBus.execute(new CreateRelationshipCommand(familyId, userId, dto));
  }

  /**
   * Verifies a relationship using legal documents (Birth Cert/Affidavit).
   * Typically called by an Admin or Verifier.
   */
  async verifyRelationship(
    relationshipId: string,
    verifierId: string,
    dto: VerifyRelationshipDto,
  ): Promise<void> {
    return this.commandBus.execute(new VerifyRelationshipCommand(relationshipId, verifierId, dto));
  }

  /**
   * Removes a lineage link.
   */
  async removeRelationship(
    familyId: string,
    userId: string,
    relationshipId: string,
  ): Promise<void> {
    return this.commandBus.execute(new RemoveRelationshipCommand(familyId, userId, relationshipId));
  }

  // --------------------------------------------------------------------------
  // READ OPERATIONS
  // --------------------------------------------------------------------------

  /**
   * Gets all lineage edges for the tree visualization.
   */
  async getRelationships(familyId: string, userId: string): Promise<RelationshipResponseDto[]> {
    return this.queryBus.execute(new GetRelationshipsQuery(familyId, userId));
  }

  /**
   * Specialized query: "Who are the children of X?"
   */
  async getChildren(parentId: string, userId: string): Promise<RelationshipResponseDto[]> {
    return this.queryBus.execute(new GetChildrenQuery(parentId, userId));
  }
}
