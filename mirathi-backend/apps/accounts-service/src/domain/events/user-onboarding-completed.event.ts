// src/domain/events/user-onboarding-completed.event.ts
import { DomainEvent } from './domain-event';

export interface UserOnboardingCompletedEventData {
  userId: string;
  completedAt: string;
}

export class UserOnboardingCompletedEvent extends DomainEvent {
  constructor(private readonly data: UserOnboardingCompletedEventData) {
    super({
      aggregateId: data.userId,
      eventName: 'UserOnboardingCompleted',
    });
  }

  protected serialize(): Record<string, any> {
    return {
      userId: this.data.userId,
      completedAt: this.data.completedAt,
    };
  }
}
