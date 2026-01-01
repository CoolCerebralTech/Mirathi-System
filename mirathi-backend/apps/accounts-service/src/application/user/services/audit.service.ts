// src/application/user/services/audit.service.ts

import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { LoginAuditEvent } from '../../../infrastructure/events/login-audit.event';

export interface LoginMetadata {
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  location?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly eventBus: EventBus) {}

  /**
   * Record successful login
   */
  async recordSuccessfulLogin(userId: string, metadata: LoginMetadata): Promise<void> {
    await this.eventBus.publish(
      new LoginAuditEvent({
        userId,
        success: true,
        reason: 'successful_login',
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        deviceId: metadata.deviceId,
        location: metadata.location,
        loggedAt: new Date(),
      }),
    );
  }

  /**
   * Record failed login
   */
  async recordFailedLogin(
    userId: string,
    reason: string,
    metadata: LoginMetadata,
  ): Promise<void> {
    await this.eventBus.publish(
      new LoginAuditEvent({
        userId,
        success: false,
        reason,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        deviceId: metadata.deviceId,
        location: metadata.location,
        loggedAt: new Date(),
      }),
    );
  }

  /**
   * Record suspicious activity
   */
  async recordSuspiciousActivity(
    userId: string,
    activityType: string,
    details: Record<string, any>,
  ): Promise<void> {
    await this.eventBus.publish(
      new LoginAuditEvent({
        userId,
        success: false,
        reason: 'suspicious_activity',
        activityType,
        details,
        loggedAt: new Date(),
      }),
    );
  }

  /**
   * Get login history for user
   */
  async getLoginHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<any[]> {
    // This would query the database for login audit records
    // Implementation depends on infrastructure
    return []; // Placeholder
  }

  /**
   * Get suspicious activities for user
   */
  async getSuspiciousActivities(
    userId: string,
    days: number = 30,
  ): Promise<any[]> {
    // Implementation depends on infrastructure
    return []; // Placeholder
  }
}