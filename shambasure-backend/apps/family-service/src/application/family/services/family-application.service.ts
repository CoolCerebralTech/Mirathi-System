import { Injectable, Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { Result } from '../../common/base/result';
import { PaginatedResponse } from '../../common/dto/paginated-response.dto';
// Commands
import { AddFamilyMemberCommand } from '../commands/impl/add-family-member.command';
import { AddPolygamousHouseCommand } from '../commands/impl/add-polygamous-house.command';
import { ArchiveFamilyCommand } from '../commands/impl/archive-family.command';
import { CreateFamilyCommand } from '../commands/impl/create-family.command';
import { MarkMemberDeceasedCommand } from '../commands/impl/mark-member-deceased.command';
import { RegisterMarriageCommand } from '../commands/impl/register-marriage.command';
import { RemoveFamilyMemberCommand } from '../commands/impl/remove-family-member.command';
import { UpdateFamilyMemberCommand } from '../commands/impl/update-family-member.command';
import { UpdateFamilyCommand } from '../commands/impl/update-family.command';
// Request DTOs
import { AddFamilyMemberRequest } from '../dto/request/add-family-member.request';
import { AddPolygamousHouseRequest } from '../dto/request/add-polygamous-house.request';
import { ArchiveFamilyRequest } from '../dto/request/archive-family.request';
import { CreateFamilyRequest } from '../dto/request/create-family.request';
import { RecordDeathRequest } from '../dto/request/record-death.request';
import { RegisterMarriageRequest } from '../dto/request/register-marriage.request';
import { UpdateFamilyMemberRequest } from '../dto/request/update-family-member.request';
import { UpdateFamilyRequest } from '../dto/request/update-family.request';
// Response DTOs
import { FamilyCountsResponse } from '../dto/response/family-counts.response';
import { FamilyMemberResponse } from '../dto/response/family-member.response';
import { FamilySearchResponse } from '../dto/response/family-search.response';
import { FamilyTreeResponse } from '../dto/response/family-tree.response';
import { FamilyResponse } from '../dto/response/family.response';
import { KenyanLegalComplianceResponse } from '../dto/response/kenyan-legal-compliance.response';
import { MarriageResponse } from '../dto/response/marriage.response';
import { PolygamousHouseResponse } from '../dto/response/polygamous-house.response';
// Inbound Port
import { IFamilyUseCase } from '../ports/inbound/family.use.case';
// Queries
import { CheckS40ComplianceQuery } from '../queries/impl/check-s40-compliance.query';
import { GetFamilyByIdQuery } from '../queries/impl/get-family-by-id.query';
import { GetFamilyCountsQuery } from '../queries/impl/get-family-counts.query';
import { GetFamilyMembersQuery } from '../queries/impl/get-family-members.query';
import { GetFamilyTreeQuery } from '../queries/impl/get-family-tree.query';
import { SearchFamiliesQuery } from '../queries/impl/search-families.query';

@Injectable()
export class FamilyApplicationService implements IFamilyUseCase {
  private readonly logger = new Logger(FamilyApplicationService.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // ===========================================================================
  // FAMILY MANAGEMENT (CORE)
  // ===========================================================================

  async createFamily(request: CreateFamilyRequest): Promise<Result<FamilyResponse>> {
    this.logger.log(`Creating family: ${request.name}`);
    return this.commandBus.execute(CreateFamilyCommand.create(request.creatorId, request));
  }

  async updateFamily(
    familyId: string,
    request: UpdateFamilyRequest,
    userId: string,
  ): Promise<Result<FamilyResponse>> {
    this.logger.log(`Updating family: ${familyId}`);
    return this.commandBus.execute(UpdateFamilyCommand.create(userId, familyId, request));
  }

  async archiveFamily(familyId: string, request: ArchiveFamilyRequest): Promise<Result<void>> {
    this.logger.log(`Archiving family: ${familyId}`);
    return this.commandBus.execute(
      ArchiveFamilyCommand.create(request.archivedByUserId, familyId, request.reason),
    );
  }

  // ===========================================================================
  // MEMBER MANAGEMENT
  // ===========================================================================

  async addFamilyMember(request: AddFamilyMemberRequest): Promise<Result<FamilyMemberResponse>> {
    this.logger.log(`Adding member to family: ${request.familyId}`);
    return this.commandBus.execute(
      AddFamilyMemberCommand.create(request.addedByUserId, request.familyId, request),
    );
  }

  async updateFamilyMember(
    familyId: string,
    memberId: string,
    request: UpdateFamilyMemberRequest,
    userId: string,
  ): Promise<Result<FamilyMemberResponse>> {
    this.logger.log(`Updating member: ${memberId}`);
    return this.commandBus.execute(
      UpdateFamilyMemberCommand.create(userId, familyId, memberId, request),
    );
  }

  async removeFamilyMember(
    familyId: string,
    memberId: string,
    reason: string,
    userId: string,
  ): Promise<Result<void>> {
    this.logger.log(`Removing member: ${memberId} from family: ${familyId}`);
    return this.commandBus.execute(
      RemoveFamilyMemberCommand.create(userId, memberId, familyId, reason),
    );
  }

  async markMemberDeceased(request: RecordDeathRequest): Promise<Result<FamilyMemberResponse>> {
    this.logger.log(`Marking member deceased: ${request.familyMemberId}`);
    return this.commandBus.execute(
      MarkMemberDeceasedCommand.create(request.reportedByUserId, request.familyId, request),
    );
  }

  // ===========================================================================
  // RELATIONSHIP & MARRIAGE MANAGEMENT
  // ===========================================================================

  async registerMarriage(request: RegisterMarriageRequest): Promise<Result<MarriageResponse>> {
    this.logger.log(`Registering marriage for family: ${request.familyId}`);
    return this.commandBus.execute(
      RegisterMarriageCommand.create(request.registeredByUserId, request.familyId, request),
    );
  }

  async addPolygamousHouse(
    request: AddPolygamousHouseRequest,
  ): Promise<Result<PolygamousHouseResponse>> {
    this.logger.log(`Adding polygamous house to family: ${request.familyId}`);
    return this.commandBus.execute(
      AddPolygamousHouseCommand.create(request.createdByUserId, request.familyId, request),
    );
  }

  // ===========================================================================
  // READ OPERATIONS (QUERIES)
  // ===========================================================================

  async getFamilyById(query: GetFamilyByIdQuery): Promise<Result<FamilyResponse>> {
    return this.queryBus.execute(query);
  }

  async getFamilyMembers(
    query: GetFamilyMembersQuery,
  ): Promise<Result<PaginatedResponse<FamilyMemberResponse>>> {
    return this.queryBus.execute(query);
  }

  async getFamilyTree(query: GetFamilyTreeQuery): Promise<Result<FamilyTreeResponse>> {
    return this.queryBus.execute(query);
  }

  async searchFamilies(query: SearchFamiliesQuery): Promise<Result<FamilySearchResponse>> {
    return this.queryBus.execute(query);
  }

  async getFamilyCounts(query: GetFamilyCountsQuery): Promise<Result<FamilyCountsResponse>> {
    return this.queryBus.execute(query);
  }

  async checkS40Compliance(
    query: CheckS40ComplianceQuery,
  ): Promise<Result<KenyanLegalComplianceResponse>> {
    return this.queryBus.execute(query);
  }
}
