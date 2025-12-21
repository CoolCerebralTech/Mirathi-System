import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { CurrentUser, JwtAuthGuard, type JwtPayload, Roles, RolesGuard } from '@shamba/auth';

import {
  AssessFinancialDependencyRequest,
  CreateDependencyAssessmentRequest,
  FileS26ClaimRequest,
  RecordCourtProvisionRequest,
} from '../../application/dependency/dto/request';
import {
  DependencyAssessmentResponse,
  DependencyStatistics,
  DependencyStatusResponse,
} from '../../application/dependency/dto/response';
import {
  CheckS29ComplianceQuery,
  ComplianceCheckLevel,
  ComplianceReportFormat,
} from '../../application/dependency/queries/impl/check-s29-compliance.query';
import { GetDependencyByIdQuery } from '../../application/dependency/queries/impl/get-dependency-by-id.query';
import {
  GetDependencyStatisticsQuery,
  StatisticsGranularity,
  TimePeriod,
} from '../../application/dependency/queries/impl/get-dependency-statistics.query';
import {
  DependencyBasisFilter,
  DependencyStatus,
  ListDependenciesByDeceasedQuery,
} from '../../application/dependency/queries/impl/list-dependencies-by-deceased.query';
import {
  SearchDependenciesQuery,
  SearchField,
  SearchScope,
} from '../../application/dependency/queries/impl/search-dependencies.query';
import { DependencyApplicationService } from '../../application/dependency/services/dependency-application.service';

/**
 * DependencyController
 *
 * Handles HTTP requests for managing Estate Dependants under the
 * Law of Succession Act (Cap 160).
 */
