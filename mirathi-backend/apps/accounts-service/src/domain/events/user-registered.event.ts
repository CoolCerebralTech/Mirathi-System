// src/domain/events/user-registered.event.ts
import { UserRole } from '@prisma/client';

import { DomainEvent } from './domain-event';

export interface UserRegisteredEventData {
  userId: string;
  provider: string;
  providerUserId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  registeredAt: string;
}

export class UserRegisteredEvent extends DomainEvent {
  constructor(private readonly data: UserRegisteredEventData) {
    super({
      aggregateId: data.userId,
      eventName: 'UserRegistered',
      metadata: {
        provider: data.provider,
        providerUserId: data.providerUserId,
      },
    });
  }

  protected serialize(): Record<string, any> {
    return {
      userId: this.data.userId,
      provider: this.data.provider,
      providerUserId: this.data.providerUserId,
      email: this.data.email,
      firstName: this.data.firstName,
      lastName: this.data.lastName,
      role: this.data.role,
      registeredAt: this.data.registeredAt,
    };
  }
}
