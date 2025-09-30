import { Controller, Get, Query, Param } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ShambaEvent, AuditQueryDto } from '@shamba/common';
import { AuditLogEntity, AuditSummaryEntity } from '../entities/audit.entity';
import { AuditingService } from '../services/auditing.service';

@ApiTags('Auditing')
@Controller('auditing')
export class AuditingController {
  constructor(private readonly auditingService: AuditingService) {}

  // --- Event Consumption ---
  // This single method, using a wildcard, subscribes to ALL events in our system.
  // This is the framework-native replacement for the entire AuditEventConsumer class.
  @EventPattern('*.#') // Subscribes to all topics
  async handleAllEvents(@Payload() event: ShambaEvent): Promise<void> {
    await this.auditingService.createLogFromEvent(event);
  }

  // --- API Endpoints for Querying ---
  @Get('logs')
  @ApiOperation({ summary: 'Get a paginated list of all audit logs' })
  // @ApiResponse({ status: 200, type: PaginatedAuditLogResponse }) // Would need to create this DTO
  async findMany(@Query() query: AuditQueryDto) {
    const { logs, total } = await this.auditingService.findMany(query);
    const logEntities = logs.map(log => new AuditLogEntity(log));
    // return new PaginatedAuditLogResponse(logEntities, total, query);
    return { logs: logEntities, total }; // Simplified response for now
  }
  
  @Get('summary')
  @ApiOperation({ summary: 'Get an aggregated summary of audit logs' })
  @ApiResponse({ status: 200, type: AuditSummaryEntity })
  async getSummary(
      @Query('startDate') startDate: Date,
      @Query('endDate') endDate: Date,
  ): Promise<AuditSummaryEntity> {
      return this.auditingService.getSummary(startDate, endDate);
  }
}