import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser, JwtAuthGuard, type JwtPayload } from '@shamba/auth';

// Queries
import { GetFamilyDashboardQuery } from '../../../application/family/queries/impl/get-family-dashboard.query';
import { GetFamilyGraphQuery } from '../../../application/family/queries/impl/get-family-graph.query';
import { GetFamilyMemberQuery } from '../../../application/family/queries/impl/get-family-member.query';
import { GetPolygamyDistributionQuery } from '../../../application/family/queries/impl/get-polygamy-distribution.query';
import { GetSuccessionReadinessQuery } from '../../../application/family/queries/impl/get-succession-readiness.query';
import { SearchFamiliesQuery } from '../../../application/family/queries/impl/search-families.query';
import { KenyanCounty } from '../../../domain/value-objects/family-enums.vo';
// Response DTOs
import { FamilyDetailsDto } from '../dto/response/family-details.dto';
import { FamilyMemberDto } from '../dto/response/family-member.dto';
import { FamilyTreeDto } from '../dto/response/family-tree.dto';
import { PolygamyStatusDto } from '../dto/response/polygamy-status.dto';
import { SuccessionAnalysisDto } from '../dto/response/succession-analysis.dto';
// Mappers
import { FamilyPresenterMapper } from '../mappers/family.presenter.mapper';

@ApiTags('Family Queries (Read)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('families')
export class FamilyQueryController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @ApiOperation({ summary: 'Search for families' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'county', required: false, enum: KenyanCounty })
  async searchFamilies(
    @CurrentUser() user: JwtPayload,
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 10,
    @Query('search') searchText?: string,
    @Query('county') county?: KenyanCounty,
  ) {
    const query = new SearchFamiliesQuery({
      userId: user.sub,
      page: Number(page),
      pageSize: Number(pageSize),
      searchText,
      county,
    });

    const result = await this.queryBus.execute(query);
    if (result.isFailure) throw new HttpException(result.error.message, HttpStatus.BAD_REQUEST);

    // Note: Search returns PaginatedResult directly, doesn't need Mapper translation
    // unless we want to hide internal DB fields. For search summaries, simple projection is usually fine.
    return result.getValue();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get family dashboard/summary' })
  @ApiResponse({ type: FamilyDetailsDto })
  async getDashboard(
    @Param('id') familyId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<FamilyDetailsDto> {
    const query = new GetFamilyDashboardQuery({
      userId: user.sub,
      familyId,
    });

    const result = await this.queryBus.execute(query);
    if (result.isFailure) throw new HttpException(result.error.message, HttpStatus.NOT_FOUND);

    return FamilyPresenterMapper.toFamilyDetailsDto(result.getValue());
  }

  @Get(':id/graph')
  @ApiOperation({ summary: 'Get visual graph data (nodes/edges)' })
  @ApiQuery({ name: 'depth', required: false, type: Number })
  @ApiResponse({ type: FamilyTreeDto })
  async getGraph(
    @Param('id') familyId: string,
    @CurrentUser() user: JwtPayload,
    @Query('depth') depth?: number,
  ): Promise<FamilyTreeDto> {
    const query = new GetFamilyGraphQuery({
      userId: user.sub,
      familyId,
      depth: depth ? Number(depth) : undefined,
    });

    const result = await this.queryBus.execute(query);
    if (result.isFailure) throw new HttpException(result.error.message, HttpStatus.NOT_FOUND);

    return FamilyPresenterMapper.toFamilyTreeDto(result.getValue());
  }

  @Get(':id/members/:memberId')
  @ApiOperation({ summary: 'Get detailed member profile' })
  @ApiResponse({ type: FamilyMemberDto })
  async getMember(
    @Param('id') familyId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<FamilyMemberDto> {
    const query = new GetFamilyMemberQuery({
      userId: user.sub,
      familyId,
      memberId,
    });

    const result = await this.queryBus.execute(query);
    if (result.isFailure) throw new HttpException(result.error.message, HttpStatus.NOT_FOUND);

    return FamilyPresenterMapper.toFamilyMemberDto(result.getValue());
  }

  @Get(':id/analysis/succession')
  @ApiOperation({ summary: 'Get "Digital Lawyer" Succession Readiness Report' })
  @ApiResponse({ type: SuccessionAnalysisDto })
  async getSuccessionReadiness(
    @Param('id') familyId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<SuccessionAnalysisDto> {
    const query = new GetSuccessionReadinessQuery({
      userId: user.sub,
      familyId,
    });

    const result = await this.queryBus.execute(query);
    if (result.isFailure) throw new HttpException(result.error.message, HttpStatus.BAD_REQUEST);

    return FamilyPresenterMapper.toSuccessionAnalysisDto(result.getValue());
  }

  @Get(':id/analysis/polygamy')
  @ApiOperation({ summary: 'Get Section 40 Polygamy Distribution Status' })
  @ApiResponse({ type: PolygamyStatusDto })
  async getPolygamyStatus(
    @Param('id') familyId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<PolygamyStatusDto> {
    const query = new GetPolygamyDistributionQuery({
      userId: user.sub,
      familyId,
    });

    const result = await this.queryBus.execute(query);
    if (result.isFailure) throw new HttpException(result.error.message, HttpStatus.BAD_REQUEST);

    return FamilyPresenterMapper.toPolygamyStatusDto(result.getValue());
  }
}
