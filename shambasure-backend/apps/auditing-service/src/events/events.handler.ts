// ============================================================================
// events.handler.ts - Universal Event Consumer
// ============================================================================

import { Logger as EventLogger } from '@nestjs/common';
import { EventPattern as EventPatternDecorator } from '@nestjs/microservices';
import { Controller as EventController } from '@nestjs/common';
import * as common from '@shamba/common';
import { AuditingService as EventAuditingService } from '../services/auditing.service';

/**
 * EventsHandler - Universal event consumer
 * Listens to ALL events in the system and creates audit logs
 */
@EventController()
export class EventsHandler {
  private readonly logger = new EventLogger(EventsHandler.name);

  constructor(private readonly auditingService: EventAuditingService) {}

  /**
   * Catch-all event handler
   * Listens to all events using wildcard pattern
   */
  @EventPatternDecorator('*')
  async handleAllEvents(event: common.ShambaEvent): Promise<void> {
    this.logger.debug(`Received event: ${event.type}`);

    try {
      await this.auditingService.createLogFromEvent(event);
    } catch (error) {
      this.logger.error(`Failed to create audit log for event ${event.type}`, error);
    }
  }
}
