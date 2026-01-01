// src/application/user/handlers/update-settings.handler.ts
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { UserNotFoundError } from '../../../domain/errors/domain.errors';
import type { UserRepositoryPort } from '../../../domain/ports/user.repository.port';
import { UpdateSettingsCommand } from '../commands/update-settings.command';

@CommandHandler(UpdateSettingsCommand)
export class UpdateSettingsHandler implements ICommandHandler<UpdateSettingsCommand> {
  constructor(private readonly userRepository: UserRepositoryPort) {}

  async execute(command: UpdateSettingsCommand): Promise<void> {
    const {
      userId,
      language,
      theme,
      emailNotifications,
      smsNotifications,
      pushNotifications,
      marketingOptIn,
    } = command.payload;

    // 1. Load user aggregate
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    // 2. Execute domain method
    user.updateSettings({
      language,
      theme,
      emailNotifications,
      smsNotifications,
      pushNotifications,
      marketingOptIn,
    });

    // 3. Save changes
    await this.userRepository.save(user);

    // 4. Clear domain events
    user.clearDomainEvents();
  }
}
