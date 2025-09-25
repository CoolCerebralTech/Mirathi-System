import { Injectable } from '@nestjs/common';
import { EventType } from '@shamba/common';
import { MessagingService } from '@shamba/messaging';
import { LoggerService } from '@shamba/observability';

@Injectable()
export class UserEvents {
  constructor(
    private messagingService: MessagingService,
    private logger: LoggerService,
  ) {}

  async userCreated(payload: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    timestamp: Date;
  }) {
    try {
      await this.messagingService.publish(EventType.USER_CREATED, payload);
      this.logger.info('User created event published', 'UserEvents', {
        userId: payload.userId,
      });
    } catch (error) {
      this.logger.error('Failed to publish user created event', 'UserEvents', {
        error: error.message,
        userId: payload.userId,
      });
    }
  }

  async userUpdated(payload: {
    userId: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    timestamp: Date;
  }) {
    try {
      await this.messagingService.publish(EventType.USER_UPDATED, payload);
      this.logger.info('User updated event published', 'UserEvents', {
        userId: payload.userId,
      });
    } catch (error) {
      this.logger.error('Failed to publish user updated event', 'UserEvents', {
        error: error.message,
        userId: payload.userId,
      });
    }
  }

  async userDeleted(payload: {
    userId: string;
    email: string;
    deletedBy: string;
    timestamp: Date;
  }) {
    try {
      await this.messagingService.publish(EventType.USER_DELETED, payload);
      this.logger.info('User deleted event published', 'UserEvents', {
        userId: payload.userId,
      });
    } catch (error) {
      this.logger.error('Failed to publish user deleted event', 'UserEvents', {
        error: error.message,
        userId: payload.userId,
      });
    }
  }

  async passwordResetRequested(payload: {
    userId: string;
    email: string;
    resetToken: string;
    expiresAt: Date;
    timestamp: Date;
  }) {
    try {
      await this.messagingService.publish(EventType.PASSWORD_RESET_REQUESTED, payload);
      this.logger.info('Password reset requested event published', 'UserEvents', {
        userId: payload.userId,
      });
    } catch (error) {
      this.logger.error('Failed to publish password reset event', 'UserEvents', {
        error: error.message,
        userId: payload.userId,
      });
    }
  }
}