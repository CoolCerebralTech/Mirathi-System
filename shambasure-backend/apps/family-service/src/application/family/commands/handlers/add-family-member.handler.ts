import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import { FamilyAggregate } from '../../../../domain/aggregates/family.aggregate';
import { UniqueEntityID } from '../../../../domain/base/unique-entity-id';
import { ValueObjectValidationError } from '../../../../domain/base/value-object';
import { FamilyMember } from '../../../../domain/entities/family-member.entity';
import {
  FamilyRelationship,
  FamilyRelationshipProps,
} from '../../../../domain/entities/family-relationship.entity';
import type { IFamilyRepository } from '../../../../domain/interfaces/ifamily.repository';
import { FAMILY_REPOSITORY } from '../../../../domain/interfaces/ifamily.repository';
import { RelationshipType } from '../../../../domain/value-objects/family-enums.vo';
import { KenyanNationalId } from '../../../../domain/value-objects/kenyan-identity.vo';
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

      // Digital Lawyer: Validate National ID with specific error handling
      let nationalIdVO: KenyanNationalId | undefined;
      if (command.nationalId) {
        try {
          // Assuming constructor validates (SimpleValueObject pattern)
          // If your SimpleValueObject uses a static create(), switch this to: KenyanNationalId.create(command.nationalId)
          nationalIdVO = new KenyanNationalId(command.nationalId);
        } catch (e) {
          if (e instanceof ValueObjectValidationError) {
            return Result.fail(new AppErrors.ValidationError(e.message));
          }
          throw e;
        }
      }

      // 3. Create the Member Entity
      const member = FamilyMember.create({
        name: name,
        gender: command.gender,
        dateOfBirth: command.dateOfBirth,
        dateOfBirthEstimated: command.dateOfBirthEstimated || false,
        placeOfBirth: command.placeOfBirth,
        tribe: command.tribe,

        // Identity
        nationalId: nationalIdVO,
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
        this.createSmartRelationship(
          family,
          member.id,
          new UniqueEntityID(command.relativeId),
          command.relationshipToRelative,
          command.isBiological,
          creatorId,
        );
      }

      // 6. Save (Atomic Transaction: Member + Relationship)
      await this.repository.save(family);

      // 7. Publish Events
      this.publishEventsAndCommit(family);

      return Result.ok(member.id.toString());
    } catch (error) {
      if (error instanceof Error && error.message.includes('Member already exists')) {
        return Result.fail(new AppErrors.ConflictError(error.message));
      }
      if (error instanceof Error && error.message.includes('Lineage cycle')) {
        return Result.fail(new AppErrors.ValidationError(error.message));
      }
      return Result.fail(new AppErrors.UnexpectedError(error));
    }
  }

  /**
   * Encapsulates logic to ensure the graph edge is directed correctly.
   * Now strictly compliant with FamilyRelationshipProps.
   */
  private createSmartRelationship(
    family: FamilyAggregate,
    newMemberId: UniqueEntityID,
    relativeId: UniqueEntityID,
    userStatedRelationship: RelationshipType,
    isBiological: boolean,
    creatorId: UniqueEntityID,
  ): void {
    const relative = family.getMember(relativeId);
    if (!relative) {
      throw new AppErrors.NotFoundError('Relative Member', relativeId.toString());
    }

    // Determine directionality
    let fromId = relativeId;
    let toId = newMemberId;
    let type = RelationshipType.OTHER;
    let inverseType = RelationshipType.OTHER;

    switch (userStatedRelationship) {
      case RelationshipType.CHILD:
        // Relative is PARENT of New Member
        type = RelationshipType.PARENT;
        inverseType = RelationshipType.CHILD;
        break;
      case RelationshipType.PARENT:
        // New Member is PARENT of Relative
        fromId = newMemberId;
        toId = relativeId;
        type = RelationshipType.PARENT;
        inverseType = RelationshipType.CHILD;
        break;
      case RelationshipType.SIBLING:
        type = RelationshipType.SIBLING;
        inverseType = RelationshipType.SIBLING;
        break;
      default:
        type = RelationshipType.OTHER;
        inverseType = RelationshipType.OTHER;
    }

    // Construct valid Props with Defaults
    const relationshipProps: FamilyRelationshipProps = {
      familyId: family.id,
      fromMemberId: fromId,
      toMemberId: toId,
      relationshipType: type,
      inverseRelationshipType: inverseType,

      // Dimensions
      isBiological: isBiological,
      isLegal: false,
      isCustomary: false,
      isSpiritual: false,
      isActive: true,

      // Legal Context
      legalDocuments: [],
      verificationLevel: 'UNVERIFIED',
      verificationMethod: 'FAMILY_CONSENSUS',
      // FIX: Provide default score for user-declared relationship (Low confidence initially)
      verificationScore: 10,

      // Customary Context
      customaryRecognition: false,
      clanRecognized: false,
      elderWitnesses: [],

      // Strength & Quality
      // FIX: Provide default strength (Neutral/Average)
      relationshipStrength: 50,
      closenessIndex: 50,
      contactFrequency: 'WEEKLY',

      // Dependency
      isFinancialDependent: false,
      isCareDependent: false,

      // Inheritance
      inheritanceRights: 'PENDING',
      disinherited: false,

      // Conflict
      hasConflict: false,

      // Metadata
      createdBy: creatorId,
      lastUpdatedBy: creatorId,
      isArchived: false,
    };

    // Use Factory Method
    const relationship = FamilyRelationship.create(relationshipProps);

    // Add to Aggregate
    family.defineRelationship(relationship);
  }
}
