// src/application/commands/handlers/admin/unsuspend-user.handler.ts
import { Inject, Injectable, Logger } from '@nestjs/common';

import { User } from '../../../../domain/aggregates/user.aggregate';
import { DomainError } from '../../../../domain/errors/domain.errors';
import { EventPublisherPort } from '../../../../domain/ports/event-publisher.port';
import {
  USER_REPOSITORY_PORT,
  UserRepositoryPort,
} from '../../../../domain/ports/user.repository.port';
import { DomainErrorException, UserNotFoundException } from '../../../exceptions/user.exception';
import { UnsuspendUserCommand } from '../../impl/admin/unsuspend-user.command';

@Injectable()
export class UnsuspendUserHandler {
  private readonly logger = new Logger(UnsuspendUserHandler.name);

  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
    private readonly eventPublisher: EventPublisherPort,
  ) {}

  async execute(command: UnsuspendUserCommand): Promise<User> {
    // 1. Find user
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new UserNotFoundException(command.userId);
    }

    // 2. Unsuspend via aggregate method
    try {
      user.unsuspend(command.unsuspendedBy);
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

    this.logger.log(`User unsuspended: ${user.id} by ${command.unsuspendedBy}`);

    return user;
  }
}
