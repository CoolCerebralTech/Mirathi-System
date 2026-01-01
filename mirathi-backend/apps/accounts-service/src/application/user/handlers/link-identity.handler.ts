// src/application/user/handlers/link-identity.handler.ts
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { UserNotFoundError } from '../../../domain/errors/domain.errors';
import type { UserRepositoryPort } from '../../../domain/ports/user.repository.port';
import { LinkIdentityCommand } from '../commands/link-identity.command';

@CommandHandler(LinkIdentityCommand)
export class LinkIdentityHandler implements ICommandHandler<LinkIdentityCommand> {
  constructor(private readonly userRepository: UserRepositoryPort) {}

  async execute(command: LinkIdentityCommand): Promise<void> {
    const { userId, provider, providerUserId, email } = command.payload;

    // 1. Load user aggregate
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    // 2. Execute domain method
    user.linkIdentity({
      provider,
      providerUserId,
      email,
    });

    // 3. Save changes
    await this.userRepository.save(user);

    // 4. Clear domain events
    user.clearDomainEvents();
  }
}
