import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser, JwtAuthGuard, type JwtPayload } from '@shamba/auth';

import { Result } from '../../../application/common/result';
// --- Queries ---
import {
  GetAssetDetailsQuery,
  GetEstateAssetsQuery,
} from '../../../application/estate/queries/impl/assets.query';
import { GetEstateDebtsQuery } from '../../../application/estate/queries/impl/debts.query';
import { GetEstateDependantsQuery } from '../../../application/estate/queries/impl/dependants.query';
import {
  CheckSolvencyQuery,
  GetEstateDashboardQuery,
} from '../../../application/estate/queries/impl/estate-dashboard.query';
import { GetGiftsInterVivosQuery } from '../../../application/estate/queries/impl/gifts.query';
import { GetDistributionReadinessQuery } from '../../../application/estate/queries/impl/reports.query';
// --- View Models ---
import {
  AssetInventoryVM,
  DebtWaterfallVM,
  DependantListVM,
  DistributionPreviewVM,
  EstateDashboardVM,
  GiftListVM,
  SolvencyRadarVM,
} from '../../../application/estate/queries/view-models';
// --- Response DTOs ---
import {
  AssetInventoryResponseDto,
  DebtWaterfallResponseDto,
  DependantListResponseDto,
  DistributionPreviewResponseDto,
  EstateDashboardResponseDto,
  GiftListResponseDto,
  SolvencyRadarResponseDto,
} from '../dtos/response';
import { EstatePresenterMapper } from '../mappers/estate-presenter.mapper';

@ApiTags('Estate Queries')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('estates')
export class EstateQueryController {
  constructor(private readonly queryBus: QueryBus) {}

  // ===========================================================================
  // DASHBOARD & FINANCIALS
  // ===========================================================================

  @Get(':id/dashboard')
  @ApiOperation({ summary: 'Get Estate "Cockpit" Dashboard' })
  @ApiResponse({ status: 200, type: EstateDashboardResponseDto })
  async getDashboard(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    const query = new GetEstateDashboardQuery({ estateId: id }, user.sub);

    const result = await this.queryBus.execute<GetEstateDashboardQuery, Result<EstateDashboardVM>>(
      query,
    );

    const vm = this.handleResult(result);
    return EstatePresenterMapper.toDashboardDto(vm);
  }

  @Get(':id/solvency-radar')
  @ApiOperation({ summary: 'Get Financial Health Analysis' })
  @ApiResponse({ status: 200, type: SolvencyRadarResponseDto })
  async getSolvencyRadar(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    // Note: includeProjectedDebts defaults to false/undefined if not passed
    const query = new CheckSolvencyQuery({ estateId: id }, user.sub);

    const result = await this.queryBus.execute<CheckSolvencyQuery, Result<SolvencyRadarVM>>(query);

    const vm = this.handleResult(result);
    return EstatePresenterMapper.toSolvencyRadarDto(vm);
  }

  // ===========================================================================
  // ASSETS
  // ===========================================================================

  @Get(':id/assets')
  @ApiOperation({ summary: 'Get Asset Inventory (Filtered)' })
  @ApiResponse({ status: 200, type: AssetInventoryResponseDto })
  async getAssets(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() filters: any, // Ideally strictly typed against GetEstateAssetsRequestDto
    @CurrentUser() user: JwtPayload,
  ) {
    // 1. Manually construct query with pagination defaults
    const query = new GetEstateAssetsQuery(
      {
        estateId: id,
        page: filters.page ? Number(filters.page) : 1,
        limit: filters.limit ? Number(filters.limit) : 20,
        sortOrder: filters.sortOrder || 'DESC',
        sortBy: filters.sortBy,
        type: filters.type,
        status: filters.status,
        isEncumbered:
          filters.isEncumbered === 'true'
            ? true
            : filters.isEncumbered === 'false'
              ? false
              : undefined,
      },
      user.sub,
    );

    const result = await this.queryBus.execute<GetEstateAssetsQuery, Result<AssetInventoryVM>>(
      query,
    );

    const vm = this.handleResult(result);
    return EstatePresenterMapper.toAssetInventoryDto(vm);
  }

