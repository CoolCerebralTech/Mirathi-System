// src/application/queries/handlers/get-user-by-id.handler.ts
import { Inject, Injectable } from '@nestjs/common';

import { User } from '../../../domain/aggregates/user.aggregate';
import {
  USER_REPOSITORY_PORT,
  UserRepositoryPort,
} from '../../../domain/ports/user.repository.port';
import { UserNotFoundException } from '../../exceptions/user.exception';
import { GetUserByIdQuery } from '../impl/get-user-by-id.query';

@Injectable()
export class GetUserByIdHandler {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(query: GetUserByIdQuery): Promise<User> {
    const user = await this.userRepository.findById(query.userId);
    if (!user) {
      throw new UserNotFoundException(query.userId);
    }
    return user;
  }
}
