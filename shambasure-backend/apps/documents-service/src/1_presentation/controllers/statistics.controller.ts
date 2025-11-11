import {
  Controller,
  Get,
  Query,
  HttpStatus,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles } from '@shamba/auth';
import type { Request } from 'express';

import { StatisticsService } from '../../2_application/services/statistics.service';
import { Actor, UserId } from '../../3_domain/value-objects';
import {
  DashboardAnalyticsResponseDto,
  DocumentAnalyticsResponseDto,
  StorageAnalyticsResponseDto,
  VerificationMetricsResponseDto,
  UploadAnalyticsResponseDto,
} from '../../2_application/dtos';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    roles: string[];
  };
}

// Define TimeRange interface for type safety
interface TimeRange {
  start: Date;
  end: Date;
}

@ApiTags('statistics')
@ApiBearerAuth()
@Controller('statistics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  private createActor(req: AuthenticatedRequest): Actor {
    return new Actor(new UserId(req.user.id), req.user.roles || []);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get comprehensive dashboard analytics' })
  @ApiResponse({ status: HttpStatus.OK, type: DashboardAnalyticsResponseDto })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date (ISO string)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date (ISO string)',
  })
  async getDashboardAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Req() req?: AuthenticatedRequest,
  ): Promise<DashboardAnalyticsResponseDto> {
    const actor = this.createActor(req!);

    let timeRange: TimeRange | undefined;
    if (startDate && endDate) {
      timeRange = {
        start: new Date(startDate),
        end: new Date(endDate),
      };

      // Validate dates
      if (isNaN(timeRange.start.getTime()) || isNaN(timeRange.end.getTime())) {
        throw new BadRequestException('Invalid date format. Use ISO string format.');
      }

      if (timeRange.start > timeRange.end) {
        throw new BadRequestException('startDate must be before endDate');
      }
    }

    return await this.statisticsService.getDashboardAnalytics(actor, timeRange);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get quick dashboard summary' })
  @ApiResponse({ status: HttpStatus.OK })
  async getDashboardSummary(@Req() req?: AuthenticatedRequest): Promise<{
    totalDocuments: number;
    totalStorage: string;
    verificationRate: number;
    documentsNeedingAttention: number;
    pendingVerification: number;
    recentUploads: number;
    storageUsage: string;
  }> {
    const actor = this.createActor(req!);
    return await this.statisticsService.getDashboardSummary(actor);
  }

  @Get('documents')
  @ApiOperation({ summary: 'Get document analytics' })
  @ApiResponse({ status: HttpStatus.OK, type: DocumentAnalyticsResponseDto })
  @ApiQuery({ name: 'userId', required: false, type: String, description: 'User UUID' })
  @ApiQuery({ name: 'category', required: false, type: String, description: 'Document category' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Document status' })
  async getDocumentAnalytics(
    @Query('userId') userId?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Req() req?: AuthenticatedRequest,
  ): Promise<DocumentAnalyticsResponseDto> {
    const actor = this.createActor(req!);

    const filters: {
      userId?: UserId;
      category?: string;
      status?: string;
    } = {
      userId: userId ? new UserId(userId) : undefined,
      category,
      status,
    };

    // Validate that non-admin users can only view their own data
    if (filters.userId && !actor.isAdmin() && !actor.id.equals(filters.userId)) {
      throw new BadRequestException('You can only view your own document analytics');
    }

    return await this.statisticsService.getDocumentAnalytics(actor, filters);
  }

  @Get('storage')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get storage analytics' })
  @ApiResponse({ status: HttpStatus.OK, type: StorageAnalyticsResponseDto })
  @ApiQuery({ name: 'category', required: false, type: String, description: 'Filter by category' })
  async getStorageAnalytics(
    @Query('category') category?: string,
    @Req() req?: AuthenticatedRequest,
  ): Promise<StorageAnalyticsResponseDto> {
    const actor = this.createActor(req!);

    return await this.statisticsService.getStorageAnalytics(actor);
  }

  @Get('verification')
  @Roles('VERIFIER', 'ADMIN')
  @ApiOperation({ summary: 'Get verification metrics' })
  @ApiResponse({ status: HttpStatus.OK, type: VerificationMetricsResponseDto })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: String,
    description: 'Start date (ISO string)',
  })
  @ApiQuery({ name: 'endDate', required: true, type: String, description: 'End date (ISO string)' })
  async getVerificationMetrics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() req?: AuthenticatedRequest,
  ): Promise<VerificationMetricsResponseDto> {
    const actor = this.createActor(req!);

    if (!startDate || !endDate) {
      throw new BadRequestException('startDate and endDate are required');
    }

    const timeRange: TimeRange = {
      start: new Date(startDate),
      end: new Date(endDate),
    };

    // Validate dates
    if (isNaN(timeRange.start.getTime()) || isNaN(timeRange.end.getTime())) {
      throw new BadRequestException('Invalid date format. Use ISO string format.');
    }

    if (timeRange.start > timeRange.end) {
      throw new BadRequestException('startDate must be before endDate');
    }

    return await this.statisticsService.getVerificationMetrics(timeRange, actor);
  }

  @Get('uploads')
  @ApiOperation({ summary: 'Get upload analytics' })
  @ApiResponse({ status: HttpStatus.OK, type: UploadAnalyticsResponseDto })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: String,
    description: 'Start date (ISO string)',
  })
  @ApiQuery({ name: 'endDate', required: true, type: String, description: 'End date (ISO string)' })
  async getUploadAnalytics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() req?: AuthenticatedRequest,
  ): Promise<UploadAnalyticsResponseDto> {
    const actor = this.createActor(req!);

    if (!startDate || !endDate) {
      throw new BadRequestException('startDate and endDate are required');
    }

    const timeRange: TimeRange = {
      start: new Date(startDate),
      end: new Date(endDate),
    };

    // Validate dates
    if (isNaN(timeRange.start.getTime()) || isNaN(timeRange.end.getTime())) {
      throw new BadRequestException('Invalid date format. Use ISO string format.');
    }

    if (timeRange.start > timeRange.end) {
      throw new BadRequestException('startDate must be before endDate');
    }

    return await this.statisticsService.getUploadAnalytics(timeRange, actor);
  }

  @Get('system-health')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get system health metrics' })
  @ApiResponse({ status: HttpStatus.OK })
  getSystemHealth(@Req() req?: AuthenticatedRequest): {
    uptime: number;
    errorRates: Record<string, number>;
    performance: {
      averageResponseTime: number;
      throughput: number;
      concurrentUsers: number;
    };
    storage: {
      totalCapacity: number;
      usedCapacity: number;
      availableCapacity: number;
      usagePercentage: number;
    };
  } {
    const actor = this.createActor(req!);
    return this.statisticsService.getSystemHealthMetrics(actor);
  }

  @Get('trends')
  @ApiOperation({ summary: 'Get document trends' })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: String,
    description: 'Start date (ISO string)',
  })
  @ApiQuery({ name: 'endDate', required: true, type: String, description: 'End date (ISO string)' })
  async getDocumentTrends(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() req?: AuthenticatedRequest,
  ): Promise<{
    uploadTrend: Array<{ date: string; count: number; sizeBytes: number }>;
    verificationTrend: Array<{ date: string; verified: number; rejected: number }>;
    storageTrend: Array<{ date: string; sizeBytes: number }>;
  }> {
    const actor = this.createActor(req!);

    if (!startDate || !endDate) {
      throw new BadRequestException('startDate and endDate are required');
    }

    const timeRange: TimeRange = {
      start: new Date(startDate),
      end: new Date(endDate),
    };

    // Validate dates
    if (isNaN(timeRange.start.getTime()) || isNaN(timeRange.end.getTime())) {
      throw new BadRequestException('Invalid date format. Use ISO string format.');
    }

    if (timeRange.start > timeRange.end) {
      throw new BadRequestException('startDate must be before endDate');
    }

    return await this.statisticsService.getDocumentTrends(actor, timeRange);
  }

  @Get('storage/category-usage')
  @ApiOperation({ summary: 'Get storage usage by category' })
  @ApiResponse({ status: HttpStatus.OK })
  async getStorageUsageByCategory(
    @Req() req?: AuthenticatedRequest,
  ): Promise<
    Array<{ category: string; sizeBytes: number; percentage: number; documentCount: number }>
  > {
    const actor = this.createActor(req!);
    return this.statisticsService.getStorageUsageByCategory(actor);
  }

  @Get('verification/performance')
  @Roles('VERIFIER', 'ADMIN')
  @ApiOperation({ summary: 'Get verifier performance analytics' })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: String,
    description: 'Start date (ISO string)',
  })
  @ApiQuery({ name: 'endDate', required: true, type: String, description: 'End date (ISO string)' })
  async getVerifierPerformance(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() req?: AuthenticatedRequest,
  ): Promise<
    Array<{
      verifierId: string;
      verifierName?: string;
      totalAttempts: number;
      verified: number;
      rejected: number;
      successRate: number;
      averageTime: number;
    }>
  > {
    const actor = this.createActor(req!);

    if (!startDate || !endDate) {
      throw new BadRequestException('startDate and endDate are required');
    }

    const timeRange: TimeRange = {
      start: new Date(startDate),
      end: new Date(endDate),
    };

    // Validate dates
    if (isNaN(timeRange.start.getTime()) || isNaN(timeRange.end.getTime())) {
      throw new BadRequestException('Invalid date format. Use ISO string format.');
    }

    if (timeRange.start > timeRange.end) {
      throw new BadRequestException('startDate must be before endDate');
    }

    return await this.statisticsService.getVerifierPerformance(timeRange, actor);
  }

  @Get('compliance')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get compliance analytics' })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: String,
    description: 'Start date (ISO string)',
  })
  @ApiQuery({ name: 'endDate', required: true, type: String, description: 'End date (ISO string)' })
  getComplianceAnalytics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() req?: AuthenticatedRequest,
  ): {
    complianceRate: number;
    auditTrail: Array<{ date: string; activity: string; count: number }>;
    policyAdherence: Record<string, number>;
    riskAreas: Array<{ area: string; riskLevel: 'high' | 'medium' | 'low'; count: number }>;
  } {
    const actor = this.createActor(req!);

    if (!startDate || !endDate) {
      throw new BadRequestException('startDate and endDate are required');
    }

    const timeRange: TimeRange = {
      start: new Date(startDate),
      end: new Date(endDate),
    };

    // Validate dates
    if (isNaN(timeRange.start.getTime()) || isNaN(timeRange.end.getTime())) {
      throw new BadRequestException('Invalid date format. Use ISO string format.');
    }

    if (timeRange.start > timeRange.end) {
      throw new BadRequestException('startDate must be before endDate');
    }

    return this.statisticsService.getComplianceAnalytics(actor);
  }
}
