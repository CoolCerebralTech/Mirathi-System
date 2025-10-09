// ============================================================================
// wills.service.ts - Will Management Business Logic
// ============================================================================

import {
  Injectable as WillInjectable,
  ForbiddenException as WillForbidden,
  ConflictException as WillConflict,
  BadRequestException as WillBadRequest,
  Logger as WillLogger,
} from '@nestjs/common';
import {
  Will,
  WillStatus,
  BeneficiaryAssignment,
  UserRole as WillUserRole,
} from '@shamba/database';
import {
  CreateWillRequestDto,
  UpdateWillRequestDto,
  AssignBeneficiaryRequestDto,
  EventPattern as WillEventPattern,
  WillCreatedEvent,
  WillUpdatedEvent,
  HeirAssignedEvent,
} from '@shamba/common';
import { JwtPayload as WillJwtPayload } from '@shamba/auth';
import { MessagingService as WillMessagingService } from '@shamba/messaging';
import { WillsRepository } from '../repositories/wills.repository';
import { AssetsRepository as WillAssetsRepository } from '../repositories/assets.repository';

/**
 * WillsService - Will and succession planning business logic
 *
 * BUSINESS RULES:
 * - Only testator can manage their wills (unless admin)
 * - Only DRAFT wills can be edited
 * - Only one ACTIVE will per testator
 * - Total shares per asset cannot exceed 100%
 * - Can only assign assets owned by testator
 * - Cannot delete ACTIVE or EXECUTED wills
 */
@WillInjectable()
export class WillsService {
  private readonly logger = new WillLogger(WillsService.name);

  constructor(
    private readonly willsRepository: WillsRepository,
    private readonly assetsRepository: WillAssetsRepository,
    private readonly messagingService: WillMessagingService,
  ) {}

  // ========================================================================
  // CREATE OPERATIONS
  // ========================================================================

  async create(testatorId: string, data: CreateWillRequestDto): Promise<Will> {
    const will = await this.willsRepository.create({
      title: data.title,
      status: WillStatus.DRAFT,
      testator: { connect: { id: testatorId } },
    });

    // Publish event
    this.publishWillCreatedEvent(will);

    this.logger.log(`Will created: ${will.id} by testator ${testatorId}`);
    return will;
  }

  // ========================================================================
  // READ OPERATIONS
  // ========================================================================

  async findOne(
    willId: string,
    currentUser: WillJwtPayload,
  ): Promise<Will & { beneficiaryAssignments: BeneficiaryAssignment[] }> {
    const will = await this.willsRepository.findOneOrFail({ id: willId });

    // Authorization check
    if (will.testatorId !== currentUser.sub && currentUser.role !== WillUserRole.ADMIN) {
      throw new WillForbidden('You do not have permission to access this will');
    }

    return will;
  }

  async findForTestator(testatorId: string): Promise<Will[]> {
    return this.willsRepository.findByTestator(testatorId);
  }

  async findActiveWill(testatorId: string): Promise<Will | null> {
    return this.willsRepository.findActiveWill(testatorId);
  }

  // ========================================================================
  // UPDATE OPERATIONS
  // ========================================================================

  async update(
    willId: string,
    data: UpdateWillRequestDto,
    currentUser: WillJwtPayload,
  ): Promise<Will> {
    const will = await this.findOne(willId, currentUser);

    // Business rule: Only DRAFT wills can be edited
    if (will.status !== WillStatus.DRAFT) {
      throw new WillConflict('Only draft wills can be modified');
    }

    const updatedWill = await this.willsRepository.update(willId, data);

    this.publishWillUpdatedEvent(updatedWill);

    this.logger.log(`Will updated: ${willId} by user ${currentUser.sub}`);
    return updatedWill;
  }

  async activateWill(willId: string, currentUser: WillJwtPayload): Promise<Will> {
    const will = await this.findOne(willId, currentUser);

    // Business rule: Can only activate DRAFT wills
    if (will.status !== WillStatus.DRAFT) {
      throw new WillConflict('Can only activate draft wills');
    }

    // Business rule: Deactivate any existing active will
    const existingActiveWill = await this.willsRepository.findActiveWill(currentUser.sub);
    if (existingActiveWill && existingActiveWill.id !== willId) {
      await this.willsRepository.updateStatus(existingActiveWill.id, WillStatus.REVOKED);
      this.logger.log(`Previous active will revoked: ${existingActiveWill.id}`);
    }

    const activatedWill = await this.willsRepository.updateStatus(willId, WillStatus.ACTIVE);

    this.logger.log(`Will activated: ${willId} by testator ${currentUser.sub}`);
    return activatedWill;
  }

  async revokeWill(willId: string, currentUser: WillJwtPayload): Promise<Will> {
    const will = await this.findOne(willId, currentUser);

    // Business rule: Can only revoke ACTIVE wills
    if (will.status !== WillStatus.ACTIVE) {
      throw new WillConflict('Can only revoke active wills');
    }

    const revokedWill = await this.willsRepository.updateStatus(willId, WillStatus.REVOKED);

    this.logger.log(`Will revoked: ${willId} by testator ${currentUser.sub}`);
    return revokedWill;
  }

