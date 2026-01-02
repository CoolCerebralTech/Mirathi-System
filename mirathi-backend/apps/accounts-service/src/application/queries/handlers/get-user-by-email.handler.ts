// src/application/queries/handlers/get-user-by-email.handler.ts
import { Inject, Injectable } from '@nestjs/common';

import { User } from '../../../domain/aggregates/user.aggregate';
import {
  USER_REPOSITORY_PORT,
  UserRepositoryPort,
} from '../../../domain/ports/user.repository.port';
import { UserNotFoundException } from '../../exceptions/user.exception';
import { GetUserByEmailQuery } from '../impl/get-user-by-email.query';

@Injectable()
export class GetUserByEmailHandler {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(query: GetUserByEmailQuery): Promise<User> {
    const user = await this.userRepository.findByEmail(query.email);
    if (!user) {
      throw new UserNotFoundException(query.email, 'email');
    }
    return user;
  }
}
