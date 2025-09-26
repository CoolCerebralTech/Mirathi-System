import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query, 
  Res, 
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiQuery,
} from '@nestjs/swagger';
import { 
  AuditQueryDto,
  createSuccessResponse,
  createPaginatedResponse,
} from '@shamba/common';
import { 
  JwtAuthGuard, 
  RolesGuard, 
  Roles,
  CurrentUser,
} from '@shamba/auth';
import { AuditService } from '../services/audit.service';
import { AuditReportService } from '../reports/audit-report.service';
import { LoggerService } from '@shamba/observability';
import { UserRole } from '@shamba/common';
import { JwtPayload } from '@shamba/auth';

@ApiTags('Audit')
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AuditController {
  constructor(
    private auditService: AuditService,
    private auditReportService: AuditReportService,
    private logger: LoggerService,
  ) {}

  @Get('logs')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get audit logs (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'action', required: false, enum: String })
  @ApiQuery({ name: 'resource', required: false, enum: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'severity', required: false, enum: String })
  @ApiQuery({ name: 'status', required: false, enum: ['success', 'failure'] })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Audit logs retrieved successfully' 
  })
  async getAuditLogs(
    @Query() query: AuditQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.debug('Fetching audit logs', 'AuditController', { 
      adminUserId: user.userId,
      query,
    });
    
    const result = await this.auditService.getAuditLogs(query);
    
    return createPaginatedResponse(
      result.logs,
      {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        hasNext: result.page < result.totalPages,
        hasPrev: result.page > 1,
      },
      'Audit logs retrieved successfully',
    );
  }

  @Get('logs/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get audit log by ID (Admin only)' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Audit log retrieved successfully' 
  })
  async getAuditLogById(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.debug('Fetching audit log by ID', 'AuditController', { 
      auditLogId: id,
      adminUserId: user.userId,
    });
    
    const result = await this.auditService.getAuditLogById(id);
    
    return createSuccessResponse(result, 'Audit log retrieved successfully');
  }

  @Get('summary')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get audit summary (Admin only)' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Audit summary retrieved successfully' 
  })
  async getAuditSummary(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.debug('Generating audit summary', 'AuditController', { 
      startDate,
      endDate,
      adminUserId: user.userId,
    });
    
    const result = await this.auditService.getAuditSummary(
      new Date(startDate),
      new Date(endDate),
    );
    
    return createSuccessResponse(result, 'Audit summary retrieved successfully');
  }

  @Get('user-activity/:userId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get user activity report (Admin only)' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'User activity report generated successfully' 
  })
  async getUserActivity(
    @Param('userId') userId: string,
    @Query('days') days: number = 30,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.debug('Generating user activity report', 'AuditController', { 
      userId,
      days,
      adminUserId: user.userId,
    });
    
    const result = await this.auditService.getUserActivity(userId, days);
    
    return createSuccessResponse(result, 'User activity report generated successfully');
  }

  @Get('service-stats/:service')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get service statistics (Admin only)' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Service statistics retrieved successfully' 
  })
  async getServiceStats(
    @Param('service') service: string,
    @Query('days') days: number = 7,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.debug('Fetching service statistics', 'AuditController', { 
      service,
      days,
      adminUserId: user.userId,
    });
    
    const result = await this.auditService.getServiceStats(service, days);
    
    return createSuccessResponse(result, 'Service statistics retrieved successfully');
  }

  @Get('security-events')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get security events (Admin only)' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Security events retrieved successfully' 
  })
  async getSecurityEvents(@CurrentUser() user: JwtPayload) {
    this.logger.debug('Fetching security events', 'AuditController', { 
      adminUserId: user.userId,
    });
    
    const result = await this.auditService.getSecurityEvents();
    
    return createSuccessResponse(result, 'Security events retrieved successfully');
  }

  @Post('security-events/:id/resolve')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Resolve security event (Admin only)' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Security event resolved successfully' 
  })
  async resolveSecurityEvent(
    @Param('id') id: string,
    @Body('resolution') resolution: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.info('Resolving security event', 'AuditController', { 
      eventId: id,
      adminUserId: user.userId,
    });
    
    const result = await this.auditService.updateSecurityEventStatus(id, 'resolved', resolution);
    
    return createSuccessResponse(result, 'Security event resolved successfully');
  }

  @Get('reports/export')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Export audit report (Admin only)' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Audit report exported successfully' 
  })
  async exportAuditReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() res: Response,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.info('Exporting audit report', 'AuditController', { 
      startDate,
      endDate,
      adminUserId: user.userId,
    });
    
    await this.auditReportService.streamReportArchive(
      new Date(startDate),
      new Date(endDate),
      res,
    );
  }

  @Get('reports/detailed')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get detailed audit report (Admin only)' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Detailed audit report generated successfully' 
  })
  async getDetailedReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.debug('Generating detailed audit report', 'AuditController', { 
      startDate,
      endDate,
      adminUserId: user.userId,
    });
    
    const result = await this.auditReportService.generateDetailedReport(
      new Date(startDate),
      new Date(endDate),
    );
    
    return createSuccessResponse(result, 'Detailed audit report generated successfully');
  }

  @Post('cleanup')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Clean up old audit logs (Admin only)' })
  @ApiQuery({ name: 'retentionDays', required: false, type: Number })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Audit logs cleaned up successfully' 
  })
  async cleanupOldLogs(
    @Query('retentionDays') retentionDays: number = 365,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.info('Cleaning up old audit logs', 'AuditController', { 
      retentionDays,
      adminUserId: user.userId,
    });
    
    const result = await this.auditService.cleanupOldLogs(retentionDays);
    
    return createSuccessResponse(result, 'Audit logs cleaned up successfully');
  }
}