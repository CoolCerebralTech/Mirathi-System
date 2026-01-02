// src/presentation/dtos/outputs/notification-capabilities.output.ts
import { Field, ObjectType } from '@nestjs/graphql';

/**
 * GraphQL output for notification capabilities
 */
@ObjectType('NotificationCapabilities')
export class NotificationCapabilitiesOutput {
  @Field()
  email: boolean;

  @Field()
  sms: boolean;
}
