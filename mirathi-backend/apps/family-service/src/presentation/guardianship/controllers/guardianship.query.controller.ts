import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser, JwtAuthGuard, type JwtPayload, RolesGuard } from '@shamba/auth';

import {
  DocumentType,
  GetCourtDocumentPreviewQuery,
} from '../../../application/guardianship/queries/impl/get-court-document-preview.query';
// Queries
import { GetGuardianshipByIdQuery } from '../../../application/guardianship/queries/impl/get-guardianship-by-id.query';
import { GetGuardianshipRiskReportQuery } from '../../../application/guardianship/queries/impl/get-guardianship-risk-report.query';
import { GetWardComplianceHistoryQuery } from '../../../application/guardianship/queries/impl/get-ward-compliance-history.query';
import { SearchGuardianshipsQuery } from '../../../application/guardianship/queries/impl/search-guardianships.query';
import { ComplianceTimelineResponseDto } from '../dto/response/compliance-timeline.response.dto';
import { GuardianshipDetailsResponseDto } from '../dto/response/guardianship-details.response.dto';
import { PaginatedGuardianshipResponseDto } from '../dto/response/guardianship-list.response.dto';
import { RiskAssessmentResponseDto } from '../dto/response/risk-assessment.response.dto';
// Mappers & Response DTOs
import { GuardianshipApiMapper } from '../mappers/guardianship-api.mapper';

@ApiTags('Guardianship Queries')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('guardianships')
export class GuardianshipQueryController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @ApiOperation({ summary: 'Search & Filter Guardianships (Dashboard)' })
  @ApiResponse({ type: PaginatedGuardianshipResponseDto })
  async search(
    @Query() filters: any, // In real app, create a SearchRequestDto
    @CurrentUser() user: JwtPayload,
  ): Promise<PaginatedGuardianshipResponseDto> {
    const query = new SearchGuardianshipsQuery({
      ...filters,
      userId: user.sub,
    });

    const result = await this.queryBus.execute(query);
    if (result.isFailure) throw result.error;

    return GuardianshipApiMapper.toPaginatedListResponse(result.getValue());
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Full Case Details' })
  @ApiResponse({ type: GuardianshipDetailsResponseDto })
  async getDetails(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<GuardianshipDetailsResponseDto> {
    const query = new GetGuardianshipByIdQuery(id, user.sub);
    const result = await this.queryBus.execute(query);

    if (result.isFailure) throw result.error;

    return GuardianshipApiMapper.toDetailsResponse(result.getValue());
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Get Compliance Audit Trail' })
  @ApiResponse({ type: ComplianceTimelineResponseDto })
  async getTimeline(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ComplianceTimelineResponseDto> {
    const query = new GetWardComplianceHistoryQuery(id, user.sub);
    const result = await this.queryBus.execute(query);

    if (result.isFailure) throw result.error;

    return GuardianshipApiMapper.toTimelineResponse(result.getValue());
  }

  @Get(':id/risk-assessment')
  @ApiOperation({ summary: 'Get AI Risk Analysis Report' })
  @ApiResponse({ type: RiskAssessmentResponseDto })
  async getRiskReport(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<RiskAssessmentResponseDto> {
    const query = new GetGuardianshipRiskReportQuery(id, user.sub);
    const result = await this.queryBus.execute(query);

    if (result.isFailure) throw result.error;

    return GuardianshipApiMapper.toRiskResponse(result.getValue());
  }

  @Get(':id/documents/:docType/:refId/preview')
  @ApiOperation({ summary: 'Preview Legal Document' })
  async previewDocument(
    @Param('id') id: string,
    @Param('docType') docType: string,
    @Param('refId') refId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const query = new GetCourtDocumentPreviewQuery(id, docType as DocumentType, refId, user.sub);

    const result = await this.queryBus.execute(query);
    if (result.isFailure) throw result.error;

    return result.getValue(); // Returns { content, metadata }
  }
}
