// src/presentation/dtos/outputs/onboarding-status.output.ts
import { Field, ObjectType } from '@nestjs/graphql';

/**
 * GraphQL output for onboarding status
 */
@ObjectType('OnboardingStatus')
export class OnboardingStatusOutput {
  @Field()
  isComplete: boolean;

  @Field()
  needsOnboarding: boolean;

  @Field()
  hasProfile: boolean;

  @Field()
  hasSettings: boolean;
}
