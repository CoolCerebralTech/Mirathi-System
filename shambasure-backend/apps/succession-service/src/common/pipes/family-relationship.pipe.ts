import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { RelationshipType } from '@prisma/client';

/**
 * Validates family relationship fields in succession/family DTOs.
 * Enforces allowed values and hooks for Kenyan-law-specific rules.
 */
@Injectable()
export class FamilyRelationshipPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    const fieldName = metadata.data;

    if (metadata.type === 'body' && this.isRelationshipField(fieldName)) {
      return this.validate(value, fieldName);
    }

    return value;
  }

  /**
   * Determines if the field is a relationship-related field.
   */
  private isRelationshipField(fieldName?: string): boolean {
    if (!fieldName) return false;
    const relationshipFields = ['relationship', 'relationshipType', 'role', 'relationshipTo'];
    return relationshipFields.some((field) =>
      fieldName.toLowerCase().includes(field.toLowerCase()),
    );
  }

  /**
   * Validates the relationship value against allowed enums and Kenyan-specific rules.
   */
  private validate(value: unknown, fieldName: string): RelationshipType {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(`${fieldName} must be a non-empty string`);
    }

    const normalizedValue = value.trim().toUpperCase();

    // Safe enum value checking
    const validRelationship = Object.values(RelationshipType).find(
      (rel) => rel.toUpperCase() === normalizedValue,
    );

    if (!validRelationship) {
      const validRelationships = Object.values(RelationshipType).join(', ');
      throw new BadRequestException(`${fieldName} must be one of: ${validRelationships}`);
    }

    // Kenyan law-specific validations
    this.validateKenyanRelationshipRules(validRelationship, fieldName);

    return validRelationship;
  }

  /**
   * Placeholder for Kenyan-specific rules (customary marriages, guardianship limits, etc.)
   */
  private validateKenyanRelationshipRules(relationship: RelationshipType, fieldName: string): void {
    // Spouse relationship rules
    if (relationship === RelationshipType.SPOUSE) {
      // TODO: enforce polygamy limits if applicable
    }

    // Guardian relationship rules
    if (relationship === RelationshipType.GUARDIAN) {
      // TODO: enforce eligibility criteria, e.g., age, legal authority
    }

    // Could add additional validations for minor guardianship, stepchildren, etc.
  }
}
