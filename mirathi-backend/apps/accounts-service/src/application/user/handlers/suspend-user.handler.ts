// src/application/user/handlers/suspend-user.handler.ts
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { UserNotFoundError } from '../../../domain/errors/domain.errors';
import type { UserRepositoryPort } from '../../../domain/ports/user.repository.port';
import { SuspendUserCommand } from '../commands/suspend-user.command';

@CommandHandler(SuspendUserCommand)
export class SuspendUserHandler implements ICommandHandler<SuspendUserCommand> {
  constructor(private readonly userRepository: UserRepositoryPort) {}

  async execute(command: SuspendUserCommand): Promise<void> {
    const { userId, suspendedBy, reason } = command.payload;

    // 1. Load user aggregate
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    // 2. Execute domain method
    user.suspend(suspendedBy, reason);

    // 3. Save changes
    await this.userRepository.save(user);

    // 4. Clear domain events
    user.clearDomainEvents();
  }
}
