// application/services/asset.service.ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { AssetOwnershipType, AssetType, KenyanCounty } from '@prisma/client';

import {
  BulkUpdateAssetsValuationCommand,
  CreateAssetCommand,
  DeleteAssetCommand,
  MarkAssetMatrimonialCommand,
  RemoveAssetEncumbranceCommand,
  RemoveAssetMatrimonialStatusCommand,
  SetAssetEncumbranceCommand,
  SetAssetLifeInterestCommand,
  TerminateAssetLifeInterestCommand,
  TransferAssetCommand,
  UpdateAssetCommand,
  UpdateAssetIdentificationCommand,
  UpdateAssetLocationCommand,
  UpdateAssetOwnershipCommand,
  UpdateAssetValuationCommand,
  VerifyAssetCommand,
} from '../commands/assets';
import {
  CreateAssetDto,
  SetAssetEncumbranceDto,
  SetAssetLifeInterestDto,
  UpdateAssetDto,
  UpdateAssetValuationDto,
  VerifyAssetDto,
} from '../dtos/requests';
import { GPSCoordinatesDto } from '../dtos/requests/create-asset.dto';
import { AssetResponseDto, AssetSummaryResponseDto } from '../dtos/responses';
import {
  CheckAssetTransferabilityQuery,
  GetAssetEncumbrancesQuery,
  GetAssetQuery,
  GetAssetSummaryQuery,
  GetAssetValuationHistoryQuery,
  GetEstateAssetsSummaryQuery,
  ListAssetsQuery,
  SearchAssetsQuery,
} from '../queries/assets';

