import { DomainEvent } from './domain-event.base';

/**
 * Defines the specific data payload for UserUnlockedEvent.
 */
export interface UserUnlockedEventData extends Record<string, unknown> {
  readonly email: string;
  readonly unlockedBy?: string; // undefined = automatic unlock, userId = admin unlock
  readonly previousLockReason?: string;
}

/**
 * UserUnlockedEvent
 *
 * Published when a locked user account is unlocked.
 * Can occur automatically after lockout duration expires or manually by an admin.
 */
export class UserUnlockedEvent extends DomainEvent<UserUnlockedEventData> {
  public readonly eventName = 'user.unlocked';

  constructor(props: { aggregateId: string } & UserUnlockedEventData) {
    super(props.aggregateId, {
      email: props.email,
      unlockedBy: props.unlockedBy,
      previousLockReason: props.previousLockReason,
    });
  }
}
