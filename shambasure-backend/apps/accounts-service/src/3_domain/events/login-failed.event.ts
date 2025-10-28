import { DomainEvent } from './domain-event.base';

/**
 * Defines the specific data payload for LoginFailedEvent.
 */
export interface LoginFailedEventData {
  readonly email: string;
  readonly reason: string;
  readonly attemptCount: number;
  readonly ipAddress?: string;
  readonly userAgent?: string;
}

/**
 * LoginFailedEvent
 *
 * Published when a user login attempt fails.
 * Used for security monitoring and account lockout mechanisms.
 */
export class LoginFailedEvent extends DomainEvent implements LoginFailedEventData {
  public readonly eventName = 'user.login_failed';

  public readonly email: string;
  public readonly reason: string;
  public readonly attemptCount: number;
  public readonly ipAddress?: string;
  public readonly userAgent?: string;

  constructor(props: { aggregateId: string } & LoginFailedEventData) {
    super(props.aggregateId);
    this.email = props.email;
    this.reason = props.reason;
    this.attemptCount = props.attemptCount;
    this.ipAddress = props.ipAddress;
    this.userAgent = props.userAgent;
  }
}
