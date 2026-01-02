// src/application/commands/handlers/admin/unsuspend-user.handler.ts
import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { User } from '../../../../domain/aggregates/user.aggregate';
import { DomainError } from '../../../../domain/errors/domain.errors';
import {
  EVENT_PUBLISHER_PORT,
  EventPublisherPort,
} from '../../../../domain/ports/event-publisher.port';
import {
  USER_REPOSITORY_PORT,
  UserRepositoryPort,
} from '../../../../domain/ports/user.repository.port';
import { DomainErrorException, UserNotFoundException } from '../../../exceptions/user.exception';
import { UnsuspendUserCommand } from '../../impl/admin/unsuspend-user.command';

@CommandHandler(UnsuspendUserCommand)
export class UnsuspendUserHandler implements ICommandHandler<UnsuspendUserCommand> {
  private readonly logger = new Logger(UnsuspendUserHandler.name);

  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
    @Inject(EVENT_PUBLISHER_PORT)
    private readonly eventPublisher: EventPublisherPort,
  ) {}

  async execute(command: UnsuspendUserCommand): Promise<User> {
    const { userId, unsuspendedBy } = command;

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId);
    }

    try {
      user.unsuspend(unsuspendedBy);
    } catch (error) {
      if (error instanceof DomainError) {
        throw new DomainErrorException(error);
      }
      throw error;
    }

    await this.userRepository.save(user);
    await this.eventPublisher.publishAll(user.domainEvents);
    user.clearDomainEvents();

    this.logger.log(`User unsuspended: ${user.id} by ${unsuspendedBy}`);

    return user;
  }
}
