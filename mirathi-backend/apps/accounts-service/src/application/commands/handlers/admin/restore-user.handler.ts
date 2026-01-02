// src/application/commands/handlers/admin/restore-user.handler.ts
import { Inject, Injectable, Logger } from '@nestjs/common';

import { User } from '../../../../domain/aggregates/user.aggregate';
import { DomainError } from '../../../../domain/errors/domain.errors';
import { EventPublisherPort } from '../../../../domain/ports/event-publisher.port';
import {
  USER_REPOSITORY_PORT,
  UserRepositoryPort,
} from '../../../../domain/ports/user.repository.port';
import { DomainErrorException, UserNotFoundException } from '../../../exceptions/user.exception';
import { RestoreUserCommand } from '../../impl/admin/restore-user.command';

@Injectable()
export class RestoreUserHandler {
  private readonly logger = new Logger(RestoreUserHandler.name);

  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
    private readonly eventPublisher: EventPublisherPort,
  ) {}

  async execute(command: RestoreUserCommand): Promise<User> {
    // 1. Find user
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new UserNotFoundException(command.userId);
    }

    // 2. Restore via aggregate method
    try {
      user.restore();
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

    this.logger.log(`User restored: ${user.id}`);

    return user;
  }
}
