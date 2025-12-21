import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

// Auth Lib (Assumed)
import * as auth from '@shamba/auth';

// Base
import { Result } from '../../application/common/base/result';
import { PaginatedResponse } from '../../application/common/dto/paginated-response.dto';
// Request DTOs
import { AddFamilyMemberRequest } from '../../application/family/dto/request/add-family-member.request';
import { AddPolygamousHouseRequest } from '../../application/family/dto/request/add-polygamous-house.request';
import { ArchiveFamilyRequest } from '../../application/family/dto/request/archive-family.request';
import { CreateFamilyRequest } from '../../application/family/dto/request/create-family.request';
import { RecordDeathRequest } from '../../application/family/dto/request/record-death.request';
import { RegisterMarriageRequest } from '../../application/family/dto/request/register-marriage.request';
import { UpdateFamilyMemberRequest } from '../../application/family/dto/request/update-family-member.request';
import { UpdateFamilyRequest } from '../../application/family/dto/request/update-family.request';
// Response DTOs
import { FamilyCountsResponse } from '../../application/family/dto/response/family-counts.response';
import { FamilyMemberResponse } from '../../application/family/dto/response/family-member.response';
import { FamilySearchResponse } from '../../application/family/dto/response/family-search.response';
import { FamilyTreeResponse } from '../../application/family/dto/response/family-tree.response';
import { FamilyResponse } from '../../application/family/dto/response/family.response';
import { KenyanLegalComplianceResponse } from '../../application/family/dto/response/kenyan-legal-compliance.response';
import { MarriageResponse } from '../../application/family/dto/response/marriage.response';
import { PolygamousHouseResponse } from '../../application/family/dto/response/polygamous-house.response';
// Queries
import { CheckS40ComplianceQuery } from '../../application/family/queries/impl/check-s40-compliance.query';
import { GetFamilyByIdQuery } from '../../application/family/queries/impl/get-family-by-id.query';
import { GetFamilyCountsQuery } from '../../application/family/queries/impl/get-family-counts.query';
import { GetFamilyMembersQuery } from '../../application/family/queries/impl/get-family-members.query';
import { GetFamilyTreeQuery } from '../../application/family/queries/impl/get-family-tree.query';
import { SearchFamiliesQuery } from '../../application/family/queries/impl/search-families.query';
// Service
import { FamilyApplicationService } from '../../application/family/services/family-application.service';

@ApiTags('Families')
@Controller('families')
@UseGuards(auth.JwtAuthGuard)
@ApiBearerAuth()
export class FamilyController {
  constructor(private readonly familyService: FamilyApplicationService) {}