  @Get(':id/assets/:assetId')
  @ApiOperation({ summary: 'Get Single Asset Details' })
  async getAssetDetails(
    @Param('id', ParseUUIDPipe) estateId: string,
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const query = new GetAssetDetailsQuery({ estateId, assetId }, user.sub);

    // Assuming Result<any> for now as discussed previously
    const result = await this.queryBus.execute<GetAssetDetailsQuery, Result<any>>(query);

    return this.handleResult(result);
  }

  // ===========================================================================
  // LIABILITIES
  // ===========================================================================

  @Get(':id/debts')
  @ApiOperation({ summary: 'Get S.45 Debt Waterfall' })
  @ApiResponse({ status: 200, type: DebtWaterfallResponseDto })
  async getDebts(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() filters: any,
    @CurrentUser() user: JwtPayload,
  ) {
    const query = new GetEstateDebtsQuery(
      {
        estateId: id,
        page: filters.page ? Number(filters.page) : 1,
        limit: filters.limit ? Number(filters.limit) : 50, // Higher limit for debts usually
        sortOrder: 'DESC', // Default
        // Add other filters as needed
      },
      user.sub,
    );

    const result = await this.queryBus.execute<GetEstateDebtsQuery, Result<DebtWaterfallVM>>(query);

    const vm = this.handleResult(result);
    return EstatePresenterMapper.toDebtWaterfallDto(vm);
  }

  // ===========================================================================
  // DEPENDANTS & GIFTS
  // ===========================================================================

  @Get(':id/dependants')
  @ApiOperation({ summary: 'Get S.29 Dependant Claims' })
  @ApiResponse({ status: 200, type: DependantListResponseDto })
  async getDependants(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    const query = new GetEstateDependantsQuery(
      {
        estateId: id,
        page: 1, // Defaulting for simple lists
        limit: 100,
        sortOrder: 'DESC',
      },
      user.sub,
    );

    const result = await this.queryBus.execute<GetEstateDependantsQuery, Result<DependantListVM>>(
      query,
    );

    const vm = this.handleResult(result);
    return EstatePresenterMapper.toDependantListDto(vm);
  }

  @Get(':id/gifts')
  @ApiOperation({ summary: 'Get S.35 Hotchpot Gifts' })
  @ApiResponse({ status: 200, type: GiftListResponseDto })
  async getGifts(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    const query = new GetGiftsInterVivosQuery(
      {
        estateId: id,
        // FIX: Provide required pagination params
        page: 1,
        limit: 100,
        sortOrder: 'DESC',
      },
      user.sub,
    );

    const result = await this.queryBus.execute<GetGiftsInterVivosQuery, Result<GiftListVM>>(query);

    const vm = this.handleResult(result);
    return EstatePresenterMapper.toGiftListDto(vm);
  }

  // ===========================================================================
  // REPORTING
  // ===========================================================================

  @Get(':id/distribution/readiness')
  @ApiOperation({ summary: 'Check if Estate is ready for distribution' })
  @ApiResponse({ status: 200, type: DistributionPreviewResponseDto })
  async checkDistributionReadiness(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const query = new GetDistributionReadinessQuery({ estateId: id }, user.sub);

    const result = await this.queryBus.execute<
      GetDistributionReadinessQuery,
      Result<DistributionPreviewVM>
    >(query);

    const vm = this.handleResult(result);
    return EstatePresenterMapper.toDistributionPreviewDto(vm);
  }

  // --- Helper to Unpack Result<T> ---
  private handleResult<T>(result: Result<T>): T {
    if (result.isFailure) {
      const error = result.error;
      const message = error ? error.message : 'Operation failed';

      // Map Domain Errors to HTTP Status Codes
      if (error?.name === 'EstateNotFoundError' || message.includes('not found')) {
        throw new HttpException(message, HttpStatus.NOT_FOUND);
      }
      if (error?.name === 'SecurityError') {
        throw new HttpException(message, HttpStatus.FORBIDDEN);
      }
      // Add more specific mappings as needed (e.g. ValidationError -> 400)

      throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return result.getValue();
  }
}
