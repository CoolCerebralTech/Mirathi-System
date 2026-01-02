// src/application/commands/handlers/profile/update-phone-number.handler.ts
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
import { PhoneNumber } from '../../../../domain/value-objects';
import {
  DomainErrorException,
  DuplicatePhoneException,
  UserNotFoundException,
} from '../../../exceptions/user.exception';
import { PhoneNumberInputValidator } from '../../../validators';
import { UpdatePhoneNumberCommand } from '../../impl/profile/update-phone-number.command';

@CommandHandler(UpdatePhoneNumberCommand)
export class UpdatePhoneNumberHandler implements ICommandHandler<UpdatePhoneNumberCommand> {
  private readonly logger = new Logger(UpdatePhoneNumberHandler.name);

  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,

    @Inject(EVENT_PUBLISHER_PORT)
    private readonly eventPublisher: EventPublisherPort,

    private readonly phoneValidator: PhoneNumberInputValidator,
  ) {}

  async execute(command: UpdatePhoneNumberCommand): Promise<User> {
    const { userId, phoneNumber: newPhone } = command;

    // 1. Find user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId);
    }

    // 2. Validate and create phone number value object
    let phoneNumberVO: PhoneNumber | undefined;

    if (newPhone !== undefined) {
      if (newPhone) {
        phoneNumberVO = this.phoneValidator.validateAndCreate(newPhone);

        // Check uniqueness
        if (user.phoneNumber?.value !== newPhone) {
          const existingPhone = await this.userRepository.existsByPhoneNumber(newPhone);
          if (existingPhone) {
            throw new DuplicatePhoneException(newPhone);
          }
        }
      }
    }

    // 3. Update phone number via aggregate method
    try {
      user.updatePhoneNumber(phoneNumberVO);
    } catch (error) {
      if (error instanceof DomainError) {
        throw new DomainErrorException(error);
      }
      throw error;
    }

    // 4. Persist changes
    await this.userRepository.save(user);

    // 5. Publish domain events
    await this.eventPublisher.publishAll(user.domainEvents);

    // 6. Clear domain events
    user.clearDomainEvents();

    this.logger.log(`Phone number updated for user: ${user.id}`);

    return user;
  }
}
