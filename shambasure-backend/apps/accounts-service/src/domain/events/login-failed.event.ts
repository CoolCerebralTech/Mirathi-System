import { DomainEvent } from './domain-event.base';

/**
 * Defines the specific data payload for LoginFailedEvent.
 */
export interface LoginFailedEventData extends Record<string, unknown> {
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
export class LoginFailedEvent extends DomainEvent<LoginFailedEventData> {
  public readonly eventName = 'user.login_failed';

  constructor(props: { aggregateId: string } & LoginFailedEventData) {
    super(props.aggregateId, {
      email: props.email,
      reason: props.reason,
      attemptCount: props.attemptCount,
      ipAddress: props.ipAddress,
      userAgent: props.userAgent,
    });
  }
}
