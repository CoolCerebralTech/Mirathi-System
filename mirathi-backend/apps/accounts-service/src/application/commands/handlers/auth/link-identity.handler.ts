// src/application/commands/handlers/auth/link-identity.handler.ts
import { Inject, Injectable, Logger } from '@nestjs/common';

import { User } from '../../../../domain/aggregates/user.aggregate';
import { DomainError } from '../../../../domain/errors/domain.errors';
import { EventPublisherPort } from '../../../../domain/ports/event-publisher.port';
import {
  USER_REPOSITORY_PORT,
  UserRepositoryPort,
} from '../../../../domain/ports/user.repository.port';
import {
  DomainErrorException,
  DuplicateIdentityException,
  UserNotFoundException,
} from '../../../exceptions/user.exception';
import { UserInputValidator } from '../../../validators';
import { LinkIdentityCommand } from '../../impl/auth/link-identity.command';

@Injectable()
export class LinkIdentityHandler {
  private readonly logger = new Logger(LinkIdentityHandler.name);

  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
    private readonly eventPublisher: EventPublisherPort,
    private readonly inputValidator: UserInputValidator,
  ) {}

  async execute(command: LinkIdentityCommand): Promise<User> {
    // 1. Validate input
    this.inputValidator.validateEmail(command.email);
    this.inputValidator.validateProvider(command.provider);

    // 2. Find user
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new UserNotFoundException(command.userId);
    }

    // 3. Check if identity already exists (across all users)
    const existingIdentity = await this.userRepository.existsByProviderIdentity(
      command.provider,
      command.providerUserId,
    );
    if (existingIdentity) {
      throw new DuplicateIdentityException(command.provider, command.providerUserId);
    }

    // 4. Link identity via aggregate method
    try {
      user.linkIdentity({
        provider: command.provider,
        providerUserId: command.providerUserId,
        email: command.email,
      });
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

    this.logger.log(`Identity linked: ${command.provider} for user ${user.id}`);

    return user;
  }
}
