// src/application/user/handlers/update-profile.handler.ts
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { UserNotFoundError } from '../../../domain/errors/domain.errors';
import type { UserRepositoryPort } from '../../../domain/ports/user.repository.port';
import { UpdateProfileCommand } from '../commands/update-profile.command';

@CommandHandler(UpdateProfileCommand)
export class UpdateProfileHandler implements ICommandHandler<UpdateProfileCommand> {
  constructor(private readonly userRepository: UserRepositoryPort) {}

  async execute(command: UpdateProfileCommand): Promise<void> {
    const { userId, firstName, lastName, avatarUrl, county, physicalAddress } = command.payload;

    // 1. Load user aggregate
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    // 2. Execute domain method
    user.updateProfile({
      firstName,
      lastName,
      avatarUrl,
      county,
      physicalAddress,
    });

    // 3. Save changes
    await this.userRepository.save(user);

    // 4. Clear domain events
    user.clearDomainEvents();
  }
}
