// src/application/commands/handlers/profile/update-profile.handler.ts
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
import { PhoneNumberInputValidator, UserInputValidator } from '../../../validators';
import { UpdateProfileCommand } from '../../impl/profile/update-profile.command';

@CommandHandler(UpdateProfileCommand)
export class UpdateProfileHandler implements ICommandHandler<UpdateProfileCommand> {
  private readonly logger = new Logger(UpdateProfileHandler.name);

  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,

    @Inject(EVENT_PUBLISHER_PORT)
    private readonly eventPublisher: EventPublisherPort,

    private readonly userInputValidator: UserInputValidator,
    private readonly phoneValidator: PhoneNumberInputValidator,
  ) {}

  async execute(command: UpdateProfileCommand): Promise<User> {
    const {
      userId,
      firstName,
      lastName,
      avatarUrl,
      physicalAddress,
      postalAddress,
      phoneNumber: newPhone,
      county,
    } = command;

    // 1. Find user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId);
    }

    // 2. Validate inputs
    if (firstName) this.userInputValidator.validateName(firstName, 'firstName');
    if (lastName) this.userInputValidator.validateName(lastName, 'lastName');
    if (avatarUrl) this.userInputValidator.validateAvatarUrl(avatarUrl);
    if (physicalAddress)
      this.userInputValidator.validateAddress(physicalAddress, 'physicalAddress');
    if (postalAddress) this.userInputValidator.validateAddress(postalAddress, 'postalAddress');

    // 3. Validate and create value objects
    let phoneNumberVO: PhoneNumber | undefined;

    if (newPhone !== undefined) {
      if (newPhone) {
        phoneNumberVO = this.phoneValidator.validateAndCreate(newPhone);

        // Check uniqueness only if it's different from current
        if (user.phoneNumber?.value !== newPhone) {
          const existingPhone = await this.userRepository.existsByPhoneNumber(newPhone);
          if (existingPhone) {
            throw new DuplicatePhoneException(newPhone);
          }
        }
      }
    }

    // 4. Update profile via aggregate method
    try {
      user.updateProfile({
        firstName,
        lastName,
        avatarUrl,
        phoneNumber: phoneNumberVO,
        county,
        physicalAddress,
        postalAddress,
      });
    } catch (error) {
      if (error instanceof DomainError) {
        throw new DomainErrorException(error);
      }
      throw error;
    }

    // 5. Persist changes
    await this.userRepository.save(user);

    // 6. Publish domain events
    await this.eventPublisher.publishAll(user.domainEvents);

    // 7. Clear domain events
    user.clearDomainEvents();

    this.logger.log(`Profile updated for user: ${user.id}`);

    return user;
  }
}
