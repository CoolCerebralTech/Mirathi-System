// src/application/commands/handlers/admin/change-user-role.handler.ts
import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserRole } from '@prisma/client';

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
import {
  DomainErrorException,
  InvalidInputException,
  UnauthorizedOperationException,
  UserNotFoundException,
} from '../../../exceptions/user.exception';
import { ChangeUserRoleCommand } from '../../impl/admin/change-user-role.command';

@CommandHandler(ChangeUserRoleCommand)
export class ChangeUserRoleHandler implements ICommandHandler<ChangeUserRoleCommand> {
  private readonly logger = new Logger(ChangeUserRoleHandler.name);

  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
    @Inject(EVENT_PUBLISHER_PORT)
    private readonly eventPublisher: EventPublisherPort,
  ) {}

  async execute(command: ChangeUserRoleCommand): Promise<User> {
    const { userId, newRole, changedBy, reason } = command;

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId);
    }

    // Validate role
    const validRoles = Object.values(UserRole);
    if (!validRoles.includes(newRole)) {
      throw new InvalidInputException(
        'newRole',
        `Invalid role. Must be one of: ${validRoles.join(', ')}`,
      );
    }

    // Business rule: Can't change your own role
    if (userId === changedBy) {
      throw new UnauthorizedOperationException('change own role', 'Cannot change your own role');
    }

    try {
      user.changeRole(newRole, changedBy, reason);
    } catch (error) {
      if (error instanceof DomainError) {
        throw new DomainErrorException(error);
      }
      throw error;
    }

    await this.userRepository.save(user);
    await this.eventPublisher.publishAll(user.domainEvents);
    user.clearDomainEvents();

    this.logger.log(`User role changed: ${user.id} to ${newRole} by ${changedBy}`);

    return user;
  }
}
