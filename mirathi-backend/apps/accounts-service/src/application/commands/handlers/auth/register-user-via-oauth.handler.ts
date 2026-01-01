// src/application/commands/handlers/auth/register-user-via-oauth.handler.ts
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
  DuplicateEmailException,
  DuplicateIdentityException,
} from '../../../exceptions/user.exception';
import { UserInputValidator } from '../../../validators';
import { RegisterUserViaOAuthCommand } from '../../impl/auth/register-user-via-oauth.command';

@Injectable()
export class RegisterUserViaOAuthHandler {
  private readonly logger = new Logger(RegisterUserViaOAuthHandler.name);

  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
    private readonly eventPublisher: EventPublisherPort,
    private readonly inputValidator: UserInputValidator,
  ) {}

  async execute(command: RegisterUserViaOAuthCommand): Promise<User> {
    // 1. Validate input
    this.inputValidator.validateEmail(command.email);
    this.inputValidator.validateProvider(command.provider);

    if (command.firstName) {
      this.inputValidator.validateName(command.firstName, 'firstName');
    }
    if (command.lastName) {
      this.inputValidator.validateName(command.lastName, 'lastName');
    }

    // 2. Check if user already exists by email
    const existingUserByEmail = await this.userRepository.findByEmail(command.email);
    if (existingUserByEmail) {
      throw new DuplicateEmailException(command.email);
    }

    // 3. Check if identity already exists
    const existingUserByIdentity = await this.userRepository.findByProviderIdentity(
      command.provider,
      command.providerUserId,
    );
    if (existingUserByIdentity) {
      throw new DuplicateIdentityException(command.provider, command.providerUserId);
    }

    // 4. Create user aggregate via factory method
    let user: User;
    try {
      user = User.registerViaOAuth({
        provider: command.provider,
        providerUserId: command.providerUserId,
        email: command.email,
        firstName: command.firstName,
        lastName: command.lastName,
      });
    } catch (error) {
      if (error instanceof DomainError) {
        throw new DomainErrorException(error);
      }
      throw error;
    }

    // 5. Persist user
    await this.userRepository.save(user);

    // 6. Publish domain events
    await this.eventPublisher.publishAll(user.domainEvents);

    // 7. Clear domain events from aggregate
    user.clearDomainEvents();

    this.logger.log(`User registered via OAuth: ${user.id} (${command.provider})`);

    return user;
  }
}