  // ===========================================================================
  // CORE FAMILY MANAGEMENT
  // ===========================================================================

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new family' })
  @ApiResponse({ status: 201, type: FamilyResponse })
  async createFamily(
    @Body() dto: CreateFamilyRequest,
    @auth.CurrentUser() user: auth.JwtPayload,
  ): Promise<FamilyResponse> {
    // Service expects (request, userId)
    const result = await this.familyService.createFamily(dto, user.sub);
    return this.handleResult(result);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Search families with filters' })
  @ApiResponse({ status: 200, type: FamilySearchResponse })
  async searchFamilies(
    @Query() query: SearchFamiliesQuery,
    @auth.CurrentUser() user: auth.JwtPayload,
  ): Promise<FamilySearchResponse> {
    const searchParams = SearchFamiliesQuery.create(user.sub, query as any);
    const result = await this.familyService.searchFamilies(searchParams);
    return this.handleResult(result);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get family details by ID' })
  @ApiParam({ name: 'id', description: 'Family ID' })
  @ApiResponse({ status: 200, type: FamilyResponse })
  async getFamilyById(
    @Param('id') id: string,
    @Query() options: any, // Allow loose query params for includes
    @auth.CurrentUser() user: auth.JwtPayload,
  ): Promise<FamilyResponse> {
    const query = GetFamilyByIdQuery.create(user.sub, id, options);
    const result = await this.familyService.getFamilyById(query);
    return this.handleResult(result);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update family basic information' })
  @ApiParam({ name: 'id', description: 'Family ID' })
  @ApiResponse({ status: 200, type: FamilyResponse })
  async updateFamily(
    @Param('id') id: string,
    @Body() dto: UpdateFamilyRequest,
    @auth.CurrentUser() user: auth.JwtPayload,
  ): Promise<FamilyResponse> {
    // Service expects (familyId, request, userId)
    const result = await this.familyService.updateFamily(id, dto, user.sub);
    return this.handleResult(result);
  }

  @Post(':id/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive a family (Soft delete)' })
  @ApiParam({ name: 'id', description: 'Family ID' })
  @ApiResponse({ status: 200, description: 'Family archived successfully' })
  async archiveFamily(
    @Param('id') id: string,
    @Body() dto: ArchiveFamilyRequest,
    @auth.CurrentUser() user: auth.JwtPayload,
  ): Promise<void> {
    // Service expects (familyId, request, userId)
    const result = await this.familyService.archiveFamily(id, dto, user.sub);
    return this.handleResult(result);
  }

  // ===========================================================================
  // FAMILY MEMBERS
  // ===========================================================================

  @Get(':id/members')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List family members with pagination and filters' })
  @ApiResponse({ status: 200, type: PaginatedResponse })
  async getFamilyMembers(
    @Param('id') familyId: string,
    @Query() query: any,
    @auth.CurrentUser() user: auth.JwtPayload,
  ): Promise<PaginatedResponse<FamilyMemberResponse>> {
    const listQuery = GetFamilyMembersQuery.create(user.sub, familyId, query);
    const result = await this.familyService.getFamilyMembers(listQuery);
    return this.handleResult(result);
  }

  @Post(':id/members')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a member to the family' })
  @ApiResponse({ status: 201, type: FamilyMemberResponse })
  async addFamilyMember(
    @Param('id') familyId: string,
    @Body() dto: AddFamilyMemberRequest,
    @auth.CurrentUser() user: auth.JwtPayload,
  ): Promise<FamilyMemberResponse> {
    // Service expects (familyId, request, userId)
    const result = await this.familyService.addFamilyMember(familyId, dto, user.sub);
    return this.handleResult(result);
  }

  @Patch(':id/members/:memberId') // Corrected Route Structure
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a family member' })
  @ApiParam({ name: 'id', description: 'Family ID' })
  @ApiParam({ name: 'memberId', description: 'Member ID' })
  @ApiResponse({ status: 200, type: FamilyMemberResponse })
  async updateFamilyMember(
    @Param('id') familyId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateFamilyMemberRequest,
    @auth.CurrentUser() user: auth.JwtPayload,
  ): Promise<FamilyMemberResponse> {
    // Service expects (familyId, memberId, request, userId)
    const result = await this.familyService.updateFamilyMember(familyId, memberId, dto, user.sub);
    return this.handleResult(result);
  }

  @Delete(':id/members/:memberId') // Corrected Route Structure
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member from the family' })
  async removeFamilyMember(
    @Param('id') familyId: string,
    @Param('memberId') memberId: string,
    @Query('reason') reason: string,
    @auth.CurrentUser() user: auth.JwtPayload,
  ): Promise<void> {
    if (!reason) throw new BadRequestException('Reason is required for member removal');
    // Service expects (familyId, memberId, reason, userId)
    const result = await this.familyService.removeFamilyMember(
      familyId,
      memberId,
      reason,
      user.sub,
    );
    return this.handleResult(result);
  }

  @Post(':id/members/:memberId/death-record') // Corrected Route Structure
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a family member as deceased' })
  @ApiResponse({ status: 200, type: FamilyMemberResponse })
  async markMemberDeceased(
    @Param('id') familyId: string,
    @Param('memberId') memberId: string,
    @Body() dto: RecordDeathRequest,
    @auth.CurrentUser() user: auth.JwtPayload,
  ): Promise<FamilyMemberResponse> {
    // Service expects (familyId, memberId, request, userId)
    const result = await this.familyService.markMemberDeceased(familyId, memberId, dto, user.sub);
    return this.handleResult(result);
  }

  // ===========================================================================
  // MARRIAGES & RELATIONSHIPS
  // ===========================================================================

  @Post(':id/marriages') // Enforced Family ID in route
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new marriage' })
  @ApiResponse({ status: 201, type: MarriageResponse })
  async registerMarriage(
    @Param('id') familyId: string,
    @Body() dto: RegisterMarriageRequest,
    @auth.CurrentUser() user: auth.JwtPayload,
  ): Promise<MarriageResponse> {
    // Service expects (familyId, request, userId)
    const result = await this.familyService.registerMarriage(familyId, dto, user.sub);
    return this.handleResult(result);
  }

  @Post(':id/polygamous-houses') // Enforced Family ID in route
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a polygamous house (S.40)' })
  @ApiResponse({ status: 201, type: PolygamousHouseResponse })
  async addPolygamousHouse(
    @Param('id') familyId: string,
    @Body() dto: AddPolygamousHouseRequest,
    @auth.CurrentUser() user: auth.JwtPayload,
  ): Promise<PolygamousHouseResponse> {
    // Service expects (familyId, request, userId)
    const result = await this.familyService.addPolygamousHouse(familyId, dto, user.sub);
    return this.handleResult(result);
  }

  // ===========================================================================
  // VISUALIZATION & ANALYTICS
  // ===========================================================================

  @Get(':id/counts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get family statistics and counts' })
  @ApiResponse({ status: 200, type: FamilyCountsResponse })
  async getFamilyCounts(
    @Param('id') id: string,
    @auth.CurrentUser() user: auth.JwtPayload,
  ): Promise<FamilyCountsResponse> {
    const query = GetFamilyCountsQuery.create(user.sub, id);
    const result = await this.familyService.getFamilyCounts(query);
    return this.handleResult(result);
  }

  @Get(':id/tree')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get family tree visualization data' })
  @ApiResponse({ status: 200, type: FamilyTreeResponse })
  async getFamilyTree(
    @Param('id') id: string,
    @Query() options: any,
    @auth.CurrentUser() user: auth.JwtPayload,
  ): Promise<FamilyTreeResponse> {
    const query = GetFamilyTreeQuery.create(user.sub, id, options);
    const result = await this.familyService.getFamilyTree(query);
    return this.handleResult(result);
  }

  // ===========================================================================
  // LEGAL COMPLIANCE
  // ===========================================================================

  @Get(':id/compliance/s40')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check S.40 Polygamy & Succession Compliance' })
  @ApiResponse({ status: 200, type: KenyanLegalComplianceResponse })
  async checkS40Compliance(
    @Param('id') id: string,
    @auth.CurrentUser() user: auth.JwtPayload,
  ): Promise<KenyanLegalComplianceResponse> {
    const query = CheckS40ComplianceQuery.create(user.sub, id);
    const result = await this.familyService.checkS40Compliance(query);
    return this.handleResult(result);
  }

  // ===========================================================================
  // PRIVATE HELPERS
  // ===========================================================================

  private handleResult<T>(result: Result<T>): T {
    if (result.isSuccess) {
      return result.getValue();
    }

    const error = result.error;
    const message = error?.message || 'Unknown error occurred';

    // Log error here in production if needed

    if (message.includes('not found')) {
      throw new NotFoundException(message);
    }

    if (message.includes('unauthorized') || message.includes('permission')) {
      throw new ForbiddenException(message);
    }

    if (
      message.includes('invalid') ||
      message.includes('required') ||
      message.includes('exists') ||
      message.includes('Illegal')
    ) {
      throw new BadRequestException(message);
    }

    throw new InternalServerErrorException(message);
  }
}
