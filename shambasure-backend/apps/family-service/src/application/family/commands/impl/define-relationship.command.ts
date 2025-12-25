import { RelationshipType } from '../../../../domain/value-objects/family-enums.vo';
import { BaseCommand } from '../../../common/base/base.command';

/**
 * Command to explicitly define a relationship between two existing family members.
 *
 * Investor Note / Graph Integrity:
 * This command doesn't just draw a line; it establishes "Legal Truth".
 * It includes metadata for HOW we know this relationship exists (e.g., Birth Certificate vs. Oral Tradition),
 * which is crucial for the "Verification Level" of the family tree.
 */
export class DefineRelationshipCommand extends BaseCommand {
  public readonly familyId: string;
  public readonly fromMemberId: string;
  public readonly toMemberId: string;
  public readonly relationshipType: RelationshipType;

  // Relationship Dimensions
  public readonly isBiological: boolean;
  public readonly isLegal: boolean;
  public readonly isCustomary: boolean;

  // Evidence
  public readonly evidenceDocumentId?: string;

  // Additional relationship metadata
  public readonly relationshipStrength?: number;
  public readonly closenessIndex?: number;
  public readonly contactFrequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'RARELY' | 'NEVER';
  public readonly relationshipTerm?: string;
  public readonly notes?: string;

  constructor(props: {
    userId: string;
    familyId: string;
    fromMemberId: string;
    toMemberId: string;
    relationshipType: RelationshipType;

    // Relationship dimensions
    isBiological?: boolean;
    isLegal?: boolean;
    isCustomary?: boolean;

    // Evidence
    evidenceDocumentId?: string;

    // Additional metadata
    relationshipStrength?: number;
    closenessIndex?: number;
    contactFrequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'RARELY' | 'NEVER';
    relationshipTerm?: string;
    notes?: string;

    correlationId?: string;
  }) {
    super({ userId: props.userId, correlationId: props.correlationId });
    this.familyId = props.familyId;
    this.fromMemberId = props.fromMemberId;
    this.toMemberId = props.toMemberId;
    this.relationshipType = props.relationshipType;

    // Defaults: Most user-entered relationships are biological, legally asserted, and customary
    this.isBiological = props.isBiological ?? true;
    this.isLegal = props.isLegal ?? true;
    this.isCustomary = props.isCustomary ?? true;

    // Evidence
    this.evidenceDocumentId = props.evidenceDocumentId;

    // Additional metadata with defaults
    this.relationshipStrength = props.relationshipStrength;
    this.closenessIndex = props.closenessIndex;
    this.contactFrequency = props.contactFrequency;
    this.relationshipTerm = props.relationshipTerm;
    this.notes = props.notes;
  }

  public validate(): void {
    super.validate();

    if (!this.familyId) {
      throw new Error('Family ID is required');
    }
    if (!this.fromMemberId) {
      throw new Error('Origin Member ID is required');
    }
    if (!this.toMemberId) {
      throw new Error('Target Member ID is required');
    }
    if (!this.relationshipType) {
      throw new Error('Relationship Type is required');
    }

    // Validate relationship dimensions - at least one must be true
    if (!this.isBiological && !this.isLegal && !this.isCustomary) {
      throw new Error(
        'Relationship must have at least one dimension (biological, legal, or customary)',
      );
    }

    if (this.fromMemberId === this.toMemberId) {
      throw new Error('Cannot define a relationship to oneself.');
    }

    // Validate numerical ranges if provided
    if (this.relationshipStrength !== undefined) {
      if (this.relationshipStrength < 0 || this.relationshipStrength > 100) {
        throw new Error('Relationship strength must be between 0 and 100');
      }
    }

    if (this.closenessIndex !== undefined) {
      if (this.closenessIndex < 0 || this.closenessIndex > 100) {
        throw new Error('Closeness index must be between 0 and 100');
      }
    }
  }
}
