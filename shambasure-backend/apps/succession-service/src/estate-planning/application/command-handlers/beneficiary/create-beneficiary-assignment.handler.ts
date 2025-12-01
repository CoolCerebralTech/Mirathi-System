// command-handlers/beneficiary/create-beneficiary-assignment.handler.ts
import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { CreateBeneficiaryAssignmentCommand } from '../../commands/beneficiary/create-beneficiary-assignment.command';
import { BeneficiaryAssignmentRepository } from '../../../infrastructure/repositories/beneficiary-assignment.repository';
import { WillRepository } from '../../../infrastructure/repositories/will.repository';
import { AssetRepository } from '../../../infrastructure/repositories/asset.repository';
import { BeneficiaryAssignment } from '../../../domain/entities/beneficiary-assignment.entity';
import { WillNotFoundException } from '../../../domain/exceptions/will-not-found.exception';
import { AssetNotFoundException } from '../../../domain/exceptions/asset-not-found.exception';
import { BeneficiaryAlreadyExistsException } from '../../../domain/exceptions/beneficiary-already-exists.exception';
import { BeneficiaryEligibilityException } from '../../../domain/exceptions/beneficiary-eligibility.exception';
import { Logger } from '@nestjs/common';

@CommandHandler(CreateBeneficiaryAssignmentCommand)
export class CreateBeneficiaryAssignmentHandler implements ICommandHandler<CreateBeneficiaryAssignmentCommand> {
  private readonly logger = new Logger(CreateBeneficiaryAssignmentHandler.name);

  constructor(
    private readonly beneficiaryAssignmentRepository: BeneficiaryAssignmentRepository,
    private readonly willRepository: WillRepository,
    private readonly assetRepository: AssetRepository,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: CreateBeneficiaryAssignmentCommand): Promise<string> {
    const { willId, assetId, data, correlationId } = command;
    this.logger.debug(`Executing CreateBeneficiaryAssignmentCommand: ${correlationId}`);

    // 1. Validate Will exists and is editable
    const will = await this.willRepository.findById(willId);
    if (!will) {
      throw new WillNotFoundException(willId);
    }

    if (!will.isEditable()) {
      throw new Error('Will is not editable');
    }

    // 2. Validate Asset exists and belongs to testator
    const asset = await this.assetRepository.findById(assetId);
    if (!asset) {
      throw new AssetNotFoundException(assetId);
    }

    if (asset.ownerId !== will.testatorId) {
      throw new Error(`Asset ${assetId} not owned by testator ${will.testatorId}`);
    }

    // 3. Generate beneficiary assignment ID
    const beneficiaryAssignmentId = await this.beneficiaryAssignmentRepository.nextIdentity();

    // 4. Create Beneficiary Assignment based on type
    let beneficiaryAssignment: BeneficiaryAssignment;

    switch (data.beneficiaryType) {
      case 'USER':
        if (!data.userId) {
          throw new Error('User ID required for USER beneficiary type');
        }
        beneficiaryAssignment = BeneficiaryAssignment.createForUser(
          beneficiaryAssignmentId,
          willId,
          assetId,
          data.userId,
          data.relationshipCategory,
          data.specificRelationship,
          data.isDependant || false,
        );
        break;

      case 'FAMILY_MEMBER':
        if (!data.familyMemberId) {
          throw new Error('Family member ID required for FAMILY_MEMBER beneficiary type');
        }
        beneficiaryAssignment = BeneficiaryAssignment.createForFamilyMember(
          beneficiaryAssignmentId,
          willId,
          assetId,
          data.familyMemberId,
          data.relationshipCategory,
          data.specificRelationship,
          data.isDependant || false,
        );
        break;

      case 'EXTERNAL':
        if (!data.externalName) {
          throw new Error('External name required for EXTERNAL beneficiary type');
        }
        beneficiaryAssignment = BeneficiaryAssignment.createForExternal(
          beneficiaryAssignmentId,
          willId,
          assetId,
          data.externalName,
          data.relationshipCategory,
          data.externalContact,
          data.externalIdentification,
          data.externalAddress,
        );
        break;

      case 'CHARITY':
        if (!data.externalName) {
          throw new Error('Charity name required for CHARITY beneficiary type');
        }
        beneficiaryAssignment = BeneficiaryAssignment.createForCharity(
          beneficiaryAssignmentId,
          willId,
          assetId,
          data.externalName,
          data.externalIdentification,
          data.externalContact,
        );
        break;

      default:
        throw new Error(`Unknown beneficiary type: ${data.beneficiaryType}`);
    }

    // 5. Apply additional configuration
    if (data.bequestType) {
      if (data.sharePercent !== undefined) {
        beneficiaryAssignment.updateSharePercentage(data.sharePercent);
      } else if (data.specificAmount !== undefined) {
        beneficiaryAssignment.updateSpecificAmount(data.specificAmount);
      }
    }

    if (data.condition) {
      beneficiaryAssignment.addCondition(
        data.condition.conditionType,
        data.condition.conditionDetails,
        data.condition.conditionDeadline,
      );
    }

    if (data.priority) {
      // Priority would be set via a separate domain method if exists
    }

    if (data.bequestPriority) {
      // Bequest priority would be set via a separate domain method if exists
    }

    // 6. Save beneficiary assignment
    await this.beneficiaryAssignmentRepository.save(beneficiaryAssignment);

    // 7. Register with Will aggregate
    will.addBeneficiary(beneficiaryAssignmentId);
    await this.willRepository.save(will);

    this.logger.debug(`Beneficiary assignment created: ${beneficiaryAssignmentId}`);

    // 8. Publish events
    this.publisher.mergeObjectContext(beneficiaryAssignment).commit();
    this.publisher.mergeObjectContext(will).commit();

    return beneficiaryAssignmentId;
  }
}
