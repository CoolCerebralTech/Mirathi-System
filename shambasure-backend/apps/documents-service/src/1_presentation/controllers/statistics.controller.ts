import { Controller, Get, Query, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles } from '@shamba/auth';

import { StatisticsService } from '../../2_application/services/statistics.service';
import { Actor, UserId } from '../../3_domain/value-objects';
import {
  DashboardAnalyticsResponseDto,
  DocumentAnalyticsResponseDto,
  StorageAnalyticsResponseDto,
  VerificationMetricsResponseDto,
  UploadAnalyticsResponseDto,
} from '../../2_application/dtos';

@ApiTags('statistics')
@ApiBearerAuth()
@Controller('statistics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  private createActor(req: any): Actor {
    return new Actor(new UserId(req.user.id), req.user.roles || []);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get comprehensive dashboard analytics' })
  @ApiResponse({ status: HttpStatus.OK, type: DashboardAnalyticsResponseDto })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getDashboardAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Req() req: any,
  ): Promise<DashboardAnalyticsResponseDto> {
    const actor = this.createActor(req);
    const timeRange =
      startDate && endDate
        ? {
            start: new Date(startDate),
            end: new Date(endDate),
          }
        : undefined;

    return this.statisticsService.getDashboardAnalytics(actor, timeRange);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get quick dashboard summary' })
  async getDashboardSummary(@Req() req: any): Promise<any> {
    const actor = this.createActor(req);
    return this.statisticsService.getDashboardSummary(actor);
  }

  @Get('documents')
  @ApiOperation({ summary: 'Get document analytics' })
  @ApiResponse({ status: HttpStatus.OK, type: DocumentAnalyticsResponseDto })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  async getDocumentAnalytics(
    @Query('userId') userId?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Req() req: any,
  ): Promise<DocumentAnalyticsResponseDto> {
    const actor = this.createActor(req);
    const filters = {
      userId: userId ? new UserId(userId) : undefined,
      category,
      status,
    };

    return this.statisticsService.getDocumentAnalytics(actor, filters);
  }

  @Get('storage')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get storage analytics' })
  @ApiResponse({ status: HttpStatus.OK, type: StorageAnalyticsResponseDto })
  async getStorageAnalytics(@Req() req: any): Promise<StorageAnalyticsResponseDto> {
    const actor = this.createActor(req);
    return this.statisticsService.getStorageAnalytics(actor);
  }

  @Get('verification')
  @Roles('VERIFIER', 'ADMIN')
  @ApiOperation({ summary: 'Get verification metrics' })
  @ApiResponse({ status: HttpStatus.OK, type: VerificationMetricsResponseDto })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  async getVerificationMetrics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() req: any,
  ): Promise<VerificationMetricsResponseDto> {
    const actor = this.createActor(req);
    const timeRange = {
      start: new Date(startDate),
      end: new Date(endDate),
    };

    return this.statisticsService.getVerificationMetrics(actor, timeRange);
  }

  @Get('uploads')
  @ApiOperation({ summary: 'Get upload analytics' })
  @ApiResponse({ status: HttpStatus.OK, type: UploadAnalyticsResponseDto })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  async getUploadAnalytics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() req: any,
  ): Promise<UploadAnalyticsResponseDto> {
    const actor = this.createActor(req);
    const timeRange = {
      start: new Date(startDate),
      end: new Date(endDate),
    };

    return this.statisticsService.getUploadAnalytics(actor, timeRange);
  }

  @Get('system-health')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get system health metrics' })
  async getSystemHealth(@Req() req: any): Promise<any> {
    const actor = this.createActor(req);
    return this.statisticsService.getSystemHealthMetrics(actor);
  }

  @Get('trends')
  @ApiOperation({ summary: 'Get document trends' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  async getDocumentTrends(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() req: any,
  ): Promise<any> {
    const actor = this.createActor(req);
    const timeRange = {
      start: new Date(startDate),
      end: new Date(endDate),
    };

    return this.statisticsService.getDocumentTrends(actor, timeRange);
  }
}
