// src/application/commands/handlers/auth/register-user-via-oauth.handler.ts
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
  DuplicateEmailException,
  DuplicateIdentityException,
} from '../../../exceptions/user.exception';
import { UserInputValidator } from '../../../validators/user-input.validator';
import { RegisterUserViaOAuthCommand } from '../../impl/auth/register-user-via-oauth.command';

@CommandHandler(RegisterUserViaOAuthCommand)
export class RegisterUserViaOAuthHandler implements ICommandHandler<RegisterUserViaOAuthCommand> {
  private readonly logger = new Logger(RegisterUserViaOAuthHandler.name);

  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,

    @Inject(EVENT_PUBLISHER_PORT)
    private readonly eventPublisher: EventPublisherPort,

    private readonly inputValidator: UserInputValidator,
  ) {}

  async execute(command: RegisterUserViaOAuthCommand): Promise<User> {
    const { provider, providerUserId, email, firstName, lastName } = command;

    // 1. Validate input
    this.inputValidator.validateEmail(email);
    this.inputValidator.validateProvider(provider);

    if (firstName) this.inputValidator.validateName(firstName, 'firstName');

    // ✅ FIX: Make lastName optional with fallback
    const validatedLastName = lastName || firstName || 'User';
    if (validatedLastName !== 'User') {
      this.inputValidator.validateName(validatedLastName, 'lastName');
    }

    // 2. ✅ FIX: Check PROVIDER IDENTITY first (more specific)
    const existingUserByIdentity = await this.userRepository.findByProviderIdentity(
      provider,
      providerUserId,
    );
    if (existingUserByIdentity) {
      // ✅ This is actually a LOGIN, not registration - should not throw
      this.logger.warn(
        `Provider identity already exists: ${provider}/${providerUserId}. Should use login flow.`,
      );
      throw new DuplicateIdentityException(provider, providerUserId);
    }

    // 3. Check if user already exists by email
    const existingUserByEmail = await this.userRepository.findByEmail(email);
    if (existingUserByEmail) {
      // ✅ This means user exists with different provider - should LINK, not throw
      this.logger.warn(
        `Email already exists: ${email}. Should link identity instead of creating new user.`,
      );
      throw new DuplicateEmailException(email);
    }

    // 4. Create user aggregate via factory method
    let user: User;
    try {
      user = User.registerViaOAuth({
        provider,
        providerUserId,
        email,
        firstName,
        lastName: validatedLastName, // ✅ Use validated lastName with fallback
      });
    } catch (error) {
      if (error instanceof DomainError) {
        throw new DomainErrorException(error);
      }
      throw error;
    }

    // 5. Persist user (Transactional Save)
    await this.userRepository.save(user);

    // 6. Publish domain events (Post-commit)
    await this.eventPublisher.publishAll(user.domainEvents);

    // 7. Clear domain events from aggregate
    user.clearDomainEvents();

    this.logger.log(`User registered via OAuth: ${user.id} (${provider})`);

    return user;
  }
}
