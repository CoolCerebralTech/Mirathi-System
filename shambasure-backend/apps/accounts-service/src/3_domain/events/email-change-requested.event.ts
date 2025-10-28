import { DomainEvent } from './domain-event.base';

/**
 * Defines the specific data payload for EmailChangeRequestedEvent.
 */
export interface EmailChangeRequestedEventData {
  readonly currentEmail: string;
  readonly newEmail: string;
  readonly token: string; // Verification token (hashed in DB)
}

/**
 * EmailChangeRequestedEvent
 *
 * Published when a user requests to change their email address.
 * A verification email will be sent to the new email address.
 */
export class EmailChangeRequestedEvent
  extends DomainEvent
  implements EmailChangeRequestedEventData
{
  public readonly eventName = 'user.email_change_requested';

  public readonly currentEmail: string;
  public readonly newEmail: string;
  public readonly token: string;

  constructor(props: { aggregateId: string } & EmailChangeRequestedEventData) {
    super(props.aggregateId);
    this.currentEmail = props.currentEmail;
    this.newEmail = props.newEmail;
    this.token = props.token;
  }
}
