// src/application/commands/handlers/auth/complete-onboarding.handler.ts
import { Inject, Injectable, Logger } from '@nestjs/common';

import { User } from '../../../../domain/aggregates/user.aggregate';
import { DomainError } from '../../../../domain/errors/domain.errors';
import { EventPublisherPort } from '../../../../domain/ports/event-publisher.port';
import {
  USER_REPOSITORY_PORT,
  UserRepositoryPort,
} from '../../../../domain/ports/user.repository.port';
import { DomainErrorException, UserNotFoundException } from '../../../exceptions/user.exception';
import { CompleteOnboardingCommand } from '../../impl/auth/complete-onboarding.command';

@Injectable()
export class CompleteOnboardingHandler {
  private readonly logger = new Logger(CompleteOnboardingHandler.name);

  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
    private readonly eventPublisher: EventPublisherPort,
  ) {}

  async execute(command: CompleteOnboardingCommand): Promise<User> {
    // 1. Find user
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new UserNotFoundException(command.userId);
    }

    // 2. Complete onboarding via aggregate method
    try {
      user.completeOnboarding();
    } catch (error) {
      if (error instanceof DomainError) {
        throw new DomainErrorException(error);
      }
      throw error;
    }

    // 3. Persist changes
    await this.userRepository.save(user);

    // 4. Publish domain events
    await this.eventPublisher.publishAll(user.domainEvents);

    // 5. Clear domain events
    user.clearDomainEvents();

    this.logger.log(`Onboarding completed for user: ${user.id}`);

    return user;
  }
}
