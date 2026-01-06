// src/application/controllers/estate.controller.ts
import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AssetCategory } from '@prisma/client';

import { JwtAuthGuard } from '@shamba/auth';

// Services
import {
  AddAssetService,
  AddBeneficiaryService,
  AddDebtService,
  AddWitnessService,
  CreateEstateService,
  CreateWillService,
  GenerateWillPreviewService,
  GetEstateSummaryService,
  ListAssetsService,
  ListDebtsService,
  PayDebtService,
  UpdateAssetValueService,
  VerifyAssetService,
} from '../../application/services';
// DTOs
import {
  AddAssetDto,
  AddBeneficiaryDto,
  AddDebtDto,
  AddLandAssetDto,
  AddVehicleAssetDto,
  AddWitnessDto,
  AssetResponseDto,
  CreateEstateDto,
  CreateWillDto,
  DebtResponseDto,
  EstateSummaryDto,
  PayDebtDto,
  UpdateAssetValueDto,
  VerifyAssetDto,
  WillPreviewDto,
} from '../dtos';

// =============================================================================
// ESTATE CONTROLLER
// =============================================================================
@ApiTags('Estate')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('estate')
export class EstateController {
  constructor(
    private readonly createEstate: CreateEstateService,
    private readonly getEstateSummary: GetEstateSummaryService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new estate' })
  @ApiResponse({ status: 201, description: 'Estate created successfully' })
  async create(@Body() dto: CreateEstateDto) {
    const estate = await this.createEstate.execute(dto.userId, dto.userName, dto.kraPin);
    return {
      message: 'Estate created successfully',
      data: estate.toJSON(),
    };
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get estate summary' })
  @ApiResponse({ status: 200, type: EstateSummaryDto })
  async getSummary(@Param('userId', ParseUUIDPipe) userId: string) {
    const summary = await this.getEstateSummary.execute(userId);
    return {
      message: 'Estate summary retrieved successfully',
      data: summary,
    };
  }
}

// =============================================================================
// ASSETS CONTROLLER
// =============================================================================
@ApiTags('Assets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('estate/:estateId/assets')
export class AssetsController {
  constructor(
    private readonly addAsset: AddAssetService,
    private readonly listAssets: ListAssetsService,
    private readonly updateAssetValue: UpdateAssetValueService,
    private readonly verifyAsset: VerifyAssetService,
  ) {}

  @Post('generic')
  @ApiOperation({ summary: 'Add a generic asset' })
  @ApiResponse({ status: 201, description: 'Asset added successfully' })
  async addGeneric(@Param('estateId', ParseUUIDPipe) estateId: string, @Body() dto: AddAssetDto) {
    const asset = await this.addAsset.execute(
      estateId,
      dto.category,
      dto.estimatedValue,
      { type: 'GENERIC' },
      dto.description,
      dto.name,
    );
    return { message: 'Asset added successfully', data: asset.toJSON() };
  }

  @Post('land')
  @ApiOperation({ summary: 'Add land with Title Deed details' })
  @ApiResponse({ status: 201, description: 'Land added successfully' })
  async addLand(@Param('estateId', ParseUUIDPipe) estateId: string, @Body() dto: AddLandAssetDto) {
    // Map flattened DTO to Nested Service Object
    const asset = await this.addAsset.execute(
      estateId,
      AssetCategory.LAND,
      dto.estimatedValue,
      {
        type: 'LAND',
        details: {
          titleDeedNumber: dto.titleDeedNumber,
          parcelNumber: dto.parcelNumber,
          county: dto.county,
          subCounty: dto.subCounty,
          landCategory: dto.landCategory,
          sizeInAcres: dto.sizeInAcres,
        },
      },
      dto.description,
    );
    return { message: 'Land asset added successfully', data: asset.toJSON() };
  }

  @Post('vehicle')
  @ApiOperation({ summary: 'Add vehicle with Registration details' })
  @ApiResponse({ status: 201, description: 'Vehicle added successfully' })
  async addVehicle(
    @Param('estateId', ParseUUIDPipe) estateId: string,
    @Body() dto: AddVehicleAssetDto,
  ) {
    const asset = await this.addAsset.execute(
      estateId,
      AssetCategory.VEHICLE,
      dto.estimatedValue,
      {
        type: 'VEHICLE',
        details: {
          registrationNumber: dto.registrationNumber,
          make: dto.make,
          model: dto.model,
          year: dto.year,
          vehicleCategory: dto.vehicleCategory,
        },
      },
      dto.description,
    );
    return { message: 'Vehicle asset added successfully', data: asset.toJSON() };
  }

  @Get()
  @ApiOperation({ summary: 'List all assets' })
  @ApiResponse({ status: 200, type: [AssetResponseDto] })
  async list(@Param('estateId', ParseUUIDPipe) estateId: string) {
    const assets = await this.listAssets.execute(estateId);
    return {
      message: 'Assets retrieved successfully',
      data: assets,
      count: assets.length,
    };
  }

  @Put(':assetId/value')
  @ApiOperation({ summary: 'Update asset value' })
  async updateValue(
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Body() dto: UpdateAssetValueDto,
  ) {
    await this.updateAssetValue.execute(assetId, dto.estimatedValue);
    return { message: 'Asset value updated successfully' };
  }

  @Post(':assetId/verify')
  async verify(@Param('assetId', ParseUUIDPipe) assetId: string, @Body() dto: VerifyAssetDto) {
    await this.verifyAsset.execute(assetId, dto.proofDocumentUrl);
    return { message: 'Asset verified successfully' };
  }
}

// =============================================================================
// DEBTS CONTROLLER
// =============================================================================
@ApiTags('Debts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('estate/:estateId/debts')
export class DebtsController {
  constructor(
    private readonly addDebt: AddDebtService,
    private readonly listDebts: ListDebtsService,
    private readonly payDebt: PayDebtService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Add debt (Auto-priority calculation)' })
  @ApiResponse({ status: 201, description: 'Debt added successfully' })
  async add(@Param('estateId', ParseUUIDPipe) estateId: string, @Body() dto: AddDebtDto) {
    const debt = await this.addDebt.execute(
      estateId,
      dto.creditorName,
      dto.description,
      dto.category,
      dto.originalAmount,
      dto.outstandingBalance ?? dto.originalAmount,
      dto.isSecured,
    );
    return { message: 'Debt added successfully', data: debt.toJSON() };
  }

  @Get()
  @ApiOperation({ summary: 'List debts ordered by Priority' })
  @ApiResponse({ status: 200, type: [DebtResponseDto] })
  async list(@Param('estateId', ParseUUIDPipe) estateId: string) {
    const debts = await this.listDebts.execute(estateId);
    return {
      message: 'Debts retrieved successfully',
      data: debts,
      count: debts.length,
    };
  }

  @Post(':debtId/pay')
  @ApiOperation({ summary: 'Record debt payment' })
  async pay(@Param('debtId', ParseUUIDPipe) debtId: string, @Body() dto: PayDebtDto) {
    await this.payDebt.execute(debtId, dto.amount);
    return { message: 'Payment recorded successfully' };
  }
}

// =============================================================================
// WILL CONTROLLER
// =============================================================================
@ApiTags('Will')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('will')
export class WillController {
  // FIX: Rename properties to avoid collision with method names
  constructor(
    private readonly createWill: CreateWillService,
    private readonly addBeneficiaryService: AddBeneficiaryService, // Renamed
    private readonly addWitnessService: AddWitnessService, // Renamed
    private readonly generatePreview: GenerateWillPreviewService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Start a new Will' })
  @ApiResponse({ status: 201, description: 'Will created' })
  async create(@Body() dto: CreateWillDto) {
    const will = await this.createWill.execute(dto.userId, dto.testatorName);
    return { message: 'Will created successfully', data: will.toJSON() };
  }

  @Post(':willId/beneficiaries')
  @ApiOperation({ summary: 'Add Beneficiary' })
  @ApiResponse({ status: 201, description: 'Beneficiary added' })
  async addBeneficiary(
    @Param('willId', ParseUUIDPipe) willId: string,
    @Body() dto: AddBeneficiaryDto,
  ) {
    // FIX: Use the renamed property
    await this.addBeneficiaryService.execute(willId, {
      name: dto.name,
      type: dto.type,
      description: dto.description || '', // Ensure default if missing
      // Pass other fields if service supports them, or map appropriately
    });
    return { message: 'Beneficiary added successfully' };
  }

  @Post(':willId/witnesses')
  @ApiOperation({ summary: 'Add Witness' })
  @ApiResponse({ status: 201, description: 'Witness added' })
  async addWitness(@Param('willId', ParseUUIDPipe) willId: string, @Body() dto: AddWitnessDto) {
    // FIX: Use the renamed property
    await this.addWitnessService.execute(willId, {
      fullName: dto.fullName,
      email: dto.email,
    });
    return { message: 'Witness added successfully' };
  }

  @Get(':willId/preview')
  @ApiOperation({ summary: 'Generate HTML Preview' })
  @ApiResponse({ status: 200, type: WillPreviewDto })
  async preview(@Param('willId', ParseUUIDPipe) willId: string) {
    const preview = await this.generatePreview.execute(willId);
    return {
      message: 'Will preview generated successfully',
      data: preview,
    };
  }
}
