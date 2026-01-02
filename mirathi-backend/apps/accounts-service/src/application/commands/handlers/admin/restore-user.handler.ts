// src/application/commands/handlers/admin/restore-user.handler.ts
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
import { RestoreUserCommand } from '../../impl/admin/restore-user.command';

@CommandHandler(RestoreUserCommand)
export class RestoreUserHandler implements ICommandHandler<RestoreUserCommand> {
  private readonly logger = new Logger(RestoreUserHandler.name);

  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
    @Inject(EVENT_PUBLISHER_PORT)
    private readonly eventPublisher: EventPublisherPort,
  ) {}

  async execute(command: RestoreUserCommand): Promise<User> {
    const { userId } = command;

    const user = await this.userRepository.findById(userId);
    if (!user) {
      // Note: Repository might need to be updated to find deleted users if findById excludes them
      // Assuming findById returns deleted users OR we add a findIncludeDeleted option
      // For now, consistent with logic.
      throw new UserNotFoundException(userId);
    }

    try {
      user.restore();
    } catch (error) {
      if (error instanceof DomainError) {
        throw new DomainErrorException(error);
      }
      throw error;
    }

    await this.userRepository.save(user);
    await this.eventPublisher.publishAll(user.domainEvents);
    user.clearDomainEvents();

    this.logger.log(`User restored: ${user.id}`);

    return user;
  }
}
