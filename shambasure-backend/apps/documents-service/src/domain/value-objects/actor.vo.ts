import { UserId } from './user-id.vo';

/**
 * Represents the user performing an action.
 * It encapsulates the user's ID and their roles,
 * allowing the domain to make decisions based on capabilities
 * rather than hardcoded role strings.
 */
export class Actor {
  public readonly id: UserId;
  public readonly roles: Set<string>;

  constructor(id: UserId, roles: string[]) {
    this.id = id;
    this.roles = new Set(roles.map((role) => role.toUpperCase())); // Normalize roles
  }

  /**
   * Checks if the actor has a specific role.
   * @param role The role to check (e.g., 'ADMIN').
   * @returns True if the actor has the role.
   */
  hasRole(role: string): boolean {
    return this.roles.has(role.toUpperCase());
  }

  /**
   * Checks if the actor has the capability to verify documents.
   * This centralizes the business rule for who can perform verification.
   * @returns True if the actor is a VERIFIER or an ADMIN.
   */
  isVerifier(): boolean {
    return this.hasRole('VERIFIER') || this.hasRole('ADMIN');
  }

  /**
   * Checks if the actor has administrative privileges.
   * @returns True if the actor is an ADMIN.
   */
  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }
}
