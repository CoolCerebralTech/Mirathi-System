// presentation/controllers/dependency.controller.ts
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
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';

import { CurrentUser, JwtAuthGuard, type JwtPayload, Roles, RolesGuard } from '@shamba/auth';

import {
  AssessFinancialDependencyRequest,
  CreateDependencyAssessmentRequest,
  FileS26ClaimRequest,
  RecordCourtProvisionRequest,
} from '../../application/dependency/dto/request';
import {
  DependencyAssessmentResponse,
  DependencyStatusResponse,
} from '../../application/dependency/dto/response';
import { PaginatedResponseDto } from '../../application/dependency/dto/response/base-response.dto';
import { DependencyApplicationService } from '../../application/dependency/services/dependency-application.service';

/**
 * DependencyController
 *
 * Handles all dependency assessment and management HTTP endpoints:
 * - Dependency assessment creation and management
 * - Financial dependency assessment
 * - S.26 claim filing and management
 * - Court provision recording
 * - Compliance checking and reporting
 */
@ApiTags('Dependency Management')
@Controller('dependencies')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class DependencyController {
  constructor(private readonly dependencyService: DependencyApplicationService) {}

  // ==========================================================================
  // DEPENDENCY ASSESSMENT MANAGEMENT
  // ==========================================================================

  @Post('assessments')
  @HttpCode(HttpStatus.CREATED)
  @Roles('ADMIN', 'LAWYER', 'COURT_CLERK', 'REGISTRAR', 'JUDGE', 'FAMILY_MEMBER')
  @ApiOperation({
    summary: 'Create a new dependency assessment',
    description:
      'Creates a dependency assessment for a dependant under Kenyan Law of Succession Act.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Dependency assessment created successfully.',
    type: DependencyAssessmentResponse,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or validation failed.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Dependency assessment already exists for this deceased-dependant pair.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have permission to create dependency assessments.',
  })
  @ApiHeader({
    name: 'X-Correlation-ID',
    description: 'Correlation ID for request tracing',
    required: false,
  })
  async createDependencyAssessment(
    @Body() dto: CreateDependencyAssessmentRequest,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<DependencyAssessmentResponse> {
    const correlationId = req.headers['x-correlation-id'] as string;
    const ipAddress = this.extractIpAddress(req);
    const userAgent = req.headers['user-agent'];

    const metadata = {
      userId: user.sub,
      userRole: user.role,
      ipAddress,
      userAgent,
      organizationId: user.organizationId,
      courtId: user.courtId,
    };

    const result = await this.dependencyService.createDependencyAssessment(
      dto,
      metadata,
      correlationId,
    );

    if (!result.success) {
      throw new Error(result.message);
    }

    return result.data;
  }

  @Get('assessments/:id')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN', 'LAWYER', 'COURT_CLERK', 'REGISTRAR', 'JUDGE', 'FAMILY_MEMBER')
  @ApiOperation({
    summary: 'Get dependency assessment by ID',
    description: 'Retrieves a dependency assessment by its unique identifier.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dependency assessment retrieved successfully.',
    type: DependencyAssessmentResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Dependency assessment not found.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have permission to view this assessment.',
  })
  @ApiParam({
    name: 'id',
    description: 'Dependency assessment ID',
    type: String,
  })
  @ApiQuery({
    name: 'includeDeceasedDetails',
    description: 'Include deceased person details',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'includeDependantDetails',
    description: 'Include dependant person details',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'includeEvidenceDocuments',
    description: 'Include evidence documents',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'includeCourtOrderDetails',
    description: 'Include court order details',
    required: false,
    type: Boolean,
  })
  async getDependencyAssessment(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query('includeDeceasedDetails') includeDeceasedDetails: boolean = false,
    @Query('includeDependantDetails') includeDependantDetails: boolean = true,
    @Query('includeEvidenceDocuments') includeEvidenceDocuments: boolean = false,
    @Query('includeCourtOrderDetails') includeCourtOrderDetails: boolean = false,
    @CurrentUser() user: JwtPayload,
  ): Promise<DependencyAssessmentResponse> {
    const metadata = {
      userId: user.sub,
      userRole: user.role,
    };

    const result = await this.dependencyService.getDependencyById(
      id,
      {
        includeDeceasedDetails,
        includeDependantDetails,
        includeEvidenceDocuments,
        includeCourtOrderDetails,
      },
      metadata,
    );

    if (!result.success) {
      throw new Error(result.message);
    }

    return result.data;
  }

  @Get('deceased/:deceasedId/assessments')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN', 'LAWYER', 'COURT_CLERK', 'REGISTRAR', 'JUDGE', 'FAMILY_MEMBER')
  @ApiOperation({
    summary: 'List dependency assessments by deceased',
    description:
      'Retrieves all dependency assessments for a specific deceased person with filtering and pagination.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dependency assessments retrieved successfully.',
    type: PaginatedResponseDto,
  })
  @ApiParam({
    name: 'deceasedId',
    description: 'Deceased person ID',
    type: String,
  })
  @ApiQuery({
    name: 'status',
    description: 'Filter by dependency status',
    enum: [
      'ALL',
      'PENDING',
      'ASSESSED',
      'WITH_COURT_ORDER',
      'WITHOUT_COURT_ORDER',
      'S29_COMPLIANT',
      'NON_S29_COMPLIANT',
      'HAS_S26_CLAIM',
      'NO_S26_CLAIM',
    ],
    required: false,
  })
  @ApiQuery({
    name: 'basis',
    description: 'Filter by dependency basis',
    enum: [
      'ALL',
      'SPOUSE',
      'CHILD',
      'PARENT',
      'SIBLING',
      'ADOPTED_CHILD',
      'EX_SPOUSE',
      'COHABITOR',
    ],
    required: false,
  })
  @ApiQuery({
    name: 'dependencyLevel',
    description: 'Filter by dependency level',
    enum: ['FULL', 'PARTIAL', 'NONE'],
    required: false,
  })
  @ApiQuery({
    name: 'isMinor',
    description: 'Filter by minor status',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'hasCourtOrder',
    description: 'Filter by court order existence',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Items per page',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'sortBy',
    description: 'Sort field',
    enum: ['dependencyPercentage', 'claimAmount', 'createdAt', 'updatedAt', 'courtOrderDate'],
    required: false,
  })
  @ApiQuery({
    name: 'sortDirection',
    description: 'Sort direction',
    enum: ['ASC', 'DESC'],
    required: false,
  })
  async listDependenciesByDeceased(
    @Param('deceasedId', new ParseUUIDPipe()) deceasedId: string,
    @Query('status') status: string = 'ALL',
    @Query('basis') basis: string = 'ALL',
    @Query('dependencyLevel') dependencyLevel: string,
    @Query('isMinor') isMinor: boolean,
    @Query('hasCourtOrder') hasCourtOrder: boolean,
    @Query('isClaimant') isClaimant: boolean,
    @Query('minDependencyPercentage') minDependencyPercentage: number,
    @Query('maxDependencyPercentage') maxDependencyPercentage: number,
    @Query('minClaimAmount') minClaimAmount: number,
    @Query('maxClaimAmount') maxClaimAmount: number,
    @Query('createdAfter') createdAfter: string,
    @Query('createdBefore') createdBefore: string,
    @Query('searchTerm') searchTerm: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('sortBy') sortBy: string = 'createdAt',
    @Query('sortDirection') sortDirection: 'ASC' | 'DESC' = 'DESC',
    @CurrentUser() user: JwtPayload,
  ): Promise<PaginatedResponseDto<DependencyAssessmentResponse>> {
    const metadata = {
      userId: user.sub,
      userRole: user.role,
    };

    const result = await this.dependencyService.listDependenciesByDeceased(
      deceasedId,
      {
        status,
        basis,
        dependencyLevel,
        isMinor,
        hasCourtOrder,
        isClaimant,
        minDependencyPercentage,
        maxDependencyPercentage,
        minClaimAmount,
        maxClaimAmount,
        createdAfter,
        createdBefore,
        searchTerm,
        page,
        limit,
        sortBy,
        sortDirection,
      },
      metadata,
    );

    if (!result.success) {
      throw new Error(result.message);
    }

    return new PaginatedResponseDto(
      result.data || [],
      {
        page: result.pagination?.page || page,
        limit: result.pagination?.limit || limit,
        totalItems: result.pagination?.total || 0,
        totalPages: result.pagination?.totalPages || 0,
        hasNextPage: result.pagination?.hasNextPage || false,
        hasPreviousPage: result.pagination?.hasPreviousPage || false,
      },
      result.message,
      result.requestId,
    );
  }

  // ==========================================================================
  // FINANCIAL DEPENDENCY ASSESSMENT
  // ==========================================================================

  @Put('assessments/:id/financial')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN', 'LAWYER', 'COURT_CLERK', 'REGISTRAR', 'JUDGE', 'EXPERT_ASSESSOR')
  @ApiOperation({
    summary: 'Assess financial dependency',
    description: 'Assesses the financial dependency level based on evidence and calculations.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Financial dependency assessed successfully.',
    type: DependencyAssessmentResponse,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or assessment not allowed (court order exists).',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Dependency assessment not found.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have permission to assess financial dependency.',
  })
  @ApiParam({
    name: 'id',
    description: 'Dependency assessment ID',
    type: String,
  })
  async assessFinancialDependency(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AssessFinancialDependencyRequest,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<DependencyAssessmentResponse> {
    const correlationId = req.headers['x-correlation-id'] as string;
    const ipAddress = this.extractIpAddress(req);
    const userAgent = req.headers['user-agent'];

    const metadata = {
      userId: user.sub,
      userRole: user.role,
      ipAddress,
      userAgent,
      organizationId: user.organizationId,
      courtId: user.courtId,
    };

    // Ensure the ID in the path matches the DTO
    dto.dependencyAssessmentId = id;

    const result = await this.dependencyService.assessFinancialDependency(
      dto,
      metadata,
      correlationId,
    );

    if (!result.success) {
      throw new Error(result.message);
    }

    return result.data;
  }

  // ==========================================================================
  // S.26 CLAIM MANAGEMENT
  // ==========================================================================

  @Post('assessments/:id/s26-claims')
  @HttpCode(HttpStatus.CREATED)
  @Roles('ADMIN', 'LAWYER', 'COURT_CLERK', 'REGISTRAR', 'JUDGE', 'CLAIMANT')
  @ApiOperation({
    summary: 'File an S.26 claim',
    description: 'Files a Section 26 claim for a dependant under Kenyan Law of Succession Act.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'S.26 claim filed successfully.',
    type: DependencyAssessmentResponse,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or dependency does not qualify for S.26 claim.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'S.26 claim already exists for this dependency.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Dependency assessment not found.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have permission to file S.26 claims.',
  })
  @ApiParam({
    name: 'id',
    description: 'Dependency assessment ID',
    type: String,
  })
  async fileS26Claim(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: FileS26ClaimRequest,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<DependencyAssessmentResponse> {
    const correlationId = req.headers['x-correlation-id'] as string;
    const ipAddress = this.extractIpAddress(req);
    const userAgent = req.headers['user-agent'];

    const metadata = {
      userId: user.sub,
      userRole: user.role,
      ipAddress,
      userAgent,
      organizationId: user.organizationId,
      courtId: user.courtId,
    };

    // Ensure the ID in the path matches the DTO
    dto.dependencyAssessmentId = id;

    const result = await this.dependencyService.fileS26Claim(dto, metadata, correlationId);

    if (!result.success) {
      throw new Error(result.message);
    }

    return result.data;
  }

  // ==========================================================================
  // COURT PROVISION MANAGEMENT
  // ==========================================================================

  @Post('assessments/:id/court-provisions')
  @HttpCode(HttpStatus.CREATED)
  @Roles('ADMIN', 'JUDGE', 'REGISTRAR', 'COURT_CLERK')
  @ApiOperation({
    summary: 'Record court provision order',
    description: 'Records a court provision order for a dependency assessment.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Court provision recorded successfully.',
    type: DependencyAssessmentResponse,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or court provision already exists.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Dependency assessment not found.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have permission to record court provisions.',
  })
  @ApiParam({
    name: 'id',
    description: 'Dependency assessment ID',
    type: String,
  })
  async recordCourtProvision(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: RecordCourtProvisionRequest,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<DependencyAssessmentResponse> {
    const correlationId = req.headers['x-correlation-id'] as string;
    const ipAddress = this.extractIpAddress(req);
    const userAgent = req.headers['user-agent'];

    const metadata = {
      userId: user.sub,
      userRole: user.role,
      ipAddress,
      userAgent,
      organizationId: user.organizationId,
      courtId: user.courtId,
    };

    // Ensure the ID in the path matches the DTO
    dto.dependencyAssessmentId = id;

    const result = await this.dependencyService.recordCourtProvision(dto, metadata, correlationId);

    if (!result.success) {
      throw new Error(result.message);
    }

    return result.data;
  }

  // ==========================================================================
  // COMPLIANCE AND STATISTICS
  // ==========================================================================

  @Get('deceased/:deceasedId/compliance/s29')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN', 'LAWYER', 'JUDGE', 'REGISTRAR', 'AUDITOR', 'SUPERVISOR')
  @ApiOperation({
    summary: 'Check S.29 compliance',
    description: 'Checks compliance with Section 29 of the Kenyan Law of Succession Act.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'S.29 compliance check completed.',
    schema: {
      type: 'object',
      properties: {
        deceasedId: { type: 'string' },
        checkDate: { type: 'string', format: 'date-time' },
        overallCompliance: { type: 'string' },
        compliantDependants: { type: 'number' },
        nonCompliantDependants: { type: 'number' },
        issues: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiParam({
    name: 'deceasedId',
    description: 'Deceased person ID',
    type: String,
  })
  @ApiQuery({
    name: 'checkLevel',
    description: 'Compliance check level',
    enum: ['BASIC', 'DETAILED', 'LEGAL'],
    required: false,
  })
  @ApiQuery({
    name: 'reportFormat',
    description: 'Report format',
    enum: ['SUMMARY', 'DETAILED', 'LEGAL', 'EXECUTIVE'],
    required: false,
  })
  @ApiQuery({
    name: 'includeRecommendations',
    description: 'Include recommendations in report',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'includeLegalCitations',
    description: 'Include legal citations in report',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'calculateDistribution',
    description: 'Calculate distribution based on estate value',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'estateValue',
    description: 'Estate value for distribution calculation',
    required: false,
    type: Number,
  })
  async checkS29Compliance(
    @Param('deceasedId', new ParseUUIDPipe()) deceasedId: string,
    @Query('checkLevel') checkLevel: string = 'DETAILED',
    @Query('reportFormat') reportFormat: string = 'DETAILED',
    @Query('includeRecommendations') includeRecommendations: boolean = true,
    @Query('includeLegalCitations') includeLegalCitations: boolean = false,
    @Query('calculateDistribution') calculateDistribution: boolean = false,
    @Query('estateValue') estateValue: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<any> {
    const metadata = {
      userId: user.sub,
      userRole: user.role,
    };

    const result = await this.dependencyService.checkS29Compliance(
      deceasedId,
      {
        checkLevel,
        reportFormat,
        includeRecommendations,
        includeLegalCitations,
        calculateDistribution,
        estateValue,
      },
      metadata,
    );

    if (!result.success) {
      throw new Error(result.message);
    }

    return result.data;
  }

  @Get('deceased/:deceasedId/statistics')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN', 'ANALYST', 'RESEARCHER', 'SUPERVISOR', 'LAWYER', 'JUDGE')
  @ApiOperation({
    summary: 'Get dependency statistics',
    description: 'Retrieves statistical analysis of dependencies for a deceased person.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dependency statistics retrieved successfully.',
    schema: {
      type: 'object',
      properties: {
        deceasedId: { type: 'string' },
        generatedAt: { type: 'string', format: 'date-time' },
        overview: { type: 'object' },
        byDependencyBasis: { type: 'object' },
        byDependencyLevel: { type: 'object' },
        trends: { type: 'object' },
        financialSummary: { type: 'object' },
        legalCompliance: { type: 'object' },
      },
    },
  })
  @ApiParam({
    name: 'deceasedId',
    description: 'Deceased person ID',
    type: String,
  })
  @ApiQuery({
    name: 'granularity',
    description: 'Statistics granularity',
    enum: [
      'OVERALL',
      'BY_DEPENDENCY_BASIS',
      'BY_DEPENDENCY_LEVEL',
      'BY_CLAIM_STATUS',
      'BY_DISABILITY_STATUS',
      'BY_AGE_GROUP',
    ],
    required: false,
  })
  @ApiQuery({
    name: 'timePeriod',
    description: 'Time period for statistics',
    enum: ['ALL_TIME', 'LAST_YEAR', 'LAST_6_MONTHS', 'LAST_3_MONTHS', 'LAST_MONTH', 'CUSTOM'],
    required: false,
  })
  @ApiQuery({
    name: 'startDate',
    description: 'Start date for custom time period (YYYY-MM-DD)',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'endDate',
    description: 'End date for custom time period (YYYY-MM-DD)',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'includeTrends',
    description: 'Include trend analysis',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'includeComparisons',
    description: 'Include comparisons with other deceased',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'comparisonDeceasedId',
    description: 'Deceased ID for comparison',
    required: false,
    type: String,
  })
  async getDependencyStatistics(
    @Param('deceasedId', new ParseUUIDPipe()) deceasedId: string,
    @Query('granularity') granularity: string = 'OVERALL',
    @Query('timePeriod') timePeriod: string = 'ALL_TIME',
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('includeTrends') includeTrends: boolean = false,
    @Query('includeComparisons') includeComparisons: boolean = false,
    @Query('comparisonDeceasedId') comparisonDeceasedId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<any> {
    const metadata = {
      userId: user.sub,
      userRole: user.role,
    };

    const result = await this.dependencyService.getDependencyStatistics(
      deceasedId,
      {
        granularity,
        timePeriod,
        startDate,
        endDate,
        includeTrends,
        includeComparisons,
        comparisonDeceasedId,
      },
      metadata,
    );

    if (!result.success) {
      throw new Error(result.message);
    }

    return result.data;
  }

  @Get('deceased/:deceasedId/status')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN', 'LAWYER', 'COURT_CLERK', 'REGISTRAR', 'JUDGE', 'FAMILY_MEMBER')
  @ApiOperation({
    summary: 'Get dependency status',
    description: 'Retrieves overall dependency status and summary for a deceased person.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dependency status retrieved successfully.',
    type: DependencyStatusResponse,
  })
  @ApiParam({
    name: 'deceasedId',
    description: 'Deceased person ID',
    type: String,
  })
  @ApiQuery({
    name: 'includeDependants',
    description: 'Include dependant summaries in response',
    required: false,
    type: Boolean,
  })
  async getDependencyStatus(
    @Param('deceasedId', new ParseUUIDPipe()) deceasedId: string,
    @Query('includeDependants') includeDependants: boolean = true,
    @CurrentUser() user: JwtPayload,
  ): Promise<DependencyStatusResponse> {
    const metadata = {
      userId: user.sub,
      userRole: user.role,
    };

    const result = await this.dependencyService.getDependencyStatus(
      deceasedId,
      includeDependants,
      metadata,
    );

    if (!result.success) {
      throw new Error(result.message);
    }

    return result.data;
  }

  // ==========================================================================
  // BULK OPERATIONS
  // ==========================================================================

  @Post('deceased/:deceasedId/assessments/batch')
  @HttpCode(HttpStatus.CREATED)
  @Roles('ADMIN', 'COURT_CLERK', 'REGISTRAR', 'JUDGE')
  @ApiOperation({
    summary: 'Batch create dependency assessments',
    description: 'Creates multiple dependency assessments in a single operation.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Batch creation completed.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'number' },
        failed: { type: 'number' },
        results: { type: 'array', items: { type: 'object' } },
      },
    },
  })
  @ApiParam({
    name: 'deceasedId',
    description: 'Deceased person ID',
    type: String,
  })
  async batchCreateDependencyAssessments(
    @Param('deceasedId', new ParseUUIDPipe()) deceasedId: string,
    @Body() dtos: CreateDependencyAssessmentRequest[],
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<any> {
    const correlationId = req.headers['x-correlation-id'] as string;
    const ipAddress = this.extractIpAddress(req);
    const userAgent = req.headers['user-agent'];

    const metadata = {
      userId: user.sub,
      userRole: user.role,
      ipAddress,
      userAgent,
      organizationId: user.organizationId,
      courtId: user.courtId,
    };

    // Update all DTOs with the deceasedId from path
    const updatedDtos = dtos.map((dto) => ({
      ...dto,
      deceasedId,
    }));

    const result = await this.dependencyService.batchCreateDependencyAssessments(
      updatedDtos,
      metadata,
      correlationId,
    );

    if (!result.success) {
      throw new Error(result.message);
    }

    return result.data;
  }

  // ==========================================================================
  // UTILITY OPERATIONS
  // ==========================================================================

  @Post('assessments/validate')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN', 'LAWYER', 'COURT_CLERK', 'REGISTRAR', 'JUDGE', 'FAMILY_MEMBER')
  @ApiOperation({
    summary: 'Validate dependency assessment',
    description: 'Validates dependency assessment data without creating the assessment.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Validation completed.',
    schema: {
      type: 'object',
      properties: {
        isValid: { type: 'boolean' },
        errors: { type: 'array', items: { type: 'string' } },
        warnings: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async validateDependencyAssessment(
    @Body() dto: CreateDependencyAssessmentRequest,
    @CurrentUser() user: JwtPayload,
  ): Promise<any> {
    const metadata = {
      userId: user.sub,
      userRole: user.role,
    };

    const result = await this.dependencyService.validateDependencyAssessment(dto, metadata);

    if (!result.success) {
      throw new Error(result.message);
    }

    return result.data;
  }

  @Post('assessments/suggested-dependency')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN', 'LAWYER', 'EXPERT_ASSESSOR', 'JUDGE')
  @ApiOperation({
    summary: 'Calculate suggested dependency',
    description: 'Calculates suggested dependency percentage and level based on financial data.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Suggested dependency calculated.',
    schema: {
      type: 'object',
      properties: {
        suggestedPercentage: { type: 'number' },
        suggestedLevel: { type: 'string' },
        explanation: { type: 'string' },
      },
    },
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        deceasedId: { type: 'string' },
        dependantId: { type: 'string' },
        financialData: {
          type: 'object',
          properties: {
            monthlyNeeds: { type: 'number' },
            monthlyContribution: { type: 'number' },
            totalDeceasedIncome: { type: 'number' },
          },
        },
      },
    },
  })
  async calculateSuggestedDependency(
    @Body()
    body: {
      deceasedId: string;
      dependantId: string;
      financialData: {
        monthlyNeeds: number;
        monthlyContribution: number;
        totalDeceasedIncome: number;
      };
    },
    @CurrentUser() user: JwtPayload,
  ): Promise<any> {
    const metadata = {
      userId: user.sub,
      userRole: user.role,
    };

    const result = await this.dependencyService.calculateSuggestedDependency(
      body.deceasedId,
      body.dependantId,
      body.financialData,
      metadata,
    );

    if (!result.success) {
      throw new Error(result.message);
    }

    return result.data;
  }

  @Get('deceased/:deceasedId/reports/:reportType')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN', 'LAWYER', 'JUDGE', 'REGISTRAR', 'SUPERVISOR')
  @ApiOperation({
    summary: 'Generate dependency report',
    description: 'Generates various types of dependency reports (compliance, statistics, summary).',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Report generated successfully.',
    schema: {
      oneOf: [{ type: 'object' }, { type: 'string', format: 'binary' }],
    },
  })
  @ApiParam({
    name: 'deceasedId',
    description: 'Deceased person ID',
    type: String,
  })
  @ApiParam({
    name: 'reportType',
    description: 'Type of report to generate',
    enum: ['COMPLIANCE', 'STATISTICS', 'SUMMARY'],
  })
  @ApiQuery({
    name: 'format',
    description: 'Report format',
    enum: ['json', 'pdf', 'csv'],
    required: false,
  })
  async generateDependencyReport(
    @Param('deceasedId', new ParseUUIDPipe()) deceasedId: string,
    @Param('reportType') reportType: string,
    @Query('format') format: string = 'json',
    @CurrentUser() user: JwtPayload,
  ): Promise<any> {
    const metadata = {
      userId: user.sub,
      userRole: user.role,
    };

    const result = await this.dependencyService.generateDependencyReport(
      deceasedId,
      reportType,
      { format },
      metadata,
    );

    if (!result.success) {
      throw new Error(result.message);
    }

    // Handle different formats
    if (format === 'csv' && typeof result.data === 'string') {
      // Return CSV file
      return result.data;
    } else if (format === 'pdf') {
      // Return PDF buffer
      return result.data;
    }

    return result.data;
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  /**
   * Extract client IP address from request
   * Handles X-Forwarded-For header for proxied requests
   */
  private extractIpAddress(req: Request): string | undefined {
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
      return ips.split(',')[0].trim();
    }
    return req.ip || req.socket.remoteAddress;
  }
}
