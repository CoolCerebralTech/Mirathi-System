import { DomainEvent } from './domain-event.base';

/**
 * Defines the specific data payload for ProfileUpdatedEvent.
 */
export interface ProfileUpdatedEventData extends Record<string, unknown> {
  readonly email: string;
  readonly updatedFields: Record<string, { old: any; new: any }>;
}

/**
 * ProfileUpdatedEvent
 *
 * Published when a user's profile information is updated.
 * Separate from UserUpdatedEvent to distinguish between account vs profile changes.
 */
export class ProfileUpdatedEvent extends DomainEvent<ProfileUpdatedEventData> {
  public readonly eventName = 'user.profile_updated';

  constructor(props: { aggregateId: string } & ProfileUpdatedEventData) {
    super(props.aggregateId, {
      email: props.email,
      updatedFields: props.updatedFields,
    });
  }
}
