// src/application/commands/handlers/admin/change-user-role.handler.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { User } from '../../../../domain/aggregates/user.aggregate';
import { DomainError } from '../../../../domain/errors/domain.errors';
import { EventPublisherPort } from '../../../../domain/ports/event-publisher.port';
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

@Injectable()
export class ChangeUserRoleHandler {
  private readonly logger = new Logger(ChangeUserRoleHandler.name);

  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
    private readonly eventPublisher: EventPublisherPort,
  ) {}

  async execute(command: ChangeUserRoleCommand): Promise<User> {
    // 1. Find user
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new UserNotFoundException(command.userId);
    }

    // 2. Validate role
    const validRoles = Object.values(UserRole);
    if (!validRoles.includes(command.newRole)) {
      throw new InvalidInputException(
        'newRole',
        `Invalid role. Must be one of: ${validRoles.join(', ')}`,
      );
    }

    // 3. Business rule: Can't change your own role
    if (command.userId === command.changedBy) {
      throw new UnauthorizedOperationException('change own role', 'Cannot change your own role');
    }

    // 4. Change role via aggregate method
    try {
      user.changeRole(command.newRole, command.changedBy, command.reason);
    } catch (error) {
      if (error instanceof DomainError) {
        throw new DomainErrorException(error);
      }
      throw error;
    }

    // 5. Persist changes
    await this.userRepository.save(user);

    // 6. Publish domain events
    await this.eventPublisher.publishAll(user.domainEvents);

    // 7. Clear domain events
    user.clearDomainEvents();

    this.logger.log(`User role changed: ${user.id} to ${command.newRole} by ${command.changedBy}`);

    return user;
  }
}
