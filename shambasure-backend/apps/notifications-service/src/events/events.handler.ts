/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// ============================================================================
// events.handler.ts - Event-Driven Notification Triggers
// ============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import * as common from '@shamba/common';
import { NotificationsService } from '../services/notifications.service';

/**
 * EventsHandler - Listens to domain events and creates notifications
 *
 * EVENTS HANDLED:
 * - user.created → Welcome email
 * - password.reset.requested → Password reset email
 * - will.created → Will confirmation email
 * - heir.assigned → Heir notification email
 * - document.verified → Document verified email
 */
@Injectable()
export class EventsHandler {
  private readonly logger = new Logger(EventsHandler.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  // ========================================================================
  // USER EVENTS
  // ========================================================================

  @EventPattern(common.EventPattern.USER_CREATED)
  async handleUserCreated(event: common.UserCreatedEvent): Promise<void> {
    this.logger.log(`Received user.created event: ${event.data.userId}`);

    try {
      await this.notificationsService.createAndQueueNotification(
        'welcome-email',
        event.data.userId,
        {
          firstName: event.data.firstName,
          lastName: event.data.lastName,
          email: event.data.email,
        },
      );
    } catch (error) {
      this.logger.error(`Failed to queue welcome email for user ${event.data.userId}`, error);
    }
  }

  @EventPattern(common.EventPattern.PASSWORD_RESET_REQUESTED)
  async handlePasswordResetRequested(event: common.PasswordResetRequestedEvent): Promise<void> {
    this.logger.log(`Received password.reset.requested event: ${event.data.userId}`);

    try {
      await this.notificationsService.createAndQueueNotification(
        'password-reset-email',
        event.data.userId,
        {
          resetToken: event.data.token,
          resetLink: `${process.env.FRONTEND_URL}/reset-password?token=${event.data.token}`,
          expiresAt: event.data.expiresAt,
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to queue password reset email for user ${event.data.userId}`,
        error,
      );
    }
  }

  // ========================================================================
  // WILL EVENTS
  // ========================================================================

  @EventPattern(common.EventPattern.WILL_CREATED)
  async handleWillCreated(event: common.WillCreatedEvent): Promise<void> {
    this.logger.log(`Received will.created event: ${event.data.willId}`);

    try {
      await this.notificationsService.createAndQueueNotification(
        'will-created-confirmation',
        event.data.testatorId,
        {
          willTitle: event.data.title,
          willId: event.data.willId,
          status: event.data.status,
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to queue will created email for user ${event.data.testatorId}`,
        error,
      );
    }
  }

  @EventPattern(common.EventPattern.HEIR_ASSIGNED)
  async handleHeirAssigned(event: common.HeirAssignedEvent): Promise<void> {
    this.logger.log(`Received heir.assigned event: ${event.data.beneficiaryId}`);

    try {
      await this.notificationsService.createAndQueueNotification(
        'heir-assigned-notification',
        event.data.beneficiaryId,
        {
          willId: event.data.willId,
          assetId: event.data.assetId,
          sharePercent: event.data.sharePercent,
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to queue heir assigned email for user ${event.data.beneficiaryId}`,
        error,
      );
    }
  }

  // ========================================================================
  // DOCUMENT EVENTS
  // ========================================================================

  @EventPattern(common.EventPattern.DOCUMENT_VERIFIED)
  async handleDocumentVerified(event: common.DocumentVerifiedEvent): Promise<void> {
    this.logger.log(`Received document.verified event: ${event.data.documentId}`);

    try {
      await this.notificationsService.createAndQueueNotification(
        'document-verified-email',
        event.data.uploaderId,
        {
          documentId: event.data.documentId,
          filename: event.data.filename,
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to queue document verified email for user ${event.data.uploaderId}`,
        error,
      );
    }
  }
}
