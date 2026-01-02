// src/presentation/mappers/user-identity-presenter.mapper.ts
import { Injectable } from '@nestjs/common';

import { UserIdentity } from '../../domain/entities';
import { UserIdentityOutput } from '../dtos/outputs';

/**
 * Maps UserIdentity entity to GraphQL output
 */
@Injectable()
export class UserIdentityPresenterMapper {
  toOutput(identity: UserIdentity): UserIdentityOutput {
    return {
      id: identity.id,
      provider: identity.provider,
      email: identity.email,
      isPrimary: identity.isPrimary,
      linkedAt: identity.linkedAt.value,
      lastUsedAt: identity.lastUsedAt.value,
    };
  }

  toOutputList(identities: UserIdentity[]): UserIdentityOutput[] {
    return identities.map((identity) => this.toOutput(identity));
  }
}