  // ========================================================================
  // BENEFICIARY ASSIGNMENT OPERATIONS
  // ========================================================================

  async addAssignment(
    willId: string,
    data: AssignBeneficiaryRequestDto,
    currentUser: WillJwtPayload,
  ): Promise<BeneficiaryAssignment> {
    const will = await this.findOne(willId, currentUser);

    // Business rule: Can only modify DRAFT wills
    if (will.status !== WillStatus.DRAFT) {
      throw new WillConflict('Assignments can only be added to draft wills');
    }

    // Business rule: Asset must belong to testator
    const asset = await this.assetsRepository.findOneOrFail({ id: data.assetId });
    if (asset.ownerId !== currentUser.sub) {
      throw new WillForbidden('Cannot assign an asset you do not own');
    }

    // Business rule: Check total shares don't exceed 100%
    if (data.sharePercent) {
      const totalShares = await this.willsRepository.getTotalShareForAsset(willId, data.assetId);
      if (totalShares + data.sharePercent > 100) {
        throw new WillBadRequest(
          `Total shares would exceed 100%. Current: ${totalShares}%, Attempting to add: ${data.sharePercent}%`,
        );
      }
    }

    // Business rule: Check for duplicate assignment
    const exists = await this.willsRepository.assignmentExists(
      willId,
      data.assetId,
      data.beneficiaryId,
    );
    if (exists) {
      throw new WillConflict('This beneficiary is already assigned to this asset');
    }

    const assignment = await this.willsRepository.addAssignment({
      will: { connect: { id: willId } },
      asset: { connect: { id: data.assetId } },
      beneficiary: { connect: { id: data.beneficiaryId } },
      sharePercent: data.sharePercent,
    });

    this.publishHeirAssignedEvent(will, assignment);

    this.logger.log(
      `Beneficiary assigned: ${data.beneficiaryId} to asset ${data.assetId} in will ${willId}`,
    );

    return assignment;
  }

  async removeAssignment(
    willId: string,
    assignmentId: string,
    currentUser: WillJwtPayload,
  ): Promise<void> {
    const will = await this.findOne(willId, currentUser);

    // Business rule: Can only modify DRAFT wills
    if (will.status !== WillStatus.DRAFT) {
      throw new WillConflict('Assignments can only be removed from draft wills');
    }

    await this.willsRepository.removeAssignment({ id: assignmentId });

    this.logger.log(`Assignment removed: ${assignmentId} from will ${willId}`);
  }

  // ========================================================================
  // DELETE OPERATIONS
  // ========================================================================

  async delete(willId: string, currentUser: WillJwtPayload): Promise<void> {
    const will = await this.findOne(willId, currentUser);

    // Business rule: Cannot delete ACTIVE or EXECUTED wills
    if (will.status === WillStatus.ACTIVE || will.status === WillStatus.EXECUTED) {
      throw new WillConflict(`Cannot delete ${will.status.toLowerCase()} wills. Revoke it first.`);
    }

    await this.willsRepository.delete(willId);

    this.logger.log(`Will deleted: ${willId} by user ${currentUser.sub}`);
  }

  // ========================================================================
  // EVENT PUBLISHING
  // ========================================================================

  private publishWillCreatedEvent(will: Will): void {
    const event: WillCreatedEvent = {
      type: WillEventPattern.WILL_CREATED,
      timestamp: new Date(),
      version: '1.0',
      source: 'succession-service',
      data: {
        willId: will.id,
        testatorId: will.testatorId,
        title: will.title,
        status: will.status,
      },
    };

    try {
      this.messagingService.emit(event);
    } catch (error) {
      this.logger.error(`Failed to publish WillCreatedEvent`, error);
    }
  }

  private publishWillUpdatedEvent(will: Will): void {
    const event: WillUpdatedEvent = {
      type: WillEventPattern.WILL_UPDATED,
      timestamp: new Date(),
      version: '1.0',
      source: 'succession-service',
      data: {
        willId: will.id,
        testatorId: will.testatorId,
        status: will.status,
      },
    };

    try {
      this.messagingService.emit(event);
    } catch (error) {
      this.logger.error(`Failed to publish WillUpdatedEvent`, error);
    }
  }

  private publishHeirAssignedEvent(will: Will, assignment: BeneficiaryAssignment): void {
    const event: HeirAssignedEvent = {
      type: WillEventPattern.HEIR_ASSIGNED,
      timestamp: new Date(),
      version: '1.0',
      source: 'succession-service',
      data: {
        willId: will.id,
        assetId: assignment.assetId,
        beneficiaryId: assignment.beneficiaryId,
        sharePercent: assignment.sharePercent ? Number(assignment.sharePercent) : null,
      },
    };

    try {
      this.messagingService.emit(event);
    } catch (error) {
      this.logger.error(`Failed to publish HeirAssignedEvent`, error);
    }
  }
}
