// src/domain/invariants/user.invariants.ts
import { User } from '../aggregates/user.aggregate';

/**
 * Business invariants that must always hold true for the User aggregate
 */
export class UserInvariants {
  /**
   * Invariant 1: User must have at least one identity
   */
  static mustHaveAtLeastOneIdentity(user: User): void {
    if (user.identities.length === 0) {
      throw new Error('User must have at least one identity');
    }
  }

  /**
   * Invariant 2: Only one identity can be primary
   */
  static onlyOnePrimaryIdentity(user: User): void {
    const primaryCount = user.identities.filter((id) => id.isPrimary).length;
    if (primaryCount > 1) {
      throw new Error('User can only have one primary identity');
    }
  }

  /**
   * Invariant 3: Deleted users cannot be modified
   */
  static cannotModifyDeletedUser(user: User, action: string): void {
    // Allow 'restore' and 'delete' (idempotent) to pass through
    if (user.isDeleted && action !== 'restore' && action !== 'delete') {
      throw new Error(`Cannot ${action} a deleted user`);
    }
  }

  /**
   * Invariant 4: Suspended users cannot perform most actions
   */
  static cannotModifySuspendedUser(user: User, action: string): void {
    if (user.isSuspended) {
      throw new Error(`Cannot ${action} while user is suspended`);
    }
  }

  /**
   * Invariant 5: Phone verification requires phone number
   */
  static phoneVerificationRequiresPhone(user: User): void {
    if (user.profile?.phoneVerified && !user.profile.phoneNumber) {
      throw new Error('Phone cannot be verified without a phone number');
    }
  }

  /**
   * Invariant 6: Profile and settings must belong to the user
   */
  static profileAndSettingsBelongToUser(user: User): void {
    if (user.profile && user.profile.userId !== user.id) {
      throw new Error('Profile does not belong to this user');
    }

    if (user.settings && user.settings.userId !== user.id) {
      throw new Error('Settings do not belong to this user');
    }
  }

  /**
   * Invariant 7: Active users must have profile and settings
   */
  static activeUserMustHaveProfileAndSettings(user: User): void {
    if (user.isActive) {
      if (!user.profile) {
        throw new Error('Active user must have a profile');
      }
      if (!user.settings) {
        throw new Error('Active user must have settings');
      }
    }
  }

  /**
   * Validate all invariants
   */
  static validateAll(user: User, action: string = 'perform action'): void {
    this.mustHaveAtLeastOneIdentity(user);
    this.onlyOnePrimaryIdentity(user);
    this.cannotModifyDeletedUser(user, action);
    this.profileAndSettingsBelongToUser(user);
    this.phoneVerificationRequiresPhone(user);
    this.activeUserMustHaveProfileAndSettings(user);

    // Only check suspension for non-admin actions
    if (!action.includes('admin') && !action.includes('suspend') && !action.includes('unsuspend')) {
      this.cannotModifySuspendedUser(user, action);
    }
  }
}
