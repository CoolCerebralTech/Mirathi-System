import { Injectable } from '@nestjs/common';
import { User } from '../../../3_domain/models/user.model';
import { Email, Password } from '../../../3_domain/value-objects';
import { UserCreateData, UserEntity, UserUpdateData } from '../entities/user.entity';

/**
 * Persistence Mapper for the User aggregate.
 * Translates between the User domain model and Prisma's entity format.
 */
@Injectable()
export class UserPersistenceMapper {
  toDomain(entity: UserEntity): User {
    return User.fromPersistence({
      id: entity.id,
      email: Email.create(entity.email),
      password: Password.fromStoredHash(entity.password),
      firstName: entity.firstName,
      lastName: entity.lastName,
      role: entity.role,
      isActive: entity.isActive,
      lastLoginAt: entity.lastLoginAt,
      loginAttempts: entity.loginAttempts,
      lockedUntil: entity.lockedUntil,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    });
  }

  toCreatePersistence(user: User): UserCreateData {
    return {
      id: user.id,
      email: user.email.getValue(),
      password: user.password.getValue(),
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      // Note: The profile is created in its own repository transaction
    };
  }

  toUpdatePersistence(user: User): UserUpdateData {
    return {
      email: user.email.getValue(),
      password: user.password.getValue(),
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      loginAttempts: user.loginAttempts,
      lockedUntil: user.lockedUntil,
      lastLoginAt: user.lastLoginAt,
      updatedAt: new Date(),
      deletedAt: user.deletedAt,
    };
  }
}
