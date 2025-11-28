import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

// Commands
import { AddAssetCommand } from '../commands/add-asset.command';
import { RemoveAssetCommand } from '../commands/remove-asset.command';
import { UpdateAssetCommand } from '../commands/update-asset.command';
// DTOs
import { AddAssetDto } from '../dto/request/add-asset.dto';
import { UpdateAssetDto } from '../dto/request/update-asset.dto';
import { AssetResponseDto } from '../dto/response/asset.response.dto';
import { GetAssetQuery } from '../queries/get-asset.query';
// Queries
import { GetEstateAssetsQuery } from '../queries/get-estate-assets.query';
import {
  GetPortfolioValueQuery,
  PortfolioValueResponse,
} from '../queries/get-portfolio-value.query';

@Injectable()
export class AssetService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // --------------------------------------------------------------------------
  // WRITE OPERATIONS (Commands)
  // --------------------------------------------------------------------------

  /**
   * Registers a new asset to the user's estate.
   * @returns The ID of the newly created asset.
   */
  async addAsset(userId: string, dto: AddAssetDto): Promise<string> {
    return this.commandBus.execute(new AddAssetCommand(userId, dto));
  }

  /**
   * Updates asset details, ownership, or valuation.
   * Triggers audit events if valuation changes.
   */
  async updateAsset(assetId: string, userId: string, dto: UpdateAssetDto): Promise<void> {
    return this.commandBus.execute(new UpdateAssetCommand(assetId, userId, dto));
  }

  /**
   * Soft-deletes an asset from the estate.
   */
  async removeAsset(assetId: string, userId: string): Promise<void> {
    return this.commandBus.execute(new RemoveAssetCommand(assetId, userId));
  }

  // --------------------------------------------------------------------------
  // READ OPERATIONS (Queries)
  // --------------------------------------------------------------------------

  /**
   * Retrieves a single asset by ID, ensuring ownership.
   */
  async getAsset(assetId: string, userId: string): Promise<AssetResponseDto> {
    return this.queryBus.execute(new GetAssetQuery(assetId, userId));
  }

  /**
   * Retrieves all assets belonging to the user.
   */
  async getEstateAssets(userId: string): Promise<AssetResponseDto[]> {
    return this.queryBus.execute(new GetEstateAssetsQuery(userId));
  }

  /**
   * Calculates the total value of the estate grouped by currency.
   * Critical for financial dashboards.
   */
  async getPortfolioValue(userId: string): Promise<PortfolioValueResponse> {
    return this.queryBus.execute(new GetPortfolioValueQuery(userId));
  }
}
