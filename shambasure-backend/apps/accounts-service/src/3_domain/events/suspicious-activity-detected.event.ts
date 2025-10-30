import { DomainEvent } from './domain-event.base';

type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Defines the specific data payload for SuspiciousActivityDetectedEvent.
 */
export interface SuspiciousActivityDetectedEventData {
  readonly email: string;
  readonly activityType:
    | 'rapid_login_attempts'
    | 'unusual_location'
    | 'multiple_devices'
    | 'multiple_failed_logins' // This was added based on your usage
    | 'other';
  readonly severity: SeverityLevel; // Added this property
  readonly details: Record<string, any>; // Aligned with your usage
}

/**
 * Published when suspicious activity is detected on a user account.
 */
export class SuspiciousActivityDetectedEvent
  extends DomainEvent
  implements SuspiciousActivityDetectedEventData
{
  public readonly eventName = 'user.suspicious_activity_detected';

  public readonly email: string;
  public readonly activityType:
    | 'rapid_login_attempts'
    | 'unusual_location'
    | 'multiple_devices'
    | 'multiple_failed_logins'
    | 'other';
  public readonly severity: SeverityLevel;
  public readonly details: Record<string, any>;

  constructor(props: { aggregateId: string } & SuspiciousActivityDetectedEventData) {
    super(props.aggregateId);
    this.email = props.email;
    this.activityType = props.activityType;
    this.severity = props.severity;
    this.details = props.details;
  }
}
