// src/application/user/handlers/verify-phone.handler.ts
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { UserNotFoundError } from '../../../domain/errors/domain.errors';
import type { UserRepositoryPort } from '../../../domain/ports/user.repository.port';
import { VerifyPhoneCommand } from '../commands/verify-phone.command';

@CommandHandler(VerifyPhoneCommand)
export class VerifyPhoneHandler implements ICommandHandler<VerifyPhoneCommand> {
  constructor(private readonly userRepository: UserRepositoryPort) {}

  async execute(command: VerifyPhoneCommand): Promise<void> {
    const { userId } = command.payload;

    // 1. Load user aggregate
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    // 2. Execute domain method
    user.markPhoneVerified();

    // 3. Save changes
    await this.userRepository.save(user);

    // 4. Clear domain events
    user.clearDomainEvents();
  }
}
