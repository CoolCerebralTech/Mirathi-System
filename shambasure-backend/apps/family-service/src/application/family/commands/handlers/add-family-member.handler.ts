import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import { FamilyAggregate } from '../../../../domain/aggregates/family.aggregate';
import { UniqueEntityID } from '../../../../domain/base/unique-entity-id';
import { FamilyMember } from '../../../../domain/entities/family-member.entity';
import { FamilyRelationship } from '../../../../domain/entities/family-relationship.entity';
import type { IFamilyRepository } from '../../../../domain/interfaces/ifamily.repository';
import { FAMILY_REPOSITORY } from '../../../../domain/interfaces/ifamily.repository';
import { RelationshipType } from '../../../../domain/value-objects/family-enums.vo';
import { PersonName } from '../../../../domain/value-objects/person-name.vo';
import { AppErrors } from '../../../common/application.error';
import { BaseCommandHandler } from '../../../common/base/base.command-handler';
import { Result } from '../../../common/result';
import { AddFamilyMemberCommand } from '../impl/add-family-member.command';

@CommandHandler(AddFamilyMemberCommand)
export class AddFamilyMemberHandler
  extends BaseCommandHandler<AddFamilyMemberCommand, FamilyAggregate, Result<string>>
  implements ICommandHandler<AddFamilyMemberCommand, Result<string>>
{
  constructor(
    @Inject(FAMILY_REPOSITORY)
    protected readonly repository: IFamilyRepository,
    protected readonly eventBus: EventBus,
  ) {
    super(eventBus, repository as any, undefined);
  }

  async execute(command: AddFamilyMemberCommand): Promise<Result<string>> {
    this.logger.log(`Adding member to family ${command.familyId}`);

    try {
      command.validate();

      // 1. Load the Aggregate
      const family = await this.repository.findById(command.familyId);
      if (!family) {
        return Result.fail(new AppErrors.NotFoundError('Family', command.familyId));
      }

      // 2. Prepare Value Objects
      const creatorId = new UniqueEntityID(command.userId);
      const name = PersonName.create({
        firstName: command.firstName,
        lastName: command.lastName,
        middleName: command.middleName,
      });

      // 3. Create the Member Entity
      const member = FamilyMember.create({
        name: name,
        gender: command.gender,
        dateOfBirth: command.dateOfBirth,
        dateOfBirthEstimated: command.dateOfBirthEstimated || false,
        placeOfBirth: command.placeOfBirth,
        tribe: command.tribe, // Could default to family clan if null

        // Identity
        nationalId: command.nationalId
          ? ({ toString: () => command.nationalId } as any)
          : undefined,
        nationalIdVerified: false,

        // Defaults
        isAlive: true,
        isHeadOfFamily: false,
        isMarried: false,
        hasChildren: false,
        languages: [],
        medicalConditions: [],
        traditionalTitles: [],
        isMissing: false,
        hasDisability: false,
        isMentallyIncapacitated: false,
        isStudent: false,
        initiationRitesCompleted: false,

        // Audit
        createdBy: creatorId,
        lastUpdatedBy: creatorId,
        verificationStatus: 'UNVERIFIED',
        isArchived: false,
      });

      // 4. Add Member to Aggregate
      // This will throw if member ID already exists, ensuring uniqueness
      family.addMember(member);

      // 5. Handle "Smart Link" (Automatic Relationship Creation)
      if (command.relativeId && command.relationshipToRelative) {
        this.createRelationship(
          family,
          member.id,
          new UniqueEntityID(command.relativeId),
          command.relationshipToRelative,
          creatorId,
        );
      }

      // 6. Save (Atomic Transaction: Member + Relationship)
      await this.repository.save(family);

      // 7. Publish Events
      this.publishEventsAndCommit(family);

      return Result.ok(member.id.toString());
    } catch (error) {
      // Map domain errors to application errors where possible
      if (error instanceof Error && error.message.includes('Member already exists')) {
        return Result.fail(new AppErrors.ConflictError(error.message));
      }
      return Result.fail(new AppErrors.UnexpectedError(error));
    }
  }

  /**
   * Helper to encapsulate the relationship direction logic
   */
  private createRelationship(
    family: FamilyAggregate,
    newMemberId: UniqueEntityID,
    relativeId: UniqueEntityID,
    type: RelationshipType,
    creatorId: UniqueEntityID,
  ): void {
    const relative = family.getMember(relativeId);
    if (!relative) {
      throw new AppErrors.NotFoundError('Relative Member', relativeId.toString());
    }

    // Define the relationship (New Member -> Relative)
    const relationship = FamilyRelationship.create({
      familyId: family.id,
      fromMemberId: relativeId, // Parent
      toMemberId: newMemberId, // Child
      relationshipType: this.getInverse(type), // If type is CHILD, from->to is PARENT
      inverseRelationshipType: type, // CHILD

      // Defaults - since this is user-declared without verification
      isBiological: false, // Not confirmed as biological
      isLegal: false, // Not legally established
      isCustomary: false, // Not customary recognized yet
      isSpiritual: false, // Not spiritual relationship
      isActive: true,

      // Legal Context
      legalDocuments: [],
      courtOrderId: undefined,

      // Verification - using 'FAMILY_CONSENSUS' for user-declared relationships
      verificationLevel: 'UNVERIFIED',
      verificationMethod: 'FAMILY_CONSENSUS',
      verificationScore: 10, // Low score for user-declared

      // Customary Details
      customaryRecognition: false,
      clanRecognized: false,
      elderWitnesses: [],

      // Relationship Strength
      relationshipStrength: 30, // Moderate initial strength
      closenessIndex: 50,
      contactFrequency: 'MONTHLY',

      // Dependency & Support
      isFinancialDependent: false,
      isCareDependent: false,
      dependencyLevel: undefined,
      supportProvided: undefined,

      // Inheritance Rights
      inheritanceRights: 'PENDING',
      disinherited: false,

      // Communication & Conflict
      hasConflict: false,
      conflictResolutionStatus: undefined,

      // Audit
      createdBy: creatorId,
      lastUpdatedBy: creatorId,
      isArchived: false,
    });

    family.defineRelationship(relationship);
  }

  /**
   * Simple helper to map "I am your Child" -> "You are my Parent"
   * This logic ensures the graph edges are directional and semantically correct.
   */
  private getInverse(type: RelationshipType): RelationshipType {
    switch (type) {
      case RelationshipType.CHILD:
        return RelationshipType.PARENT;
      case RelationshipType.PARENT:
        return RelationshipType.CHILD;
      case RelationshipType.SPOUSE:
        return RelationshipType.SPOUSE;
      case RelationshipType.SIBLING:
        return RelationshipType.SIBLING;
      default:
        return RelationshipType.OTHER;
    }
  }
}
