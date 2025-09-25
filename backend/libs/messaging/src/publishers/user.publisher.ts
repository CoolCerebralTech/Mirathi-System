import { Injectable } from '@nestjs/common';
import { EventType } from '@shamba/common';
import { BasePublisher } from './base.publisher';

@Injectable()
export class UserPublisher extends BasePublisher {
  async userCreated(userData: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  }): Promise<void> {
    await this.publishEvent(EventType.USER_CREATED, userData, {
      persistent: true,
      headers: {
        'x-user-id': userData.userId,
      },
    });
  }

  async userUpdated(userData: {
    userId: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  }): Promise<void> {
    await this.publishEvent(EventType.USER_UPDATED, userData, {
      persistent: true,
      headers: {
        'x-user-id': userData.userId,
      },
    });
  }

  async userDeleted(userData: {
    userId: string;
    deletedBy: string;
  }): Promise<void> {
    await this.publishEvent(EventType.USER_DELETED, userData, {
      persistent: true,
    });
  }

  async passwordResetRequested(userData: {
    userId: string;
    email: string;
    resetToken: string;
  }): Promise<void> {
    await this.publishEvent(EventType.PASSWORD_RESET_REQUESTED, userData, {
      persistent: true,
      headers: {
        'x-user-id': userData.userId,
      },
    });
  }
}