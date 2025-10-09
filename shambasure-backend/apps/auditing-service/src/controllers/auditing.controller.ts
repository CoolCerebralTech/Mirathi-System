// ============================================================================
// auditing.controller.ts - Admin Audit Log Endpoints
// ============================================================================

import {
  Controller as AuditController,
  Get as AuditGet,
  Query as AuditQuery,
  Param as AuditParam,
  UseGuards as AuditUseGuards,
  UseInterceptors as AuditUseInterceptors,
  ClassSerializerInterceptor as AuditClassSerializerInterceptor,
  ParseUUIDPipe,
  Res,
} from '@nestjs/common';
import {
  ApiTags as AuditApiTags,
  ApiOperation as AuditApiOperation,
  ApiResponse as AuditApiResponse,
  ApiBearerAuth as AuditApiBearerAuth,
  ApiParam as AuditApiParam,
} from '@nestjs/swagger';
import express from 'express';
import {
  AuditQueryDto as ControllerAuditQueryDto,
  createPaginatedResponseDto,
} from '@shamba/common';
import { JwtAuthGuard, RolesGuard, Roles } from '@shamba/auth';
import { UserRole } from '@shamba/database';
import {
  AuditLogEntity,
  AuditSummaryEntity as ControllerAuditSummaryEntity,
} from '../entities/audit.entity';
import { AuditingService as ControllerAuditingService } from '../services/auditing.service';

const PaginatedAuditLogResponse = createPaginatedResponseDto(AuditLogEntity);

/**
 * AuditingController - Admin audit log access
 * All routes require ADMIN role for security/compliance
 */
@AuditApiTags('Auditing (Admin)')
@AuditController('auditing')
@AuditUseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@AuditUseInterceptors(AuditClassSerializerInterceptor)
@AuditApiBearerAuth()
export class AuditingController {
  constructor(private readonly auditingService: ControllerAuditingService) {}

  @AuditGet('logs')
  @AuditApiOperation({
    summary: 'List audit logs',
    description: 'Get paginated audit logs with filters',
  })
  @AuditApiResponse({
    status: 200,
    description: 'Logs retrieved successfully',
    type: PaginatedAuditLogResponse,
  })
  async findMany(@AuditQuery() query: ControllerAuditQueryDto) {
    const { logs, total } = await this.auditingService.findMany(query);
    const logEntities = logs.map((log) => new AuditLogEntity(log));
    return new PaginatedAuditLogResponse(logEntities, total, query);
  }

  @AuditGet('logs/:id')
  @AuditApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @AuditApiOperation({ summary: 'Get audit log by ID' })
  @AuditApiResponse({ status: 200, type: AuditLogEntity })
  async findOne(@AuditParam('id', ParseUUIDPipe) id: string) {
    const log = await this.auditingService.findById(id);
    return log ? new AuditLogEntity(log) : null;
  }

  @AuditGet('summary')
  @AuditApiOperation({
    summary: 'Get audit summary',
    description: 'Get aggregated statistics for date range',
  })
  @AuditApiResponse({ status: 200, type: ControllerAuditSummaryEntity })
  async getSummary(
    @AuditQuery('startDate') startDate: string,
    @AuditQuery('endDate') endDate: string,
  ) {
    return this.auditingService.getSummary(new Date(startDate), new Date(endDate));
  }

  @AuditGet('analytics/trends')
  @AuditApiOperation({ summary: 'Get daily event trends' })
  async getDailyTrends(
    @AuditQuery('startDate') startDate: string,
    @AuditQuery('endDate') endDate: string,
  ) {
    return this.auditingService.getDailyTrends(new Date(startDate), new Date(endDate));
  }

  @AuditGet('analytics/top-users')
  @AuditApiOperation({ summary: 'Get most active users' })
  async getMostActiveUsers(@AuditQuery('limit') limit?: number) {
    return this.auditingService.getMostActiveUsers(limit || 10);
  }

  @AuditGet('analytics/top-actions')
  @AuditApiOperation({ summary: 'Get most common actions' })
  async getMostCommonActions(@AuditQuery('limit') limit?: number) {
    return this.auditingService.getMostCommonActions(limit || 10);
  }

  @AuditGet('export/csv')
  @AuditApiOperation({ summary: 'Export logs as CSV' })
  async exportCsv(
    @AuditQuery('startDate') startDate: string,
    @AuditQuery('endDate') endDate: string,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const csv = await this.auditingService.generateCsvReport(
      new Date(startDate),
      new Date(endDate),
    );

    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="audit-logs-${startDate}-${endDate}.csv"`,
    });

    return csv;
  }
}
