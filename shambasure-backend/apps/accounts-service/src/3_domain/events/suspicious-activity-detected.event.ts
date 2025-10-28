import { DomainEvent } from './domain-event.base';

/**
 * Defines the specific data payload for SuspiciousActivityDetectedEvent.
 */
export interface SuspiciousActivityDetectedEventData {
  readonly email: string;
  readonly activityType: 'rapid_login_attempts' | 'unusual_location' | 'multiple_devices' | 'other';
  readonly description: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
  readonly metadata?: Record<string, any>;
}

/**
 * SuspiciousActivityDetectedEvent
 *
 * Published when suspicious activity is detected on a user account.
 * Used for security monitoring, alerting, and potential automated responses.
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
    | 'other';
  public readonly description: string;
  public readonly ipAddress?: string;
  public readonly userAgent?: string;
  public readonly metadata?: Record<string, any>;

  constructor(props: { aggregateId: string } & SuspiciousActivityDetectedEventData) {
    super(props.aggregateId);
    this.email = props.email;
    this.activityType = props.activityType;
    this.description = props.description;
    this.ipAddress = props.ipAddress;
    this.userAgent = props.userAgent;
    this.metadata = props.metadata;
  }
}
