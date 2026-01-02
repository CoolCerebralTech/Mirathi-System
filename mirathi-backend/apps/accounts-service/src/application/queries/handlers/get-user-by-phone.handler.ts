// src/application/queries/handlers/get-user-by-phone.handler.ts
import { Inject, Injectable } from '@nestjs/common';

import { User } from '../../../domain/aggregates/user.aggregate';
import {
  USER_REPOSITORY_PORT,
  UserRepositoryPort,
} from '../../../domain/ports/user.repository.port';
import { UserNotFoundException } from '../../exceptions/user.exception';
import { GetUserByPhoneQuery } from '../impl/get-user-by-phone.query';

@Injectable()
export class GetUserByPhoneHandler {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(query: GetUserByPhoneQuery): Promise<User> {
    const user = await this.userRepository.findByPhoneNumber(query.phoneNumber);
    if (!user) {
      throw new UserNotFoundException(query.phoneNumber, 'phone');
    }
    return user;
  }
}
