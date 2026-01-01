// src/application/user/handlers/register-user.handler.ts
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { User } from '../../../domain/aggregates/user.aggregate';
import type { UserRepositoryPort } from '../../../domain/ports/user.repository.port';
import { RegisterUserCommand } from '../commands/register-user.command';

@CommandHandler(RegisterUserCommand)
export class RegisterUserHandler implements ICommandHandler<RegisterUserCommand> {
  constructor(private readonly userRepository: UserRepositoryPort) {}

  async execute(command: RegisterUserCommand): Promise<User> {
    const { provider, providerUserId, email, firstName, lastName } = command.payload;

    // 1. Check if user already exists with this identity
    const existingUser = await this.userRepository.findByProviderIdentity(provider, providerUserId);

    if (existingUser) {
      throw new Error(`User already exists with ${provider} identity: ${providerUserId}`);
    }

    // 2. Create new user via domain factory
    const user = User.registerViaOAuth({
      provider,
      providerUserId,
      email,
      firstName,
      lastName,
    });

    // 3. Save user
    await this.userRepository.save(user);

    // 4. Clear domain events (if repository doesn't handle it)
    user.clearDomainEvents();

    return user;
  }
}
