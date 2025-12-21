import { Result } from '../../../common/base/result';
import { PaginatedResponse } from '../../../common/dto/paginated-response.dto';
// Request DTOs
import { AddFamilyMemberRequest } from '../../dto/request/add-family-member.request';
import { AddPolygamousHouseRequest } from '../../dto/request/add-polygamous-house.request';
import { ArchiveFamilyRequest } from '../../dto/request/archive-family.request';
import { CreateFamilyRequest } from '../../dto/request/create-family.request';
import { RecordDeathRequest } from '../../dto/request/record-death.request';
import { RegisterMarriageRequest } from '../../dto/request/register-marriage.request';
import { UpdateFamilyMemberRequest } from '../../dto/request/update-family-member.request';
import { UpdateFamilyRequest } from '../../dto/request/update-family.request';
// Response DTOs
import { FamilyCountsResponse } from '../../dto/response/family-counts.response';
import { FamilyMemberResponse } from '../../dto/response/family-member.response';
import { FamilySearchResponse } from '../../dto/response/family-search.response';
import { FamilyTreeResponse } from '../../dto/response/family-tree.response';
import { FamilyResponse } from '../../dto/response/family.response';
import { KenyanLegalComplianceResponse } from '../../dto/response/kenyan-legal-compliance.response';
import { MarriageResponse } from '../../dto/response/marriage.response';
import { PolygamousHouseResponse } from '../../dto/response/polygamous-house.response';
// Query Options
import { CheckS40ComplianceQuery } from '../../queries/impl/check-s40-compliance.query';
import { GetFamilyByIdQuery } from '../../queries/impl/get-family-by-id.query';
import { GetFamilyCountsQuery } from '../../queries/impl/get-family-counts.query';
import { GetFamilyMembersQuery } from '../../queries/impl/get-family-members.query';
import { GetFamilyTreeQuery } from '../../queries/impl/get-family-tree.query';
import { SearchFamiliesQuery } from '../../queries/impl/search-families.query';

export const FAMILY_USE_CASE = 'FAMILY_USE_CASE';

export interface IFamilyUseCase {
  /**
   * Core Family Management
   */
  createFamily(request: CreateFamilyRequest, userId: string): Promise<Result<FamilyResponse>>;

  updateFamily(
    familyId: string,
    request: UpdateFamilyRequest,
    userId: string,
  ): Promise<Result<FamilyResponse>>;

  archiveFamily(
    familyId: string,
    request: ArchiveFamilyRequest,
    userId: string,
  ): Promise<Result<void>>;

  /**
   * Member Management
   */
  addFamilyMember(
    familyId: string,
    request: AddFamilyMemberRequest,
    userId: string,
  ): Promise<Result<FamilyMemberResponse>>;

  updateFamilyMember(
    familyId: string,
    memberId: string,
    request: UpdateFamilyMemberRequest,
    userId: string,
  ): Promise<Result<FamilyMemberResponse>>;

  removeFamilyMember(
    familyId: string,
    memberId: string,
    reason: string,
    userId: string,
  ): Promise<Result<void>>;

  markMemberDeceased(
    familyId: string,
    memberId: string,
    request: RecordDeathRequest,
    userId: string,
  ): Promise<Result<FamilyMemberResponse>>;

  /**
   * Marriage & Relationship Management
   */
  registerMarriage(
    familyId: string,
    request: RegisterMarriageRequest,
    userId: string,
  ): Promise<Result<MarriageResponse>>;

  /**
   * Polygamy & S.40 Management
   */
  addPolygamousHouse(
    familyId: string,
    request: AddPolygamousHouseRequest,
    userId: string,
  ): Promise<Result<PolygamousHouseResponse>>;

  /**
   * Queries (Read Operations)
   */
  getFamilyById(query: GetFamilyByIdQuery): Promise<Result<FamilyResponse>>;

  getFamilyMembers(
    query: GetFamilyMembersQuery,
  ): Promise<Result<PaginatedResponse<FamilyMemberResponse>>>;

  getFamilyTree(query: GetFamilyTreeQuery): Promise<Result<FamilyTreeResponse>>;

  searchFamilies(query: SearchFamiliesQuery): Promise<Result<FamilySearchResponse>>;

  getFamilyCounts(query: GetFamilyCountsQuery): Promise<Result<FamilyCountsResponse>>;

  checkS40Compliance(
    query: CheckS40ComplianceQuery,
  ): Promise<Result<KenyanLegalComplianceResponse>>;
}
