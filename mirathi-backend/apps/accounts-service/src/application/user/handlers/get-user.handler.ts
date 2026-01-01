// src/application/user/handlers/get-user.handler.ts
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { UserNotFoundError } from '../../../domain/errors/domain.errors';
import type { UserRepositoryPort } from '../../../domain/ports/user.repository.port';
import { GetUserQuery } from '../queries/get-user.query';

export interface UserResponse {
  id: string;
  role: string;
  status: string;
  displayName: string;
  email?: string;
  phoneNumber?: string;
  isPhoneVerified: boolean;
  hasCompletedOnboarding: boolean;
  createdAt: string;
  updatedAt: string;
}

@QueryHandler(GetUserQuery)
export class GetUserHandler implements IQueryHandler<GetUserQuery> {
  constructor(private readonly userRepository: UserRepositoryPort) {}

  async execute(query: GetUserQuery): Promise<UserResponse> {
    const { userId } = query.payload;

    // 1. Load user aggregate
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    // 2. Map to response (this is application layer mapping)
    return this.mapToResponse(user);
  }

  private mapToResponse(user: any): UserResponse {
    return {
      id: user.id,
      role: user.role,
      status: user.status,
      displayName: user.displayName,
      email: user.primaryIdentity?.email,
      phoneNumber: user.phoneNumber?.value,
      isPhoneVerified: user.isPhoneVerified,
      hasCompletedOnboarding: user.hasCompletedOnboarding,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