@Injectable()
export class AssetService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // Command Methods (Write Operations)

  async createAsset(
    estatePlanningId: string,
    createAssetDto: CreateAssetDto,
    correlationId?: string,
  ): Promise<string> {
    try {
      const command = new CreateAssetCommand(estatePlanningId, createAssetDto, correlationId);
      return await this.commandBus.execute(command);
    } catch (error) {
      this.handleServiceError(error, 'Failed to create asset');
    }
  }

  async updateAsset(
    assetId: string,
    estatePlanningId: string,
    updateAssetDto: UpdateAssetDto,
    correlationId?: string,
  ): Promise<void> {
    try {
      const command = new UpdateAssetCommand(
        assetId,
        estatePlanningId,
        updateAssetDto,
        correlationId,
      );
      await this.commandBus.execute(command);
    } catch (error) {
      this.handleServiceError(error, 'Failed to update asset');
    }
  }

  async updateAssetValuation(
    assetId: string,
    estatePlanningId: string,
    updateValuationDto: UpdateAssetValuationDto,
    correlationId?: string,
  ): Promise<void> {
    try {
      const command = new UpdateAssetValuationCommand(
        assetId,
        estatePlanningId,
        updateValuationDto,
        correlationId,
      );
      await this.commandBus.execute(command);
    } catch (error) {
      this.handleServiceError(error, 'Failed to update asset valuation');
    }
  }

  async setAssetEncumbrance(
    assetId: string,
    estatePlanningId: string,
    encumbranceDto: SetAssetEncumbranceDto,
    correlationId?: string,
  ): Promise<void> {
    try {
      const command = new SetAssetEncumbranceCommand(
        assetId,
        estatePlanningId,
        encumbranceDto,
        correlationId,
      );
      await this.commandBus.execute(command);
    } catch (error) {
      this.handleServiceError(error, 'Failed to set asset encumbrance');
    }
  }

  async removeAssetEncumbrance(
    assetId: string,
    estatePlanningId: string,
    reason: string,
    correlationId?: string,
  ): Promise<void> {
    try {
      const command = new RemoveAssetEncumbranceCommand(
        assetId,
        estatePlanningId,
        reason,
        correlationId,
      );
      await this.commandBus.execute(command);
    } catch (error) {
      this.handleServiceError(error, 'Failed to remove asset encumbrance');
    }
  }

  async setAssetLifeInterest(
    assetId: string,
    estatePlanningId: string,
    lifeInterestDto: SetAssetLifeInterestDto,
    correlationId?: string,
  ): Promise<void> {
    try {
      const command = new SetAssetLifeInterestCommand(
        assetId,
        estatePlanningId,
        lifeInterestDto,
        correlationId,
      );
      await this.commandBus.execute(command);
    } catch (error) {
      this.handleServiceError(error, 'Failed to set asset life interest');
    }
  }

  async terminateAssetLifeInterest(
    assetId: string,
    estatePlanningId: string,
    terminationReason: string,
    correlationId?: string,
  ): Promise<void> {
    try {
      const command = new TerminateAssetLifeInterestCommand(
        assetId,
        estatePlanningId,
        terminationReason,
        correlationId,
      );
      await this.commandBus.execute(command);
    } catch (error) {
      this.handleServiceError(error, 'Failed to terminate asset life interest');
    }
  }

  async verifyAsset(
    assetId: string,
    estatePlanningId: string,
    verifyDto: VerifyAssetDto,
    correlationId?: string,
  ): Promise<void> {
    try {
      const command = new VerifyAssetCommand(assetId, estatePlanningId, verifyDto, correlationId);
      await this.commandBus.execute(command);
    } catch (error) {
      this.handleServiceError(error, 'Failed to verify asset');
    }
  }

  async markAssetMatrimonial(
    assetId: string,
    estatePlanningId: string,
    acquiredDuringMarriage: boolean = true,
    correlationId?: string,
  ): Promise<void> {
    try {
      const command = new MarkAssetMatrimonialCommand(
        assetId,
        estatePlanningId,
        acquiredDuringMarriage,
        correlationId,
      );
      await this.commandBus.execute(command);
    } catch (error) {
      this.handleServiceError(error, 'Failed to mark asset as matrimonial');
    }
  }

  async removeAssetMatrimonialStatus(
    assetId: string,
    estatePlanningId: string,
    reason: string,
    correlationId?: string,
  ): Promise<void> {
    try {
      const command = new RemoveAssetMatrimonialStatusCommand(
        assetId,
        estatePlanningId,
        reason,
        correlationId,
      );
      await this.commandBus.execute(command);
    } catch (error) {
      this.handleServiceError(error, 'Failed to remove asset matrimonial status');
    }
  }

  async deleteAsset(
    assetId: string,
    estatePlanningId: string,
    deletionReason: string,
    correlationId?: string,
  ): Promise<void> {
    try {
      const command = new DeleteAssetCommand(
        assetId,
        estatePlanningId,
        deletionReason,
        correlationId,
      );
      await this.commandBus.execute(command);
    } catch (error) {
      this.handleServiceError(error, 'Failed to delete asset');
    }
  }

  async updateAssetOwnership(
    assetId: string,
    estatePlanningId: string,
    ownershipType: AssetOwnershipType,
    ownershipShare: number,
    correlationId?: string,
  ): Promise<void> {
    try {
      const command = new UpdateAssetOwnershipCommand(
        assetId,
        estatePlanningId,
        ownershipType,
        ownershipShare,
        correlationId,
      );
      await this.commandBus.execute(command);
    } catch (error) {
      this.handleServiceError(error, 'Failed to update asset ownership');
    }
  }

  async updateAssetLocation(
    assetId: string,
    estatePlanningId: string,
    county: KenyanCounty,
    subCounty?: string,
    ward?: string,
    village?: string,
    landReferenceNumber?: string,
    gpsCoordinates?: GPSCoordinatesDto,
    correlationId?: string,
  ): Promise<void> {
    try {
      const command = new UpdateAssetLocationCommand(
        assetId,
        estatePlanningId,
        county,
        subCounty,
        ward,
        village,
        landReferenceNumber,
        gpsCoordinates,
        correlationId,
      );
      await this.commandBus.execute(command);
    } catch (error) {
      this.handleServiceError(error, 'Failed to update asset location');
    }
  }

  async updateAssetIdentification(
    assetId: string,
    estatePlanningId: string,
    titleDeedNumber?: string,
    registrationNumber?: string,
    kraPin?: string,
    identificationDetails?: Record<string, any>,
    correlationId?: string,
  ): Promise<void> {
    try {
      const command = new UpdateAssetIdentificationCommand(
        assetId,
        estatePlanningId,
        titleDeedNumber,
        registrationNumber,
        kraPin,
        identificationDetails,
        correlationId,
      );
      await this.commandBus.execute(command);
    } catch (error) {
      this.handleServiceError(error, 'Failed to update asset identification');
    }
  }

  async transferAsset(
    assetId: string,
    fromEstatePlanningId: string,
    toEstatePlanningId: string,
    transferReason: string,
    correlationId?: string,
  ): Promise<void> {
    try {
      const command = new TransferAssetCommand(
        assetId,
        fromEstatePlanningId,
        toEstatePlanningId,
        transferReason,
        correlationId,
      );
      await this.commandBus.execute(command);
    } catch (error) {
      this.handleServiceError(error, 'Failed to transfer asset');
    }
  }

  async bulkUpdateAssetsValuation(
    estatePlanningId: string,
    updates: Array<{
      assetId: string;
      amount: number;
      valuationDate: Date;
      valuationSource?: string;
    }>,
    valuationSource: string,
    correlationId?: string,
  ): Promise<void> {
    try {
      const command = new BulkUpdateAssetsValuationCommand(
        estatePlanningId,
        updates,
        valuationSource,
        correlationId,
      );
      await this.commandBus.execute(command);
    } catch (error) {
      this.handleServiceError(error, 'Failed to bulk update assets valuation');
    }
  }

  // Query Methods (Read Operations)

  async getAsset(assetId: string, estatePlanningId?: string): Promise<AssetResponseDto> {
    try {
      const query = new GetAssetQuery(assetId, estatePlanningId);
      return await this.queryBus.execute(query);
    } catch (error) {
      this.handleServiceError(error, 'Failed to get asset');
    }
  }

  async listAssets(
    estatePlanningId: string,
    filters?: {
      type?: AssetType;
      verificationStatus?: string;
      county?: KenyanCounty;
      isEncumbered?: boolean;
      isMatrimonialProperty?: boolean;
      hasLifeInterest?: boolean;
      requiresProbate?: boolean;
      searchTerm?: string;
    },
    pagination?: { page: number; limit: number },
    sort?: { field: string; order: 'asc' | 'desc' },
  ): Promise<{
    data: AssetSummaryResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const query = new ListAssetsQuery(estatePlanningId, filters, pagination, sort);
      return await this.queryBus.execute(query);
    } catch (error) {
      this.handleServiceError(error, 'Failed to list assets');
    }
  }

  async searchAssets(
    estatePlanningId: string,
    searchTerm: string,
    filters?: {
      type?: AssetType;
      county?: string;
      minValue?: number;
      maxValue?: number;
    },
    limit?: number,
  ): Promise<AssetSummaryResponseDto[]> {
    try {
      const query = new SearchAssetsQuery(estatePlanningId, searchTerm, filters, limit);
      return await this.queryBus.execute(query);
    } catch (error) {
      this.handleServiceError(error, 'Failed to search assets');
    }
  }

  async getAssetSummary(
    estatePlanningId: string,
    assetId: string,
  ): Promise<AssetSummaryResponseDto> {
    try {
      const query = new GetAssetSummaryQuery(estatePlanningId, assetId);
      return await this.queryBus.execute(query);
    } catch (error) {
      this.handleServiceError(error, 'Failed to get asset summary');
    }
  }

  async getEstateAssetsSummary(estatePlanningId: string): Promise<{
    totalAssets: number;
    totalValue: number;
    currency: string;
    byType: Record<string, { count: number; value: number }>;
    byVerificationStatus: Record<string, number>;
    encumberedAssets: number;
    matrimonialAssets: number;
    assetsWithLifeInterest: number;
  }> {
    try {
      const query = new GetEstateAssetsSummaryQuery(estatePlanningId);
      return await this.queryBus.execute(query);
    } catch (error) {
      this.handleServiceError(error, 'Failed to get estate assets summary');
    }
  }

  async checkAssetTransferability(
    assetId: string,
    estatePlanningId: string,
  ): Promise<{
    canBeTransferred: boolean;
    reasons: string[];
  }> {
    try {
      const query = new CheckAssetTransferabilityQuery(assetId, estatePlanningId);
      return await this.queryBus.execute(query);
    } catch (error) {
      this.handleServiceError(error, 'Failed to check asset transferability');
    }
  }

  async getAssetEncumbrances(
    assetId: string,
    estatePlanningId: string,
  ): Promise<{
    isEncumbered: boolean;
    encumbranceType: string | null;
    encumbranceDetails: string | null;
    encumbranceAmount: number | null;
    hasSignificantEncumbrance: boolean;
  }> {
    try {
      const query = new GetAssetEncumbrancesQuery(assetId, estatePlanningId);
      return await this.queryBus.execute(query);
    } catch (error) {
      this.handleServiceError(error, 'Failed to get asset encumbrances');
    }
  }

  async getAssetValuationHistory(
    assetId: string,
    estatePlanningId: string,
    limit?: number,
  ): Promise<any[]> {
    try {
      const query = new GetAssetValuationHistoryQuery(assetId, estatePlanningId, limit);
      return await this.queryBus.execute(query);
    } catch (error) {
      this.handleServiceError(error, 'Failed to get asset valuation history');
    }
  }

  // Private helper method for error handling
  private handleServiceError(error: any, defaultMessage: string): never {
    if (error.name === 'NotFoundException' || error.message.includes('not found')) {
      throw new NotFoundException(error.message || `${defaultMessage}: Resource not found`);
    }
    if (error.name === 'BadRequestException' || error.message.includes('invalid')) {
      throw new BadRequestException(error.message || `${defaultMessage}: Invalid request`);
    }
    if (error.name === 'ConflictException' || error.message.includes('already exists')) {
      throw new ConflictException(error.message || `${defaultMessage}: Conflict occurred`);
    }

    // Re-throw with default message for unknown errors
    throw new Error(`${defaultMessage}: ${error.message || error}`);
  }
}
