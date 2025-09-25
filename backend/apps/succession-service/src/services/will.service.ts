import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { WillRepository } from '../repositories/will.repository';
import { AssetRepository } from '../repositories/asset.repository';
import { WillEntity, BeneficiaryAssignmentEntity } from '../entities/will.entity';
import { MessagingService } from '@shamba/messaging';
import { LoggerService } from '@shamba/observability';
import { 
  CreateWillDto, 
  UpdateWillDto, 
  WillResponseDto, 
  BeneficiaryAssignmentDto,
  WillStatus,
  EventType 
} from '@shamba/common';
import { JwtPayload } from '@shamba/auth';

@Injectable()
export class WillService {
  constructor(
    private willRepository: WillRepository,
    private assetRepository: AssetRepository,
    private messagingService: MessagingService,
    private logger: LoggerService,
  ) {}

  async createWill(createWillDto: CreateWillDto, testatorId: string): Promise<WillResponseDto> {
    this.logger.info('Creating new will', 'WillService', { testatorId });

    const willEntity = await this.willRepository.create(testatorId, createWillDto);

    // Publish will created event
    await this.messagingService.publish(EventType.WILL_CREATED, {
      willId: willEntity.id,
      testatorId: willEntity.testatorId,
      title: willEntity.title,
      status: willEntity.status,
      timestamp: new Date(),
    });

    this.logger.info('Will created successfully', 'WillService', { 
      willId: willEntity.id,
      testatorId,
    });

    return this.mapToResponseDto(willEntity);
  }

  async getWillById(willId: string, currentUser: JwtPayload): Promise<WillResponseDto> {
    this.logger.debug('Fetching will by ID', 'WillService', { willId });

    const willEntity = await this.willRepository.findById(willId);

    // Authorization: Only testator or admin can view will
    if (willEntity.testatorId !== currentUser.userId && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Access denied to this will');
    }

    return this.mapToResponseDto(willEntity);
  }

  async getWillsByTestator(testatorId: string, currentUser: JwtPayload): Promise<WillResponseDto[]> {
    this.logger.debug('Fetching wills for testator', 'WillService', { testatorId });

    // Authorization: Users can only view their own wills unless admin
    if (testatorId !== currentUser.userId && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Access denied to these wills');
    }

    const willEntities = await this.willRepository.findByTestatorId(testatorId);
    return willEntities.map(will => this.mapToResponseDto(will));
  }

  async updateWill(willId: string, updateWillDto: UpdateWillDto, currentUser: JwtPayload): Promise<WillResponseDto> {
    this.logger.info('Updating will', 'WillService', { willId });

    const existingWill = await this.willRepository.findById(willId);

    // Authorization: Only testator can update their will
    if (existingWill.testatorId !== currentUser.userId) {
      throw new ForbiddenException('Only the testator can update this will');
    }

    // Business rule: Only draft wills can be modified
    if (!existingWill.canBeModified()) {
      throw new ConflictException('Only draft wills can be modified');
    }

    const willEntity = await this.willRepository.update(willId, updateWillDto);

    this.logger.info('Will updated successfully', 'WillService', { willId });

    return this.mapToResponseDto(willEntity);
  }

  async activateWill(willId: string, currentUser: JwtPayload): Promise<WillResponseDto> {
    this.logger.info('Activating will', 'WillService', { willId });

    const existingWill = await this.willRepository.findById(willId);

    // Authorization: Only testator can activate their will
    if (existingWill.testatorId !== currentUser.userId) {
      throw new ForbiddenException('Only the testator can activate this will');
    }

    const willEntity = await this.willRepository.activateWill(willId);

    // Publish will activated event
    await this.messagingService.publish('will.activated', {
      willId: willEntity.id,
      testatorId: willEntity.testatorId,
      timestamp: new Date(),
    });

    this.logger.info('Will activated successfully', 'WillService', { willId });

    return this.mapToResponseDto(willEntity);
  }

  async revokeWill(willId: string, currentUser: JwtPayload): Promise<WillResponseDto> {
    this.logger.info('Revoking will', 'WillService', { willId });

    const existingWill = await this.willRepository.findById(willId);

    // Authorization: Only testator can revoke their will
    if (existingWill.testatorId !== currentUser.userId) {
      throw new ForbiddenException('Only the testator can revoke this will');
    }

    const willEntity = await this.willRepository.revokeWill(willId);

    // Publish will revoked event
    await this.messagingService.publish('will.revoked', {
      willId: willEntity.id,
      testatorId: willEntity.testatorId,
      timestamp: new Date(),
    });

    this.logger.info('Will revoked successfully', 'WillService', { willId });

    return this.mapToResponseDto(willEntity);
  }

  async deleteWill(willId: string, currentUser: JwtPayload): Promise<void> {
    this.logger.info('Deleting will', 'WillService', { willId });

    const existingWill = await this.willRepository.findById(willId);

    // Authorization: Only testator can delete their will
    if (existingWill.testatorId !== currentUser.userId && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Access denied to delete this will');
    }

    // Business rule: Only draft wills can be deleted
    if (!existingWill.canBeModified()) {
      throw new ConflictException('Only draft wills can be deleted');
    }

    await this.willRepository.delete(willId);

    this.logger.info('Will deleted successfully', 'WillService', { willId });
  }

