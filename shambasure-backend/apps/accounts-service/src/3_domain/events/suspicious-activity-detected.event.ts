import { DomainEvent } from './domain-event.base';

type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Defines the specific data payload for SuspiciousActivityDetectedEvent.
 */
export interface SuspiciousActivityDetectedEventData extends Record<string, unknown> {
  readonly email: string;
  readonly activityType:
    | 'rapid_login_attempts'
    | 'unusual_location'
    | 'multiple_devices'
    | 'multiple_failed_logins'
    | 'other';
  readonly severity: SeverityLevel;
  readonly details: Record<string, any>;
}

/**
 * Published when suspicious activity is detected on a user account.
 */
export class SuspiciousActivityDetectedEvent extends DomainEvent<SuspiciousActivityDetectedEventData> {
  public readonly eventName = 'user.suspicious_activity_detected';

  constructor(props: { aggregateId: string } & SuspiciousActivityDetectedEventData) {
    super(props.aggregateId, {
      email: props.email,
      activityType: props.activityType,
      severity: props.severity,
      details: props.details,
    });
  }
}
