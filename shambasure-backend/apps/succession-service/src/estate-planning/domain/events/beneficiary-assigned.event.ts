import { BeneficiaryType, KenyanRelationshipCategory } from '@prisma/client';

/**
 * Event: BeneficiaryAssignedEvent
 *
 * Triggered whenever a new beneficiary assignment is created.
 * Entity-level event payload is simplified to a single generic
 * identifier depending on type: userId, familyMemberId, or externalName.
 */
export class BeneficiaryAssignedEvent {
  constructor(
    public readonly beneficiaryAssignmentId: string,
    public readonly willId: string,
    public readonly assetId: string,
    public readonly beneficiaryType: BeneficiaryType,

    /**
     * A single identifier depending on the beneficiary type:
     * - USER           → userId
     * - FAMILY_MEMBER  → familyMemberId
     * - EXTERNAL       → externalName
     * - CHARITY        → charityName
     */
    public readonly beneficiaryIdentifier: string | null,

    public readonly relationshipCategory: KenyanRelationshipCategory,

    public readonly timestamp: Date = new Date(),
  ) {}
}
