// estate-planning/application/services/beneficiary.service.ts
import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { BequestType, BequestConditionType, DistributionStatus } from '@prisma/client';
import { BeneficiaryRepositoryInterface } from '../../domain/interfaces/beneficiary.repository.interface';
import { WillRepositoryInterface } from '../../domain/interfaces/will.repository.interface';
import { AssetRepositoryInterface } from '../../domain/interfaces/asset.repository.interface';
import { SharePercentage } from '../../domain/value-objects/share-percentage.vo';
import { AssetValue } from '../../domain/value-objects/asset-value.vo';
import { AssignBeneficiaryCommand } from '../commands/assign-beneficiary.command';
import { UpdateBeneficiaryCommand } from '../commands/update-beneficiary.command';
import { GetBeneficiariesQuery } from '../queries/get-beneficiaries.query';
import { BeneficiaryResponseDto } from '../dto/response/beneficiary.response.dto';

@Injectable()
export class BeneficiaryService {
  private readonly logger = new Logger(BeneficiaryService.name);

  constructor(
    private readonly beneficiaryRepository: BeneficiaryRepositoryInterface,
    private readonly willRepository: WillRepositoryInterface,
    private readonly assetRepository: AssetRepositoryInterface
  ) {}

  async assignBeneficiary(assignBeneficiaryDto: any, willId: string, testatorId: string): Promise<BeneficiaryResponseDto> {
    try {
      const willAggregate = await this.willRepository.findById(willId);
      
      if (!willAggregate) {
        throw new NotFoundException(`Will ${willId} not found`);
      }

      if (willAggregate.getWill().getTestatorId() !== testatorId) {
        throw new BadRequestException('Access denied to this will');
      }

      if (!willAggregate.getWill().canBeModified()) {
        throw new BadRequestException('Cannot assign beneficiaries to will in its current status');
      }

      // Validate asset exists in will
      const asset = willAggregate.getAsset(assignBeneficiaryDto.assetId);
      if (!asset) {
        throw new BadRequestException(`Asset ${assignBeneficiaryDto.assetId} not found in will`);
      }

      // Validate no duplicate assignments
      const isDuplicate = await this.beneficiaryRepository.validateNoDuplicateAssignments(
        willId,
        assignBeneficiaryDto.assetId,
        assignBeneficiaryDto.beneficiaryId || assignBeneficiaryDto.externalBeneficiary?.name
      );

      if (!isDuplicate) {
        throw new BadRequestException('Beneficiary already assigned to this asset');
      }

      // Create beneficiary entity based on type
      const beneficiaryId = `beneficiary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      let beneficiary;

      switch (assignBeneficiaryDto.beneficiaryType) {
        case 'USER':
          beneficiary = {
            getId: () => beneficiaryId,
            getWillId: () => willId,
            getAssetId: () => assignBeneficiaryDto.assetId,
            getBeneficiaryInfo: () => ({
              userId: assignBeneficiaryDto.beneficiaryId,
              relationship: assignBeneficiaryDto.relationship
            }),
            getBequestType: () => assignBeneficiaryDto.bequestType,
            getPriority: () => assignBeneficiaryDto.priority || 1
          } as any;
          break;

        case 'FAMILY_MEMBER':
          beneficiary = {
            getId: () => beneficiaryId,
            getWillId: () => willId,
            getAssetId: () => assignBeneficiaryDto.assetId,
            getBeneficiaryInfo: () => ({
              familyMemberId: assignBeneficiaryDto.beneficiaryId
            }),
            getBequestType: () => assignBeneficiaryDto.bequestType,
            getPriority: () => assignBeneficiaryDto.priority || 1
          } as any;
          break;

        case 'EXTERNAL':
          if (!assignBeneficiaryDto.externalBeneficiary?.name) {
            throw new BadRequestException('External beneficiary name is required');
          }
          beneficiary = {
            getId: () => beneficiaryId,
            getWillId: () => willId,
            getAssetId: () => assignBeneficiaryDto.assetId,
            getBeneficiaryInfo: () => ({
              externalName: assignBeneficiaryDto.externalBeneficiary.name,
              externalContact: assignBeneficiaryDto.externalBeneficiary.contact,
              relationship: assignBeneficiaryDto.relationship
            }),
            getBequestType: () => assignBeneficiaryDto.bequestType,
            getPriority: () => assignBeneficiaryDto.priority || 1
          } as any;
          break;

        default:
          throw new BadRequestException('Invalid beneficiary type');
      }

      // Set additional properties
      Object.assign(beneficiary, {
        sharePercentage: assignBeneficiaryDto.sharePercentage 
          ? new SharePercentage(assignBeneficiaryDto.sharePercentage)
          : null,
        specificAmount: assignBeneficiaryDto.specificAmount
          ? new AssetValue(assignBeneficiaryDto.specificAmount, 'KES')
          : null,
        conditionType: assignBeneficiaryDto.conditionType || BequestConditionType.NONE,
        conditionDetails: assignBeneficiaryDto.conditionDetails,
        distributionStatus: DistributionStatus.PENDING
      });

      // Add beneficiary to will aggregate
      willAggregate.assignBeneficiary(beneficiary);

      await this.willRepository.save(willAggregate);

      return this.mapToBeneficiaryResponseDto(beneficiary);
    } catch (error) {
      this.logger.error(`Failed to assign beneficiary to will ${willId}:`, error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Could not assign beneficiary: ${error.message}`);
    }
  }

  async updateBeneficiaryAssignment(
    beneficiaryId: string, 
    updateBeneficiaryDto: any, 
    willId: string, 
    testatorId: string
  ): Promise<BeneficiaryResponseDto> {
    try {
      const willAggregate = await this.willRepository.findById(willId);
      
      if (!willAggregate) {
        throw new NotFoundException(`Will ${willId} not found`);
      }

      if (willAggregate.getWill().getTestatorId() !== testatorId) {
        throw new BadRequestException('Access denied to this will');
      }

      if (!willAggregate.getWill().canBeModified()) {
        throw new BadRequestException('Cannot update beneficiaries in will in its current status');
      }

      const beneficiary = willAggregate.getBeneficiary(beneficiaryId);
      if (!beneficiary) {
        throw new NotFoundException(`Beneficiary ${beneficiaryId} not found in will`);
      }

      // Update beneficiary properties
      if (updateBeneficiaryDto.sharePercentage !== undefined) {
        beneficiary.updateShare(new SharePercentage(updateBeneficiaryDto.sharePercentage));
      }

      if (updateBeneficiaryDto.specificAmount !== undefined) {
        beneficiary.updateSpecificAmount(new AssetValue(updateBeneficiaryDto.specificAmount, 'KES'));
      }

      if (updateBeneficiaryDto.conditionType !== undefined) {
        beneficiary.addCondition(
          updateBeneficiaryDto.conditionType,
          updateBeneficiaryDto.conditionDetails
        );
      }

      if (updateBeneficiaryDto.priority !== undefined) {
        beneficiary.updatePriority(updateBeneficiaryDto.priority);
      }

      await this.willRepository.save(willAggregate);

      return this.mapToBeneficiaryResponseDto(beneficiary);
    } catch (error) {
      this.logger.error(`Failed to update beneficiary ${beneficiaryId}:`, error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Could not update beneficiary: ${error.message}`);
    }
  }

  async getBeneficiaries(willId: string, testatorId: string, assetId?: string, distributionStatus?: DistributionStatus): Promise<{
    beneficiaries: BeneficiaryResponseDto[];
    summary: {
      totalBeneficiaries: number;
      totalValueAllocated: number;
      byBequestType: Record<string, number>;
    };
  }> {
    try {
      const willAggregate = await this.willRepository.findById(willId);
      
      if (!willAggregate) {
        throw new NotFoundException(`Will ${willId} not found`);
      }

      if (willAggregate.getWill().getTestatorId() !== testatorId) {
        throw new BadRequestException('Access denied to this will');
      }

      let beneficiaries = willAggregate.getAllBeneficiaries();

      // Filter by asset if specified
      if (assetId) {
        beneficiaries = beneficiaries.filter(b => b.getAssetId() === assetId);
      }

      // Filter by distribution status if specified
      if (distributionStatus) {
        beneficiaries = beneficiaries.filter(b => b.getDistributionStatus() === distributionStatus);
      }

      // Calculate summary
      const byBequestType: Record<string, number> = {};
      let totalValueAllocated = 0;

      for (const beneficiary of beneficiaries) {
        const bequestType = beneficiary.getBequestType();
        byBequestType[bequestType] = (byBequestType[bequestType] || 0) + 1;

        // Calculate allocated value (simplified)
        const asset = willAggregate.getAsset(beneficiary.getAssetId());
        if (asset) {
          const assetValue = asset.getCurrentValue().getAmount();
          if (beneficiary.getBequestType() === BequestType.PERCENTAGE && beneficiary.getSharePercentage()) {
            totalValueAllocated += assetValue * (beneficiary.getSharePercentage().getValue() / 100);
          } else if (beneficiary.getBequestType() === BequestType.SPECIFIC && beneficiary.getSpecificAmount()) {
            totalValueAllocated += beneficiary.getSpecificAmount().getAmount();
          }
        }
      }

      const beneficiaryDtos = beneficiaries.map(beneficiary => this.mapToBeneficiaryResponseDto(beneficiary));

      return {
        beneficiaries: beneficiaryDtos,
        summary: {
          totalBeneficiaries: beneficiaries.length,
          totalValueAllocated,
          byBequestType
        }
      };
    } catch (error) {
      this.logger.error(`Failed to get beneficiaries for will ${willId}:`, error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Could not retrieve beneficiaries: ${error.message}`);
    }
  }

  async removeBeneficiary(beneficiaryId: string, willId: string, testatorId: string): Promise<void> {
    try {
      const willAggregate = await this.willRepository.findById(willId);
      
      if (!willAggregate) {
        throw new NotFoundException(`Will ${willId} not found`);
      }

      if (willAggregate.getWill().getTestatorId() !== testatorId) {
        throw new BadRequestException('Access denied to this will');
      }

      if (!willAggregate.getWill().canBeModified()) {
        throw new BadRequestException('Cannot remove beneficiaries from will in its current status');
      }

      willAggregate.removeBeneficiary(beneficiaryId);

      await this.willRepository.save(willAggregate);
    } catch (error) {
      this.logger.error(`Failed to remove beneficiary ${beneficiaryId} from will ${willId}:`, error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Could not remove beneficiary: ${error.message}`);
    }
  }

  async updateDistributionStatus(
    beneficiaryIds: string[], 
    status: DistributionStatus, 
    notes?: string
  ): Promise<void> {
    try {
      await this.beneficiaryRepository.bulkUpdateDistributionStatus(beneficiaryIds, status, notes);
    } catch (error) {
      this.logger.error(`Failed to update distribution status for beneficiaries:`, error);
      throw new BadRequestException(`Could not update distribution status: ${error.message}`);
    }
  }

  async getBeneficiaryDistributionSummary(willId: string): Promise<{
    assetSummaries: Array<{
      assetId: string;
      assetName: string;
      totalAllocated: number;
      beneficiaryCount: number;
      conditionalCount: number;
    }>;
    overallSummary: {
      totalAssets: number;
      totalBeneficiaries: number;
      totalConditionalBequests: number;
      totalValueAllocated: number;
    };
  }> {
    try {
      const willAggregate = await this.willRepository.findById(willId);
      if (!willAggregate) {
        throw new NotFoundException(`Will ${willId} not found`);
      }

      const assets = willAggregate.getAllAssets();
      const assetSummaries = [];

      let totalBeneficiaries = 0;
      let totalConditionalBequests = 0;
      let totalValueAllocated = 0;

      for (const asset of assets) {
        const beneficiaries = willAggregate.getBeneficiariesForAsset(asset.getId());
        const conditionalCount = beneficiaries.filter(b => b.isConditional()).length;
        
        const allocatedPercentage = beneficiaries
          .filter(b => b.getBequestType() === BequestType.PERCENTAGE)
          .reduce((sum, b) => sum + (b.getSharePercentage()?.getValue() || 0), 0);

        assetSummaries.push({
          assetId: asset.getId(),
          assetName: asset.getName(),
          totalAllocated: allocatedPercentage,
          beneficiaryCount: beneficiaries.length,
          conditionalCount
        });

        totalBeneficiaries += beneficiaries.length;
        totalConditionalBequests += conditionalCount;
        totalValueAllocated += asset.getCurrentValue().getAmount() * (allocatedPercentage / 100);
      }

      return {
        assetSummaries,
        overallSummary: {
          totalAssets: assets.length,
          totalBeneficiaries,
          totalConditionalBequests,
          totalValueAllocated
        }
      };
    } catch (error) {
      this.logger.error(`Failed to get distribution summary for will ${willId}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Could not retrieve distribution summary: ${error.message}`);
    }
  }

  private mapToBeneficiaryResponseDto(beneficiary: any): BeneficiaryResponseDto {
    const beneficiaryInfo = beneficiary.getBeneficiaryInfo();
    
    return {
      id: beneficiary.getId(),
      willId: beneficiary.getWillId(),
      assetId: beneficiary.getAssetId(),
      beneficiaryInfo: {
        userId: beneficiaryInfo.userId,
        familyMemberId: beneficiaryInfo.familyMemberId,
        externalName: beneficiaryInfo.externalName,
        externalContact: beneficiaryInfo.externalContact,
        relationship: beneficiaryInfo.relationship
      },
      bequestType: beneficiary.getBequestType(),
      sharePercentage: beneficiary.getSharePercentage()?.getValue(),
      specificAmount: beneficiary.getSpecificAmount()?.getAmount(),
      conditionType: beneficiary.getConditionType(),
      conditionDetails: beneficiary.getConditionDetails(),
      alternateBeneficiaryId: beneficiary.getAlternateBeneficiaryId(),
      alternateSharePercentage: beneficiary.getAlternateShare()?.getValue(),
      distributionStatus: beneficiary.getDistributionStatus(),
      distributedAt: beneficiary.getDistributedAt(),
      distributionNotes: beneficiary.getDistributionNotes(),
      priority: beneficiary.getPriority(),
      createdAt: beneficiary.getCreatedAt(),
      updatedAt: beneficiary.getUpdatedAt(),
      beneficiaryName: beneficiary.getBeneficiaryName ? beneficiary.getBeneficiaryName() : 
        (beneficiaryInfo.externalName || `Beneficiary ${beneficiary.getId().substring(0, 8)}`),
      isConditional: beneficiary.isConditional ? beneficiary.isConditional() : 
        (beneficiary.getConditionType() !== BequestConditionType.NONE),
      hasAlternate: beneficiary.hasAlternate ? beneficiary.hasAlternate() : 
        (!!beneficiary.getAlternateBeneficiaryId()),
      isDistributed: beneficiary.isDistributed ? beneficiary.isDistributed() : 
        (beneficiary.getDistributionStatus() === DistributionStatus.COMPLETED)
    };
  }
}