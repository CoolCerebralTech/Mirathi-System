// src/application/commands/handlers/settings/update-settings.handler.ts
import { Inject, Injectable, Logger } from '@nestjs/common';

import { User } from '../../../../domain/aggregates/user.aggregate';
import { DomainError } from '../../../../domain/errors/domain.errors';
import { EventPublisherPort } from '../../../../domain/ports/event-publisher.port';
import {
  USER_REPOSITORY_PORT,
  UserRepositoryPort,
} from '../../../../domain/ports/user.repository.port';
import { DomainErrorException, UserNotFoundException } from '../../../exceptions/user.exception';
import { UserInputValidator } from '../../../validators';
import { UpdateSettingsCommand } from '../../impl/settings/update-settings.command';

@Injectable()
export class UpdateSettingsHandler {
  private readonly logger = new Logger(UpdateSettingsHandler.name);

  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
    private readonly eventPublisher: EventPublisherPort,
    private readonly inputValidator: UserInputValidator,
  ) {}

  async execute(command: UpdateSettingsCommand): Promise<User> {
    // 1. Find user
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new UserNotFoundException(command.userId);
    }

    // 2. Validate inputs
    if (command.language) {
      this.inputValidator.validateLanguage(command.language);
    }
    if (command.theme) {
      this.inputValidator.validateTheme(command.theme);
    }

    // 3. Update settings via aggregate method
    try {
      user.updateSettings({
        language: command.language,
        theme: command.theme,
        emailNotifications: command.emailNotifications,
        smsNotifications: command.smsNotifications,
        pushNotifications: command.pushNotifications,
        marketingOptIn: command.marketingOptIn,
      });
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

    this.logger.log(`Settings updated for user: ${user.id}`);

    return user;
  }
}
