import {
  PipeTransform,
  Injectable,
  Inject,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { RelationshipType, MarriageStatus } from '@prisma/client';
import { legalRulesConfig } from '../config/legal-rules.config';

export interface RelationshipValidationContext {
  familyId?: string;
  existingMembers?: Array<{
    id: string;
    relationship: RelationshipType;
    isDeceased: boolean;
    isMinor: boolean;
  }>;

  existingMarriages?: Array<{
    marriageType: MarriageStatus;
    isActive: boolean;
  }>;

  personAge?: number;
  personDateOfBirth?: Date;
  personIsMinor?: boolean;

  relationshipTargetId?: string;
  relationshipTargetAge?: number;

  isTestator?: boolean;
  isBeneficiary?: boolean;
  isExecutor?: boolean;
  isWitness?: boolean;

  hasLegalCapacity?: boolean;
  hasFelonyConvictions?: boolean;
}

export interface RelationshipValidationResult {
  isValid: boolean;
  normalizedValue: RelationshipType;
  warnings?: string[];
  suggestions?: string[];
  legalReferences?: string[];
}

@Injectable()
export class FamilyRelationshipPipe implements PipeTransform<string, RelationshipType> {
  private readonly PRIMARY_DEPENDANTS: Set<RelationshipType> = new Set([
    RelationshipType.SPOUSE,
    RelationshipType.CHILD,
    RelationshipType.ADOPTED_CHILD,
  ]);

  private readonly SECONDARY_DEPENDANTS: Set<RelationshipType> = new Set([
    RelationshipType.STEPCHILD,
    RelationshipType.PARENT,
    RelationshipType.SIBLING,
  ]);

  private readonly MINOR_RELATIONSHIPS: Set<RelationshipType> = new Set([
    RelationshipType.CHILD,
    RelationshipType.ADOPTED_CHILD,
    RelationshipType.STEPCHILD,
    RelationshipType.GRANDCHILD,
  ]);

  private readonly SPOUSAL_RELATIONSHIPS: Set<RelationshipType> = new Set([
    RelationshipType.SPOUSE,
    RelationshipType.EX_SPOUSE,
  ]);

  constructor(
    @Inject(legalRulesConfig.KEY)
    private readonly rules: ConfigType<typeof legalRulesConfig>,
    private readonly context?: RelationshipValidationContext,
  ) {}

  public transform(value: string, metadata: ArgumentMetadata): RelationshipType {
    const fieldName = metadata.data || 'relationship';

    try {
      const result = this.validateWithContext(value, fieldName, this.context);

      if (result.warnings && result.warnings.length > 0) {
        console.warn(`Relationship validation warnings for ${fieldName}:`, result.warnings);
      }

      return result.normalizedValue;
    } catch (error: unknown) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new BadRequestException(`Failed to validate ${fieldName}: ${errorMessage}`);
    }
  }

  public validateWithContext(
    value: unknown,
    fieldName: string,
    context?: RelationshipValidationContext,
  ): RelationshipValidationResult {
    const normalizedValue = this.validateBasic(value, fieldName);

    this.validateKenyanRelationshipRules(normalizedValue, fieldName, context);

    const warnings: string[] = [];
    const suggestions: string[] = [];
    const legalReferences: string[] = [];

    if (context) {
      this.validateMarriageRules(normalizedValue, context, warnings, legalReferences);
      this.validateGuardianEligibility(normalizedValue, context, warnings, legalReferences);
      this.validateDependantStatus(normalizedValue, context, warnings, legalReferences);
      this.validateAgeConsistency(normalizedValue, context, warnings, suggestions);
      this.validateWitnessEligibility(normalizedValue, context, warnings, legalReferences);
    }

    return {
      isValid: true,
      normalizedValue,
      warnings: warnings.length > 0 ? warnings : undefined,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
      legalReferences: legalReferences.length > 0 ? legalReferences : undefined,
    };
  }

  private validateBasic(value: unknown, fieldName: string): RelationshipType {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(
        `${fieldName} must be a non-empty string representing a valid relationship type.`,
      );
    }

    const normalizedValue = value.trim().toUpperCase().replace(/\s+/g, '_');

    const validRelationship = Object.values(RelationshipType).find(
      (rel) => rel.toUpperCase() === normalizedValue,
    );

    if (!validRelationship) {
      const validRelationships = Object.values(RelationshipType)
        .map((r) => this.formatRelationshipName(r))
        .join(', ');

      throw new BadRequestException(
        `Invalid ${fieldName}: "${value}". Must be one of: ${validRelationships}`,
      );
    }

    return validRelationship;
  }

  private validateKenyanRelationshipRules(
    relationship: RelationshipType,
    fieldName: string,
    context?: RelationshipValidationContext,
  ): void {
    if (this.SPOUSAL_RELATIONSHIPS.has(relationship)) {
      this.validateSpouseRelationship(relationship, fieldName, context);
    }

    if (this.MINOR_RELATIONSHIPS.has(relationship)) {
      this.validateChildRelationship(relationship, fieldName, context);
    }

    if (relationship === RelationshipType.GUARDIAN) {
      this.validateGuardianRelationship(fieldName, context);
    }

    if (relationship === RelationshipType.PARENT) {
      this.validateParentRelationship(fieldName, context);
    }
  }

  private validateSpouseRelationship(
    relationship: RelationshipType,
    fieldName: string,
    context?: RelationshipValidationContext,
  ): void {
    if (!context?.existingMarriages) return;

    const activeMarriages = context.existingMarriages.filter((m) => m.isActive);

    const hasCivilMarriage = activeMarriages.some((m) => m.marriageType === MarriageStatus.MARRIED);

    if (
      hasCivilMarriage &&
      activeMarriages.length >= 1 &&
      relationship === RelationshipType.SPOUSE
    ) {
      throw new BadRequestException(
        `Cannot add spouse: Civil marriage is monogamous by law (Marriage Act 2014). ` +
          `An active civil marriage already exists.`,
      );
    }

    const islamicMarriages = activeMarriages.filter(
      (m) => m.marriageType === MarriageStatus.CUSTOMARY_MARRIAGE,
    );

    const maxSpouses = this.rules.familyLaw?.islamic?.maxSpouses ?? 4;

    if (islamicMarriages.length >= maxSpouses && relationship === RelationshipType.SPOUSE) {
      throw new BadRequestException(
        `Cannot add spouse: Islamic marriage allows maximum ${maxSpouses} wives. ` +
          `This limit has been reached.`,
      );
    }

    if (context.personAge !== undefined) {
      const minAge = this.rules.familyLaw?.customary?.minAge ?? 18;
      if (context.personAge < minAge) {
        throw new BadRequestException(
          `Cannot add spouse: Person must be at least ${minAge} years old to marry ` +
            `(Marriage Act 2014, Section 4).`,
        );
      }
    }
  }

  private validateChildRelationship(
    relationship: RelationshipType,
    fieldName: string,
    context?: RelationshipValidationContext,
  ): void {
    if (
      relationship === RelationshipType.CHILD ||
      relationship === RelationshipType.ADOPTED_CHILD
    ) {
      const equalTreatment = this.rules.familyLaw?.generalRules?.equalTreatmentOfChildren ?? true;
      if (context?.isBeneficiary && !equalTreatment) {
        throw new BadRequestException(
          `All children (biological, adopted, born out of wedlock) must receive equal treatment ` +
            `per Law of Succession Act Section 3(2).`,
        );
      }
    }

    if (relationship === RelationshipType.STEPCHILD) {
      if (!context?.existingMarriages?.some((m) => m.isActive)) {
        throw new BadRequestException(
          `Cannot add stepchild: Stepchild relationship requires an active marriage to the child's parent.`,
        );
      }
    }
  }

  private validateGuardianRelationship(
    fieldName: string,
    context?: RelationshipValidationContext,
  ): void {
    if (!context) return;

    const minAge = this.rules.executorRules?.eligibility?.minAge ?? 18;

    if (context.personAge !== undefined && context.personAge < minAge) {
      throw new BadRequestException(
        `Guardian must be at least ${minAge} years old. ` + `Current age: ${context.personAge}.`,
      );
    }

    if (context.hasLegalCapacity === false) {
      throw new BadRequestException(
        `Guardian must have legal mental capacity to act as a guardian.`,
      );
    }

    if (context.hasFelonyConvictions === true) {
      throw new BadRequestException(
        `Guardian cannot have felony convictions (Children Act 2001, Section 158).`,
      );
    }

    if (context.personIsMinor) {
      throw new BadRequestException(
        `Guardian cannot be a minor. Must be of legal age (18 years or older).`,
      );
    }
  }

  private validateParentRelationship(
    fieldName: string,
    context?: RelationshipValidationContext,
  ): void {
    if (!context) return;

    if (context.personAge !== undefined && context.relationshipTargetAge !== undefined) {
      const ageDifference = context.personAge - context.relationshipTargetAge;

      if (ageDifference < 15) {
        throw new BadRequestException(
          `Parent must be at least 15 years older than child. ` +
            `Current age difference: ${ageDifference} years.`,
        );
      }

      if (ageDifference > 70) {
        console.warn(
          `Warning: Unusual age difference (${ageDifference} years) between parent and child. ` +
            `Please verify the relationship.`,
        );
      }
    }
  }

  private validateMarriageRules(
    relationship: RelationshipType,
    context: RelationshipValidationContext,
    warnings: string[],
    legalReferences: string[],
  ): void {
    if (!this.SPOUSAL_RELATIONSHIPS.has(relationship)) return;

    const activeMarriages = context.existingMarriages?.filter((m) => m.isActive) || [];

    if (activeMarriages.length > 0 && relationship === RelationshipType.SPOUSE) {
      warnings.push(
        `Adding spouse to existing marriage(s). Polygamous distribution rules will apply ` +
          `(Section 40 of Law of Succession Act).`,
      );
      legalReferences.push('Law of Succession Act, Section 40 (Polygamous Distribution)');
    }

    const proofRequired = this.rules.familyLaw?.generalRules?.proofOfMarriageRequired ?? true;
    if (proofRequired) {
      warnings.push(`Marriage certificate or proof of marriage required for legal recognition.`);
      legalReferences.push('Marriage Act 2014, Section 45 (Registration)');
    }
  }

  private validateGuardianEligibility(
    relationship: RelationshipType,
    context: RelationshipValidationContext,
    warnings: string[],
    legalReferences: string[],
  ): void {
    if (relationship !== RelationshipType.GUARDIAN) return;

    const kenyanResident = this.rules.executorRules?.eligibility?.kenyanResident ?? false;
    if (kenyanResident) {
      warnings.push(`Guardian should be a Kenyan resident for effective guardianship duties.`);
      legalReferences.push('Children Act 2001, Section 158 (Guardian Requirements)');
    }

    if (context.isTestator) {
      warnings.push(
        `Testamentary guardian appointment requires court confirmation to be effective.`,
      );
      legalReferences.push('Law of Succession Act, Section 56 (Guardian Appointment)');
    }
  }

  private validateDependantStatus(
    relationship: RelationshipType,
    context: RelationshipValidationContext,
    warnings: string[],
    legalReferences: string[],
  ): void {
    const isPrimaryDependant = this.PRIMARY_DEPENDANTS.has(relationship);
    const isSecondaryDependant = this.SECONDARY_DEPENDANTS.has(relationship);

    if (isPrimaryDependant) {
      warnings.push(
        `This person is a primary dependant under Law of Succession Act ` +
          `and entitled to reasonable provision.`,
      );
      legalReferences.push('Law of Succession Act, Section 26-29 (Dependant Provision)');
    }

    if (isSecondaryDependant && context.personIsMinor) {
      warnings.push(
        `Minor secondary dependant may be entitled to provision if they were ` +
          `maintained by the deceased.`,
      );
      legalReferences.push('Law of Succession Act, Section 29 (Other Dependants)');
    }

    if (relationship === RelationshipType.PARENT || relationship === RelationshipType.SIBLING) {
      const proofRequired =
        this.rules.dependantProvision?.dependantDefinition?.proofRequired ?? true;
      if (proofRequired) {
        warnings.push(`Proof of dependency required for parents/siblings to claim as dependants.`);
      }
    }
  }

  private validateAgeConsistency(
    relationship: RelationshipType,
    context: RelationshipValidationContext,
    warnings: string[],
    suggestions: string[],
  ): void {
    if (!context.personAge) return;

    const ageOfMajority = this.rules.assetDistribution?.minorProtection?.ageOfMajority ?? 18;
    const isMinorByAge = context.personAge < ageOfMajority;

    if (this.MINOR_RELATIONSHIPS.has(relationship) && !isMinorByAge) {
      warnings.push(
        `Person is above age of majority (${ageOfMajority} years) but assigned a child relationship type.`,
      );
    }

    if (isMinorByAge && context.isBeneficiary) {
      warnings.push(
        `Minor beneficiary detected. Assets will be held in trust until age ${ageOfMajority}.`,
      );
      suggestions.push(
        `Consider appointing a trustee or guardian to manage inheritance until maturity.`,
      );
    }

    if (relationship === RelationshipType.GUARDIAN && isMinorByAge) {
      throw new BadRequestException(
        `Guardian must be of legal age (${ageOfMajority} years or older). Current age: ${context.personAge}.`,
      );
    }
  }

  private validateWitnessEligibility(
    relationship: RelationshipType,
    context: RelationshipValidationContext,
    warnings: string[],
    legalReferences: string[],
  ): void {
    if (!context.isWitness) return;

    if (this.PRIMARY_DEPENDANTS.has(relationship)) {
      throw new BadRequestException(
        `${this.formatRelationshipName(relationship)} cannot be a witness to the will. ` +
          `Witnesses must not be beneficiaries or spouses of beneficiaries ` +
          `(Law of Succession Act, Section 11).`,
      );
    }

    if (context.isBeneficiary) {
      throw new BadRequestException(
        `Beneficiaries cannot witness the will. This invalidates their bequest ` +
          `(Law of Succession Act, Section 11).`,
      );
    }

    legalReferences.push('Law of Succession Act, Section 11 (Will Formalities)');
  }

  private formatRelationshipName(relationship: RelationshipType): string {
    return relationship
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  public isLegalDependant(relationship: RelationshipType): boolean {
    return this.PRIMARY_DEPENDANTS.has(relationship) || this.SECONDARY_DEPENDANTS.has(relationship);
  }

  public isEligibleHeir(relationship: RelationshipType): boolean {
    const eligibleTypes: Set<RelationshipType> = new Set([
      RelationshipType.SPOUSE,
      RelationshipType.CHILD,
      RelationshipType.ADOPTED_CHILD,
      RelationshipType.STEPCHILD,
      RelationshipType.PARENT,
      RelationshipType.SIBLING,
      RelationshipType.GRANDCHILD,
      RelationshipType.GRANDPARENT,
      RelationshipType.NIECE_NEPHEW,
      RelationshipType.AUNT_UNCLE,
      RelationshipType.COUSIN,
    ]);

    return eligibleTypes.has(relationship);
  }

  public getSuccessionPriority(relationship: RelationshipType): number {
    const priorityMap = new Map<RelationshipType, number>([
      [RelationshipType.SPOUSE, 1],
      [RelationshipType.CHILD, 2],
      [RelationshipType.ADOPTED_CHILD, 2],
      [RelationshipType.STEPCHILD, 3],
      [RelationshipType.PARENT, 4],
      [RelationshipType.SIBLING, 5],
      [RelationshipType.HALF_SIBLING, 5],
      [RelationshipType.GRANDPARENT, 6],
      [RelationshipType.GRANDCHILD, 7],
      [RelationshipType.AUNT_UNCLE, 8],
      [RelationshipType.NIECE_NEPHEW, 8],
      [RelationshipType.COUSIN, 9],
      [RelationshipType.OTHER, 99],
      [RelationshipType.EX_SPOUSE, 99],
      [RelationshipType.GUARDIAN, 99],
    ]);

    return priorityMap.get(relationship) ?? 99;
  }

  public validateRelationshipSet(
    relationships: Array<{ id: string; relationship: RelationshipType }>,
  ): { isValid: boolean; conflicts: string[] } {
    const conflicts: string[] = [];

    const spouses = relationships.filter((r) => this.SPOUSAL_RELATIONSHIPS.has(r.relationship));

    const maxSpouses = this.rules.familyLaw?.islamic?.maxSpouses ?? 4;
    if (spouses.length > maxSpouses) {
      conflicts.push(
        `Too many spouse relationships (${spouses.length}). ` + `Maximum allowed: ${maxSpouses}`,
      );
    }

    const duplicates = new Map<string, number>();
    relationships.forEach((r) => {
      const key = `${r.id}-${r.relationship}`;
      duplicates.set(key, (duplicates.get(key) || 0) + 1);
    });

    duplicates.forEach((count, key) => {
      if (count > 1) {
        conflicts.push(`Duplicate relationship detected: ${key}`);
      }
    });

    return {
      isValid: conflicts.length === 0,
      conflicts,
    };
  }
}
