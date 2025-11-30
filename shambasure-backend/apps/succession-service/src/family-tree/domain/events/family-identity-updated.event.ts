import { IEvent } from '@nestjs/cqrs';

/**
 * Event emitted when Kenyan clan identity is updated.
 *
 * Legal Context:
 * - Customary Law: Clan system determines inheritance rights
 * - Section 40: Customary succession rules apply based on clan
 *
 * Triggers:
 * - Update family tree visualization
 * - Recalculate traditional inheritance weights
 * - Notify family members of identity changes
 */
export class FamilyIdentityUpdatedEvent implements IEvent {
  constructor(
    public readonly familyId: string,
    public readonly clanName: string,
    public readonly subClan: string | null,
    public readonly ancestralHome: string | null,
    public readonly familyTotem: string | null,
  ) {}
}
