import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import { FamilyAggregate } from '../../../../domain/aggregates/family.aggregate';
import { UniqueEntityID } from '../../../../domain/base/unique-entity-id';
import { FamilyRelationship } from '../../../../domain/entities/family-relationship.entity';
import type { IFamilyRepository } from '../../../../domain/interfaces/ifamily.repository';
import { FAMILY_REPOSITORY } from '../../../../domain/interfaces/ifamily.repository';
import { RelationshipType } from '../../../../domain/value-objects/family-enums.vo';
import { AppErrors } from '../../../common/application.error';
import { BaseCommandHandler } from '../../../common/base/base.command-handler';
import { Result } from '../../../common/result';
import { DefineRelationshipCommand } from '../impl/define-relationship.command';

@CommandHandler(DefineRelationshipCommand)
export class DefineRelationshipHandler
  extends BaseCommandHandler<DefineRelationshipCommand, FamilyAggregate, Result<string>>
  implements ICommandHandler<DefineRelationshipCommand, Result<string>>
{
  constructor(
    @Inject(FAMILY_REPOSITORY)
    protected readonly repository: IFamilyRepository,
    protected readonly eventBus: EventBus,
  ) {
    super(eventBus, repository as any, undefined);
  }

  async execute(command: DefineRelationshipCommand): Promise<Result<string>> {
    this.logger.log(`Defining relationship in family ${command.familyId}`);

    try {
      command.validate();

      // 1. Load Aggregate
      const family = await this.repository.findById(command.familyId);
      if (!family) {
        return Result.fail(new AppErrors.NotFoundError('Family', command.familyId));
      }

      // 2. Validate Members Exist
      const fromMemberId = new UniqueEntityID(command.fromMemberId);
      const toMemberId = new UniqueEntityID(command.toMemberId);

      const fromMember = family.getMember(fromMemberId);
      const toMember = family.getMember(toMemberId);

      if (!fromMember) {
        return Result.fail(new AppErrors.NotFoundError('Member (From)', command.fromMemberId));
      }
      if (!toMember) {
        return Result.fail(new AppErrors.NotFoundError('Member (To)', command.toMemberId));
      }

      // 3. Prepare Value Objects
      const relationshipId = new UniqueEntityID();
      const creatorId = new UniqueEntityID(command.userId);

      // Determine verification level based on evidence
      // Use the correct enum values for verificationMethod
      const verificationLevel = command.evidenceDocumentId
        ? 'PARTIALLY_VERIFIED' // Starts as partially verified if document attached
        : 'UNVERIFIED';

      // Use correct verification method values
      const verificationMethod = command.evidenceDocumentId
        ? 'DOCUMENT' // Changed from 'DOCUMENT_EVIDENCE' to 'DOCUMENT'
        : 'FAMILY_CONSENSUS'; // Changed from 'USER_DECLARED' to 'FAMILY_CONSENSUS'

      // 4. Create Relationship Entity
      const relationship = FamilyRelationship.create(
        {
          familyId: family.id,
          fromMemberId: fromMember.id,
          toMemberId: toMember.id,
          relationshipType: command.relationshipType,
          inverseRelationshipType: this.getInverseRelationship(command.relationshipType),

          // Relationship Dimensions
          isBiological: command.isBiological || false,
          isLegal: command.isLegal || false,
          isCustomary: command.isCustomary || true, // Defaulting to culturally recognized
          isSpiritual: false,

          // Temporal Aspects
          isActive: true,

          // Legal Context
          legalDocuments: command.evidenceDocumentId ? [command.evidenceDocumentId] : [],
          courtOrderId: undefined,

          // Verification Status
          verificationLevel: verificationLevel,
          verificationMethod: verificationMethod,
          verificationScore: command.evidenceDocumentId ? 50 : 10,
          lastVerifiedAt: undefined,
          verifiedBy: undefined,

          // Biological Details
          biologicalConfidence: undefined,
          dnaTestId: undefined,
          dnaMatchPercentage: undefined,

          // Legal Details
          adoptionOrderId: undefined,
          guardianshipOrderId: undefined,
          marriageId: undefined,

          // Customary Details
          customaryRecognition: command.isCustomary || true,
          clanRecognized: false,
          elderWitnesses: [],

          // Relationship Strength
          relationshipStrength: command.relationshipStrength || 50,
          closenessIndex: command.closenessIndex || 50,
          contactFrequency: command.contactFrequency || 'MONTHLY',

          // Dependency & Support
          isFinancialDependent: false,
          isCareDependent: false,
          dependencyLevel: undefined,
          supportProvided: undefined,

          // Inheritance Rights
          inheritanceRights: 'PENDING',
          inheritancePercentage: undefined,
          disinherited: false,
          disinheritanceReason: undefined,

          // Communication & Conflict
          communicationLanguage: undefined,
          hasConflict: false,
          conflictResolutionStatus: undefined,

          // Cultural Context
          relationshipTerm: command.relationshipTerm,
          culturalSignificance: undefined,
          taboos: [],

          // Metadata
          createdBy: creatorId,
          lastUpdatedBy: creatorId,
          notes: command.notes,

          // Audit
          isArchived: false,
        },
        relationshipId,
      );

      // 5. Apply to Aggregate
      family.defineRelationship(relationship);

      // 6. Save
      await this.repository.save(family);

      // 7. Publish Events
      this.publishEventsAndCommit(family);

      return Result.ok(relationshipId.toString());
    } catch (error) {
      if (error instanceof Error) {
        // Handle Graph Cycle Detection
        if (error.message.includes('Lineage cycle detected')) {
          return Result.fail(
            new AppErrors.ConflictError(
              'This relationship creates a lineage cycle (e.g. a child becoming their own ancestor).',
            ),
          );
        }
        // Handle Duplicates
        if (error.message.includes('Relationship already exists')) {
          return Result.fail(
            new AppErrors.ConflictError('This relationship has already been defined.'),
          );
        }
        // Handle validation errors from entity
        if (error.message.includes('must have at least one dimension')) {
          return Result.fail(
            new AppErrors.ValidationError(
              'Relationship must have at least one dimension (biological, legal, customary, or spiritual)',
            ),
          );
        }
      }
      return Result.fail(new AppErrors.UnexpectedError(error));
    }
  }

  /**
   * Helper to determine the semantic inverse of a relationship.
   * This helps the read-models navigate the graph backwards.
   */
  private getInverseRelationship(type: RelationshipType): RelationshipType {
    switch (type) {
      case RelationshipType.PARENT:
        return RelationshipType.CHILD;
      case RelationshipType.CHILD:
        return RelationshipType.PARENT;
      case RelationshipType.SPOUSE:
        return RelationshipType.SPOUSE;
      case RelationshipType.EX_SPOUSE:
        return RelationshipType.EX_SPOUSE;
      case RelationshipType.SIBLING:
        return RelationshipType.SIBLING;
      case RelationshipType.HALF_SIBLING:
        return RelationshipType.HALF_SIBLING;
      case RelationshipType.GRANDPARENT:
        return RelationshipType.GRANDCHILD;
      case RelationshipType.GRANDCHILD:
        return RelationshipType.GRANDPARENT;
      case RelationshipType.AUNT_UNCLE:
        return RelationshipType.NIECE_NEPHEW;
      case RelationshipType.NIECE_NEPHEW:
        return RelationshipType.AUNT_UNCLE;
      case RelationshipType.COUSIN:
        return RelationshipType.COUSIN;
      case RelationshipType.GUARDIAN:
        return RelationshipType.OTHER;
      default:
        return RelationshipType.OTHER;
    }
  }
}