  async addBeneficiary(
    willId: string,
    assignmentDto: BeneficiaryAssignmentDto,
    currentUser: JwtPayload,
  ): Promise<BeneficiaryAssignmentEntity> {
    this.logger.info('Adding beneficiary to will', 'WillService', { 
      willId,
      assetId: assignmentDto.assetId,
      beneficiaryId: assignmentDto.beneficiaryId,
    });

    const will = await this.willRepository.findById(willId);

    // Authorization: Only testator can modify their will
    if (will.testatorId !== currentUser.userId) {
      throw new ForbiddenException('Only the testator can modify this will');
    }

    // Business rule: Only draft wills can be modified
    if (!will.canBeModified()) {
      throw new ConflictException('Only draft wills can be modified');
    }

    // Verify asset belongs to testator
    const asset = await this.assetRepository.findById(assignmentDto.assetId);
    if (asset.ownerId !== currentUser.userId) {
      throw new ConflictException('Asset does not belong to the testator');
    }

    const assignment = await this.willRepository.addBeneficiaryAssignment(
      willId,
      assignmentDto.assetId,
      assignmentDto.beneficiaryId,
      assignmentDto.sharePercent,
    );

    this.logger.info('Beneficiary added successfully', 'WillService', { 
      willId,
      assignmentId: assignment.id,
    });

    return assignment;
  }

  async removeBeneficiary(assignmentId: string, currentUser: JwtPayload): Promise<void> {
    this.logger.info('Removing beneficiary assignment', 'WillService', { assignmentId });

    // We need to get the will through the assignment
    const assignment = await this.willRepository.removeBeneficiaryAssignment(assignmentId);

    // Note: The repository method throws if assignment doesn't exist
    // We need to modify the repository to return the assignment before deletion for authorization

    this.logger.info('Beneficiary assignment removed successfully', 'WillService', { assignmentId });
  }

  async getWillStats(testatorId: string, currentUser: JwtPayload): Promise<any> {
    this.logger.debug('Fetching will statistics', 'WillService', { testatorId });

    // Authorization: Users can only view their own stats unless admin
    if (testatorId !== currentUser.userId && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Access denied to these statistics');
    }

    const stats = await this.willRepository.getWillStats(testatorId);

    return {
      ...stats,
      generatedAt: new Date().toISOString(),
    };
  }

  async validateWillDistribution(willId: string): Promise<{
    isValid: boolean;
    totalDistribution: number;
    conflicts: string[];
    recommendations: string[];
  }> {
    const will = await this.willRepository.findById(willId);
    
    const validation = will.validateForActivation();
    const totalDistribution = will.getTotalAssetDistribution();

    const conflicts: string[] = [];
    const recommendations: string[] = [];

    if (will.hasDistributionConflicts()) {
      conflicts.push('One or more assets are over-allocated (total > 100%)');
      recommendations.push('Review and adjust share percentages for conflicting assets');
    }

    if (!will.isComplete()) {
      conflicts.push('Will has no beneficiary assignments');
      recommendations.push('Add at least one beneficiary assignment');
    }

    // Check for unassigned assets
    const testatorAssets = await this.assetRepository.findByOwnerId(will.testatorId);
    const assignedAssetIds = new Set(
      will.beneficiaryAssignments?.map(a => a.assetId) || []
    );

    const unassignedAssets = testatorAssets.filter(asset => !assignedAssetIds.has(asset.id));
    if (unassignedAssets.length > 0) {
      recommendations.push(`Consider assigning ${unassignedAssets.length} unassigned assets`);
    }

    return {
      isValid: validation.isValid,
      totalDistribution,
      conflicts: [...validation.errors, ...conflicts],
      recommendations,
    };
  }

  private mapToResponseDto(will: WillEntity): WillResponseDto {
    return {
      id: will.id,
      title: will.title,
      status: will.status,
      testatorId: will.testatorId,
      testator: will.testator ? {
        id: will.testator.id,
        email: will.testator.email,
        firstName: will.testator.firstName,
        lastName: will.testator.lastName,
        role: will.testator.role,
      } : undefined,
      beneficiaryAssignments: will.beneficiaryAssignments?.map(assignment => ({
        id: assignment.id,
        willId: assignment.willId,
        assetId: assignment.assetId,
        beneficiaryId: assignment.beneficiaryId,
        sharePercent: assignment.sharePercent,
        asset: assignment.asset ? {
          id: assignment.asset.id,
          name: assignment.asset.name,
          type: assignment.asset.type,
          description: assignment.asset.description,
        } : undefined,
        beneficiary: assignment.beneficiary ? {
          id: assignment.beneficiary.id,
          email: assignment.beneficiary.email,
          firstName: assignment.beneficiary.firstName,
          lastName: assignment.beneficiary.lastName,
        } : undefined,
      })) || [],
      createdAt: will.createdAt,
      updatedAt: will.updatedAt,
    };
  }
}