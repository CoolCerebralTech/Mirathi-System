// src/infrastructure/adapters/messaging/domain-event.mapper.ts
import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { BaseEvent } from '@shamba/messaging';
import { ShambaEvents } from '@shamba/messaging';

import {
  DomainEvent,
  IdentityLinkedEvent,
  PhoneVerifiedEvent,
  ProfileUpdatedEvent,
  RoleChangedEvent,
  SettingsUpdatedEvent,
  UserActivatedEvent,
  UserDeletedEvent,
  UserOnboardingCompletedEvent,
  UserRegisteredEvent,
  UserRestoredEvent,
  UserSuspendedEvent,
} from '../../../domain/events';

@Injectable()
export class DomainEventMapper {
  private readonly logger = new Logger(DomainEventMapper.name);

  /**
   * Converts a Domain Layer event into a Messaging Layer event.
   * Preserves correlation IDs and timestamps for auditability.
   */
  toMessage(domainEvent: DomainEvent): BaseEvent {
    const eventType = this.mapEventType(domainEvent);

    // Safety check: ensure we mapped it correctly
    if (!eventType) {
      this.logger.warn(
        `Could not map domain event ${domainEvent.constructor.name} to ShambaEvents enum.`,
      );
      throw new Error(`Unmapped domain event: ${domainEvent.constructor.name}`);
    }

    return {
      eventType,
      timestamp: domainEvent.occurredAt.toISOString(),
      // Use existing correlationId from domain event if it exists (for tracing), else generate new
      correlationId: (domainEvent as any).correlationId || uuidv4(),
      userId: this.extractUserId(domainEvent),
      payload: this.extractPayload(domainEvent),
      metadata: {
        service: 'accounts-service',
        version: '1.0.0',
        sourceIp: (domainEvent as any).metadata?.ipAddress,
        userAgent: (domainEvent as any).metadata?.userAgent,
      },
    };
  }

  /**
   * Maps specific Domain Event Classes to ShambaEvents Enum strings.
   */
  private mapEventType(event: DomainEvent): ShambaEvents {
    if (event instanceof UserRegisteredEvent) return ShambaEvents.ACCOUNTS_USER_REGISTERED;
    if (event instanceof UserActivatedEvent) return ShambaEvents.ACCOUNTS_USER_ACTIVATED;
    if (event instanceof UserOnboardingCompletedEvent)
      return ShambaEvents.ACCOUNTS_ONBOARDING_COMPLETED;
    if (event instanceof UserSuspendedEvent) return ShambaEvents.ACCOUNTS_USER_SUSPENDED;
    if (event instanceof UserRestoredEvent) return ShambaEvents.ACCOUNTS_USER_RESTORED;
    if (event instanceof UserDeletedEvent) return ShambaEvents.ACCOUNTS_USER_DELETED;
    if (event instanceof RoleChangedEvent) return ShambaEvents.ACCOUNTS_ROLE_CHANGED;
    if (event instanceof ProfileUpdatedEvent) return ShambaEvents.ACCOUNTS_PROFILE_UPDATED;
    if (event instanceof SettingsUpdatedEvent) return ShambaEvents.ACCOUNTS_SETTINGS_UPDATED;
    if (event instanceof IdentityLinkedEvent) return ShambaEvents.ACCOUNTS_IDENTITY_LINKED;
    if (event instanceof PhoneVerifiedEvent) return ShambaEvents.ACCOUNTS_PHONE_VERIFIED;

    throw new Error(`Unknown domain event type: ${event.constructor.name}`);
  }

  /**
   * Helper to extract User ID consistently from different event structures
   */
  private extractUserId(event: DomainEvent): string {
    // Almost all our account events have userId at the top level
    if ('userId' in event) {
      return (event as any).userId;
    }
    return 'system';
  }

  /**
   * Helper to extract clean payload (removing internal domain metadata if necessary)
   */
  private extractPayload(event: DomainEvent): any {
    // We strip out the domain-specific 'occurredAt' or 'metadata' if they are duplicate
    // effectively sending the whole event properties as payload
    const { ...payload } = event;
    return payload;
  }
}