@ApiTags('Dependency Management')
@Controller('dependencies')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class DependencyController {
  constructor(private readonly dependencyService: DependencyApplicationService) {}

  // ==========================================================================
  // COMMANDS
  // ==========================================================================

  @Post('assessments')
  @HttpCode(HttpStatus.CREATED)
  // USER: Family members/Heirs creating assessments
  // VERIFIER: Lawyers/Court clerks entering data
  // ADMIN: System overrides
  @Roles(UserRole.USER, UserRole.VERIFIER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Create a new dependency assessment',
    description: 'Registers a potential heir or dependant for an estate.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: DependencyAssessmentResponse,
  })
  async createAssessment(
    @Body() dto: CreateDependencyAssessmentRequest,
    @CurrentUser() user: JwtPayload,
  ): Promise<DependencyAssessmentResponse> {
    dto.createdBy = user.sub;

    const result = await this.dependencyService.createAssessment(dto);

    if (result.isFailure) {
      throw new Error(result.error?.message);
    }
    return result.getValue();
  }

  @Put('assessments/financial')
  @HttpCode(HttpStatus.OK)
  // Financial assessment requires professional judgment (VERIFIER) or Admin
  @Roles(UserRole.VERIFIER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Assess financial dependency',
    description: 'Updates the financial dependency ratio and level for a dependant.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: DependencyAssessmentResponse,
  })
  async assessFinancialDependency(
    @Body() dto: AssessFinancialDependencyRequest,
    @CurrentUser() user: JwtPayload,
  ): Promise<DependencyAssessmentResponse> {
    dto.assessedBy = user.sub;

    const result = await this.dependencyService.assessFinancialDependency(dto);

    if (result.isFailure) {
      throw new Error(result.error?.message);
    }
    return result.getValue();
  }

  @Post('claims/s26')
  @HttpCode(HttpStatus.CREATED)
  // USER: Claimants filing for themselves
  // VERIFIER: Lawyers filing on behalf
  @Roles(UserRole.USER, UserRole.VERIFIER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'File Section 26 Claim',
    description: 'Files a claim for reasonable provision from the estate.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: DependencyAssessmentResponse,
  })
  async fileS26Claim(
    @Body() dto: FileS26ClaimRequest,
    @CurrentUser() user: JwtPayload,
  ): Promise<DependencyAssessmentResponse> {
    dto.declaredBy = user.sub;

    const result = await this.dependencyService.fileSection26Claim(dto);

    if (result.isFailure) {
      throw new Error(result.error?.message);
    }
    return result.getValue();
  }

  @Post('provisions/court-order')
  @HttpCode(HttpStatus.CREATED)
  // Strictly restricted to VERIFIERS (Court Officers) and ADMINS
  @Roles(UserRole.VERIFIER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Record Court Provision Order',
    description: 'Formalizes a court-ordered provision for a dependant.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: DependencyAssessmentResponse,
  })
  async recordCourtProvision(
    @Body() dto: RecordCourtProvisionRequest,
    @CurrentUser() user: JwtPayload,
  ): Promise<DependencyAssessmentResponse> {
    dto.recordedBy = user.sub;

    const result = await this.dependencyService.recordCourtProvision(dto);

    if (result.isFailure) {
      throw new Error(result.error?.message);
    }
    return result.getValue();
  }

  // ==========================================================================
  // QUERIES
  // ==========================================================================

  @Get('assessments/:id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.USER, UserRole.VERIFIER, UserRole.ADMIN, UserRole.AUDITOR)
  @ApiOperation({ summary: 'Get assessment by ID' })
  @ApiResponse({ status: HttpStatus.OK, type: DependencyAssessmentResponse })
  async getAssessmentById(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('includeDeceasedDetails') includeDeceasedDetails?: boolean,
    @Query('includeDependantDetails') includeDependantDetails?: boolean,
    @Query('includeEvidenceDocuments') includeEvidenceDocuments?: boolean,
    @Query('includeCourtOrderDetails') includeCourtOrderDetails?: boolean,
    @CurrentUser() user?: JwtPayload,
  ): Promise<DependencyAssessmentResponse> {
    const query = new GetDependencyByIdQuery(id, {
      includeDeceasedDetails,
      includeDependantDetails,
      includeEvidenceDocuments,
      includeCourtOrderDetails,
      userId: user?.sub,
      // Pass the strict enum or map it if the query expects string
      userRole: user?.role as string,
    });

    const result = await this.dependencyService.getAssessmentById(query);

    if (result.isFailure) {
      throw new Error(result.error?.message);
    }
    return result.getValue();
  }

  @Get('deceased/:deceasedId/list')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.USER, UserRole.VERIFIER, UserRole.ADMIN, UserRole.AUDITOR)
  @ApiOperation({ summary: 'List dependants for a deceased person' })
  @ApiResponse({ status: HttpStatus.OK, type: [DependencyAssessmentResponse] })
  async listByDeceased(
    @Param('deceasedId', ParseUUIDPipe) deceasedId: string,
    @Query('status') status?: DependencyStatus,
    @Query('basis') basis?: DependencyBasisFilter,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @CurrentUser() user?: JwtPayload,
  ): Promise<DependencyAssessmentResponse[]> {
    const query = new ListDependenciesByDeceasedQuery(deceasedId, {
      status,
      basis,
      page,
      limit,
      userId: user?.sub,
      userRole: user?.role as string,
    });

    const result = await this.dependencyService.listByDeceased(query);

    if (result.isFailure) {
      throw new Error(result.error?.message);
    }
    return result.getValue();
  }

  @Get('deceased/:deceasedId/compliance')
  @HttpCode(HttpStatus.OK)
  // Compliance checks: Professionals, Admins, Auditors
  @Roles(UserRole.VERIFIER, UserRole.ADMIN, UserRole.AUDITOR)
  @ApiOperation({ summary: 'Check S.29 Compliance' })
  @ApiResponse({ status: HttpStatus.OK, type: DependencyStatusResponse })
  async checkCompliance(
    @Param('deceasedId', ParseUUIDPipe) deceasedId: string,
    @Query('level') checkLevel?: ComplianceCheckLevel,
    @Query('format') reportFormat?: ComplianceReportFormat,
    @CurrentUser() user?: JwtPayload,
  ): Promise<DependencyStatusResponse> {
    const query = new CheckS29ComplianceQuery(deceasedId, {
      checkLevel,
      reportFormat,
      userId: user?.sub,
      userRole: user?.role as string,
    });

    const result = await this.dependencyService.checkS29Compliance(query);

    if (result.isFailure) {
      throw new Error(result.error?.message);
    }
    return result.getValue();
  }

  @Get('deceased/:deceasedId/statistics')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.VERIFIER, UserRole.ADMIN, UserRole.AUDITOR)
  @ApiOperation({ summary: 'Get Dependency Statistics' })
  @ApiResponse({ status: HttpStatus.OK, type: DependencyStatistics })
  async getStatistics(
    @Param('deceasedId', ParseUUIDPipe) deceasedId: string,
    @Query('granularity') granularity?: StatisticsGranularity,
    @Query('period') timePeriod?: TimePeriod,
    @CurrentUser() user?: JwtPayload,
  ): Promise<DependencyStatistics> {
    const query = new GetDependencyStatisticsQuery(deceasedId, {
      granularity,
      timePeriod,
      userId: user?.sub,
      userRole: user?.role as string,
    });

    const result = await this.dependencyService.getStatistics(query);

    if (result.isFailure) {
      throw new Error(result.error?.message);
    }
    return result.getValue();
  }

  @Get('search')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.VERIFIER, UserRole.ADMIN, UserRole.AUDITOR)
  @ApiOperation({ summary: 'Search Dependencies' })
  @ApiResponse({ status: HttpStatus.OK, type: [DependencyAssessmentResponse] })
  async search(
    @Query('q') searchTerm: string,
    @Query('scope') searchScope?: SearchScope,
    @Query('field') searchField?: SearchField,
    @CurrentUser() user?: JwtPayload,
  ): Promise<DependencyAssessmentResponse[]> {
    const query = new SearchDependenciesQuery(searchTerm, {
      searchScope,
      searchField,
      userId: user?.sub,
      userRole: user?.role as string,
    });

    const result = await this.dependencyService.search(query);

    if (result.isFailure) {
      throw new Error(result.error?.message);
    }
    return result.getValue();
  }
}
