// src/application/commands/handlers/profile/update-phone-number.handler.ts
import { Inject, Injectable, Logger } from '@nestjs/common';

import { User } from '../../../../domain/aggregates/user.aggregate';
import { DomainError } from '../../../../domain/errors/domain.errors';
import { EventPublisherPort } from '../../../../domain/ports/event-publisher.port';
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

@Injectable()
export class UpdatePhoneNumberHandler {
  private readonly logger = new Logger(UpdatePhoneNumberHandler.name);

  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
    private readonly eventPublisher: EventPublisherPort,
    private readonly phoneValidator: PhoneNumberInputValidator,
  ) {}

  async execute(command: UpdatePhoneNumberCommand): Promise<User> {
    // 1. Find user
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new UserNotFoundException(command.userId);
    }

    // 2. Validate and create phone number value object
    let phoneNumber: PhoneNumber | undefined;
    if (command.phoneNumber !== undefined) {
      if (command.phoneNumber) {
        phoneNumber = this.phoneValidator.validateAndCreate(command.phoneNumber);

        // Check if phone number is already taken by another user
        if (user.phoneNumber?.value !== command.phoneNumber) {
          const existingPhone = await this.userRepository.existsByPhoneNumber(command.phoneNumber);
          if (existingPhone) {
            throw new DuplicatePhoneException(command.phoneNumber);
          }
        }
      }
    }

    // 3. Update phone number via aggregate method
    try {
      user.updatePhoneNumber(phoneNumber);
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
