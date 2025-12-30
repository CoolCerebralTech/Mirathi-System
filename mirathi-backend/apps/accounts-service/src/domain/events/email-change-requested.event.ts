import { DomainEvent } from './domain-event.base';

/**
 * Defines the specific data payload for EmailChangeRequestedEvent.
 */
export interface EmailChangeRequestedEventData extends Record<string, unknown> {
  readonly currentEmail: string;
  readonly newEmail: string;
  readonly token: string;
}

/**
 * EmailChangeRequestedEvent
 *
 * Published when a user requests to change their email address.
 * A verification email will be sent to the new email address.
 */
export class EmailChangeRequestedEvent extends DomainEvent<EmailChangeRequestedEventData> {
  public readonly eventName = 'user.email_change_requested';

  constructor(props: { aggregateId: string } & EmailChangeRequestedEventData) {
    super(props.aggregateId, {
      currentEmail: props.currentEmail,
      newEmail: props.newEmail,
      token: props.token,
    });
  }
}
