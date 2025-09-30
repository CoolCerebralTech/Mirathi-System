import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@shamba/database';
import { UserQueryDto, EventPattern, UserCreatedEvent } from '@shamba/common';
import { UsersRepository } from '../repositories/users.repository';
import { MessagingService } from '@shamba/messaging';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly messagingService: MessagingService,
  ) {}

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOneOrFail({ id });
    return user;
  }

  async findMany(query: UserQueryDto): Promise<{ users: User[]; total: number }> {
    return this.usersRepository.findMany(query);
  }

  async delete(id: string): Promise<User> {
    // Ensure user exists before trying to delete
    await this.usersRepository.findOneOrFail({ id });
    return this.usersRepository.delete(id);
    // Note: A 'user.deleted' event would be published here if needed.
  }

  // This is an example of an internal method that might be called by the AuthService
  async createUserForRegistration(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const user = await this.usersRepository.create(data);

    const event: UserCreatedEvent = {
      type: EventPattern.USER_CREATED,
      timestamp: new Date(),
      version: '1.0',
      source: 'accounts-service',
      data: {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
    this.messagingService.emit(event);

    return user;
  }
}