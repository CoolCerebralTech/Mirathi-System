// src/application/user/handlers/update-phone-number.handler.ts
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { UserNotFoundError } from '../../../domain/errors/domain.errors';
import type { UserRepositoryPort } from '../../../domain/ports/user.repository.port';
import { PhoneNumber } from '../../../domain/value-objects';
import { UpdatePhoneNumberCommand } from '../commands/update-phone-number.command';

@CommandHandler(UpdatePhoneNumberCommand)
export class UpdatePhoneNumberHandler implements ICommandHandler<UpdatePhoneNumberCommand> {
  constructor(private readonly userRepository: UserRepositoryPort) {}

  async execute(command: UpdatePhoneNumberCommand): Promise<void> {
    const { userId, phoneNumber } = command.payload;

    // 1. Load user aggregate
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    // 2. Create PhoneNumber value object
    const phone = PhoneNumber.create(phoneNumber);

    // 3. Execute domain method
    user.updatePhoneNumber(phone);

    // 4. Save changes
    await this.userRepository.save(user);

    // 5. Clear domain events
    user.clearDomainEvents();
  }
}
