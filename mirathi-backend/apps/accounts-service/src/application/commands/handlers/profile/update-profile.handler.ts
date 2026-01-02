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
import {
  CountyInputValidator,
  PhoneNumberInputValidator,
  UserInputValidator,
} from '../../../validators';
import { UpdateProfileCommand } from '../../impl/profile/update-profile.command';

@Injectable()
export class UpdateProfileHandler {
  private readonly logger = new Logger(UpdateProfileHandler.name);

  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
    private readonly eventPublisher: EventPublisherPort,
    private readonly userInputValidator: UserInputValidator,
    private readonly phoneValidator: PhoneNumberInputValidator,
    private readonly countyValidator: CountyInputValidator,
  ) {}

  async execute(command: UpdateProfileCommand): Promise<User> {
    // 1. Find user
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new UserNotFoundException(command.userId);
    }

    // 2. Validate inputs
    if (command.firstName) {
      this.userInputValidator.validateName(command.firstName, 'firstName');
    }
    if (command.lastName) {
      this.userInputValidator.validateName(command.lastName, 'lastName');
    }
    if (command.avatarUrl) {
      this.userInputValidator.validateAvatarUrl(command.avatarUrl);
    }
    if (command.physicalAddress) {
      this.userInputValidator.validateAddress(command.physicalAddress, 'physicalAddress');
    }
    if (command.postalAddress) {
      this.userInputValidator.validateAddress(command.postalAddress, 'postalAddress');
    }

    // 3. Validate and create value objects
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

    // 4. Update profile via aggregate method
    try {
      user.updateProfile({
        firstName: command.firstName,
        lastName: command.lastName,
        avatarUrl: command.avatarUrl,
        phoneNumber,
        county: command.county,
        physicalAddress: command.physicalAddress,
        postalAddress: command.postalAddress,
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
