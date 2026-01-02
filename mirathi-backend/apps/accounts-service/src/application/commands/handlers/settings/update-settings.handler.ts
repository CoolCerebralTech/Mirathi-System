// src/application/commands/handlers/settings/update-settings.handler.ts
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
import { DomainErrorException, UserNotFoundException } from '../../../exceptions/user.exception';
import { UserInputValidator } from '../../../validators';
import { UpdateSettingsCommand } from '../../impl/settings/update-settings.command';

@CommandHandler(UpdateSettingsCommand)
export class UpdateSettingsHandler implements ICommandHandler<UpdateSettingsCommand> {
  private readonly logger = new Logger(UpdateSettingsHandler.name);

  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,

    @Inject(EVENT_PUBLISHER_PORT)
    private readonly eventPublisher: EventPublisherPort,

    private readonly inputValidator: UserInputValidator,
  ) {}

  async execute(command: UpdateSettingsCommand): Promise<User> {
    const {
      userId,
      language,
      theme,
      emailNotifications,
      smsNotifications,
      pushNotifications,
      marketingOptIn,
    } = command;

    // 1. Find user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId);
    }

    // 2. Validate inputs
    if (language) this.inputValidator.validateLanguage(language);
    if (theme) this.inputValidator.validateTheme(theme);

    // 3. Update settings via aggregate method
    try {
      user.updateSettings({
        language,
        theme,
        emailNotifications,
        smsNotifications,
        pushNotifications,
        marketingOptIn,
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
