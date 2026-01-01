// src/application/commands/handlers/auth/link-identity.handler.ts
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
import {
  DomainErrorException,
  DuplicateIdentityException,
  UserNotFoundException,
} from '../../../exceptions/user.exception';
import { UserInputValidator } from '../../../validators/user-input.validator';
import { LinkIdentityCommand } from '../../impl/auth/link-identity.command';

@CommandHandler(LinkIdentityCommand)
export class LinkIdentityHandler implements ICommandHandler<LinkIdentityCommand> {
  private readonly logger = new Logger(LinkIdentityHandler.name);

  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,

    @Inject(EVENT_PUBLISHER_PORT)
    private readonly eventPublisher: EventPublisherPort,

    private readonly inputValidator: UserInputValidator,
  ) {}

  async execute(command: LinkIdentityCommand): Promise<User> {
    const { userId, provider, providerUserId, email } = command;

    // 1. Validate input
    this.inputValidator.validateEmail(email);
    this.inputValidator.validateProvider(provider);

    // 2. Find user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId);
    }

    // 3. Check if identity already exists (across all users)
    // Critical security check: prevent linking an identity already owned by someone else
    const existingIdentity = await this.userRepository.existsByProviderIdentity(
      provider,
      providerUserId,
    );
    if (existingIdentity) {
      throw new DuplicateIdentityException(provider, providerUserId);
    }

    // 4. Link identity via aggregate method
    try {
      user.linkIdentity({
        provider,
        providerUserId,
        email,
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

    this.logger.log(`Identity linked: ${provider} for user ${user.id}`);

    return user;
  }
}
