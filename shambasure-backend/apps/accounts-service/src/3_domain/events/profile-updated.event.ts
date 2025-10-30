import { DomainEvent } from './domain-event.base';

/**
 * Defines the specific data payload for ProfileUpdatedEvent.
 */
export interface ProfileUpdatedEventData {
  readonly email: string;
  readonly updatedFields: Record<string, { old: any; new: any }>;
}

/**
 * ProfileUpdatedEvent
 *
 * Published when a user's profile information is updated.
 * Separate from UserUpdatedEvent to distinguish between account vs profile changes.
 */
export class ProfileUpdatedEvent extends DomainEvent implements ProfileUpdatedEventData {
  public readonly eventName = 'user.profile_updated';

  public readonly email: string;
  public readonly updatedFields: Record<string, { old: any; new: any }>;

  constructor(props: { aggregateId: string } & ProfileUpdatedEventData) {
    super(props.aggregateId);
    this.email = props.email;
    this.updatedFields = props.updatedFields;
  }
}
