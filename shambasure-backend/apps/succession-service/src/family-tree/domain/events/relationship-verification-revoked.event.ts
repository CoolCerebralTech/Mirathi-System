/**
 * Relationship Verification Revoked Event
 *
 * Emitted when a previously verified family relationship has its verification revoked.
 * This typically happens when:
 * - Fraudulent documents are discovered
 * - Court order is overturned
 * - Verification was done in error
 * - Legal challenge succeeds
 *
 * Legal Context:
 * - Section 3 (Legitimacy): Verification challenges
 * - Children Act (2022): Adoption order revocation
 * - Law of Succession Act: Relationship validity for inheritance
 *
 * Impact:
 * - Inheritance rights may be affected
 * - Succession planning must be recalculated
 * - Family tree accuracy compromised
 * - Legal notices may be required
 */
export class RelationshipVerificationRevokedEvent {
  constructor(
    public readonly relationshipId: string,
    public readonly familyId: string,
    public readonly revocationReason: string,
    public readonly revokedBy: string, // User ID who revoked
    public readonly previousVerificationMethod: string | null,
    public readonly previousVerifiedBy: string | null,
    public readonly revokedAt: Date = new Date(),
  ) {
    if (!relationshipId?.trim()) {
      throw new Error('Relationship ID is required for verification revocation event');
    }
    if (!familyId?.trim()) {
      throw new Error('Family ID is required for verification revocation event');
    }
    if (!revocationReason?.trim()) {
      throw new Error('Revocation reason is required');
    }
    if (!revokedBy?.trim()) {
      throw new Error('RevokedBy user ID is required');
    }
  }

  /**
   * Event name for event bus routing
   */
  static readonly eventName = 'relationship.verification.revoked';

  /**
   * Gets the event payload for persistence/messaging
   */
  toPayload(): Record<string, any> {
    return {
      relationshipId: this.relationshipId,
      familyId: this.familyId,
      revocationReason: this.revocationReason,
      revokedBy: this.revokedBy,
      previousVerificationMethod: this.previousVerificationMethod,
      previousVerifiedBy: this.previousVerifiedBy,
      revokedAt: this.revokedAt.toISOString(),
      eventName: RelationshipVerificationRevokedEvent.eventName,
    };
  }

  /**
   * Creates event from stored payload
   */
  static fromPayload(payload: Record<string, any>): RelationshipVerificationRevokedEvent {
    return new RelationshipVerificationRevokedEvent(
      payload.relationshipId,
      payload.familyId,
      payload.revocationReason,
      payload.revokedBy,
      payload.previousVerificationMethod,
      payload.previousVerifiedBy,
      new Date(payload.revokedAt),
    );
  }

  /**
   * Returns a human-readable description of the event
   */
  toString(): string {
    return `Relationship ${this.relationshipId} verification revoked by ${this.revokedBy}: ${this.revocationReason}`;
  }
}
