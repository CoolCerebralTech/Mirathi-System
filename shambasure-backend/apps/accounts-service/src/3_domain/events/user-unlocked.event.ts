import { DomainEvent } from './domain-event.base';

/**
 * Defines the specific data payload for UserUnlockedEvent.
 */
export interface UserUnlockedEventData {
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
export class UserUnlockedEvent extends DomainEvent implements UserUnlockedEventData {
  public readonly eventName = 'user.unlocked';

  public readonly email: string;
  public readonly unlockedBy?: string;
  public readonly previousLockReason?: string;

  constructor(props: { aggregateId: string } & UserUnlockedEventData) {
    super(props.aggregateId);
    this.email = props.email;
    this.unlockedBy = props.unlockedBy;
    this.previousLockReason = props.previousLockReason;
  }
}
