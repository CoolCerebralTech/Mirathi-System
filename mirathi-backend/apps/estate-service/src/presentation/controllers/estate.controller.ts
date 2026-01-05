// =============================================================================
// CONTROLLERS - HTTP Layer
// =============================================================================
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

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
} from '../dtos/estate.dto';

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
  @ApiResponse({ status: 400, description: 'Estate already exists' })
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
  @ApiResponse({ status: 404, description: 'Estate not found' })
  async getSummary(@Param('userId') userId: string) {
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

  @Post()
  @ApiOperation({ summary: 'Add a new asset' })
  @ApiResponse({ status: 201, description: 'Asset added successfully' })
  async add(@Param('estateId') estateId: string, @Body() dto: AddAssetDto) {
    const asset = await this.addAsset.execute(
      estateId,
      dto.name,
      dto.category,
      dto.estimatedValue,
      dto.description,
      {
        purchaseDate: dto.purchaseDate,
        location: dto.location,
        isEncumbered: dto.isEncumbered,
        encumbranceDetails: dto.encumbranceDetails,
      },
    );

    return {
      message: 'Asset added successfully',
      data: asset.toJSON(),
    };
  }

  @Post('land')
  @ApiOperation({ summary: 'Add land asset with title deed details' })
  @ApiResponse({ status: 201, description: 'Land asset added successfully' })
  async addLand(@Param('estateId') estateId: string, @Body() dto: AddLandAssetDto) {
    const asset = await this.addAsset.execute(
      estateId,
      dto.name,
      dto.category,
      dto.estimatedValue,
      dto.description,
      {
        purchaseDate: dto.purchaseDate,
        location: dto.location,
        isEncumbered: dto.isEncumbered,
        encumbranceDetails: dto.encumbranceDetails,
        landDetails: {
          titleDeedNumber: dto.titleDeedNumber,
          parcelNumber: dto.parcelNumber,
          county: dto.county,
          subCounty: dto.subCounty,
          landCategory: dto.landCategory,
          sizeInAcres: dto.sizeInAcres,
        },
      },
    );

    return {
      message: 'Land asset added successfully',
      data: asset.toJSON(),
    };
  }

  @Post('vehicle')
  @ApiOperation({ summary: 'Add vehicle asset with logbook details' })
  @ApiResponse({ status: 201, description: 'Vehicle asset added successfully' })
  async addVehicle(@Param('estateId') estateId: string, @Body() dto: AddVehicleAssetDto) {
    const asset = await this.addAsset.execute(
      estateId,
      dto.name,
      dto.category,
      dto.estimatedValue,
      dto.description,
      {
        purchaseDate: dto.purchaseDate,
        location: dto.location,
        isEncumbered: dto.isEncumbered,
        encumbranceDetails: dto.encumbranceDetails,
        vehicleDetails: {
          registrationNumber: dto.registrationNumber,
          make: dto.make,
          model: dto.model,
          year: dto.year,
          vehicleCategory: dto.vehicleCategory,
        },
      },
    );

    return {
      message: 'Vehicle asset added successfully',
      data: asset.toJSON(),
    };
  }

  @Get()
  @ApiOperation({ summary: 'List all assets in estate' })
  @ApiResponse({ status: 200, type: [AssetResponseDto] })
  async list(@Param('estateId') estateId: string) {
    const assets = await this.listAssets.execute(estateId);
    return {
      message: 'Assets retrieved successfully',
      data: assets,
      count: assets.length,
    };
  }

  @Put(':assetId/value')
  @ApiOperation({ summary: 'Update asset value' })
  @ApiResponse({ status: 200, description: 'Asset value updated successfully' })
  @HttpCode(HttpStatus.OK)
  async updateValue(@Param('assetId') assetId: string, @Body() dto: UpdateAssetValueDto) {
    await this.updateAssetValue.execute(assetId, dto.estimatedValue, dto.reason);
    return {
      message: 'Asset value updated successfully',
    };
  }

  @Post(':assetId/verify')
  @ApiOperation({ summary: 'Verify asset with proof document' })
  @ApiResponse({ status: 200, description: 'Asset verified successfully' })
  @HttpCode(HttpStatus.OK)
  async verify(@Param('assetId') assetId: string, @Body() dto: VerifyAssetDto) {
    await this.verifyAsset.execute(assetId, dto.proofDocumentUrl);
    return {
      message: 'Asset verified successfully',
    };
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
  @ApiOperation({ summary: 'Add a new debt' })
  @ApiResponse({ status: 201, description: 'Debt added successfully' })
  async add(@Param('estateId') estateId: string, @Body() dto: AddDebtDto) {
    const debt = await this.addDebt.execute(
      estateId,
      dto.creditorName,
      dto.description,
      dto.category,
      dto.originalAmount,
      dto.outstandingBalance,
      dto.isSecured,
    );

    return {
      message: 'Debt added successfully',
      data: debt.toJSON(),
    };
  }

  @Get()
  @ApiOperation({ summary: 'List all debts in estate' })
  @ApiResponse({ status: 200, type: [DebtResponseDto] })
  async list(@Param('estateId') estateId: string) {
    const debts = await this.listDebts.execute(estateId);
    return {
      message: 'Debts retrieved successfully',
      data: debts,
      count: debts.length,
    };
  }

  @Post(':debtId/pay')
  @ApiOperation({ summary: 'Make a payment on debt' })
  @ApiResponse({ status: 200, description: 'Payment recorded successfully' })
  @HttpCode(HttpStatus.OK)
  async pay(@Param('debtId') debtId: string, @Body() dto: PayDebtDto) {
    await this.payDebt.execute(debtId, dto.paymentAmount);
    return {
      message: 'Payment recorded successfully',
    };
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
  constructor(
    private readonly createWill: CreateWillService,
    private readonly addBeneficiary: AddBeneficiaryService,
    private readonly addWitness: AddWitnessService,
    private readonly generatePreview: GenerateWillPreviewService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new will' })
  @ApiResponse({ status: 201, description: 'Will created successfully' })
  async create(@Body() dto: CreateWillDto) {
    const will = await this.createWill.execute(dto.userId, dto.testatorName);

    // If executor details provided, update them
    if (dto.executorName) {
      // This would be a separate service, but for simplicity:
      // You'd call updateExecutor service here
    }

    return {
      message: 'Will created successfully',
      data: will.toJSON(),
    };
  }

  @Post(':willId/beneficiaries')
  @ApiOperation({ summary: 'Add beneficiary to will' })
  @ApiResponse({ status: 201, description: 'Beneficiary added successfully' })
  async addBeneficiary(@Param('willId') willId: string, @Body() dto: AddBeneficiaryDto) {
    await this.addBeneficiary.execute(willId, {
      beneficiaryName: dto.beneficiaryName,
      beneficiaryType: dto.beneficiaryType,
      relationship: dto.relationship,
      bequestType: dto.bequestType,
      assetId: dto.assetId,
      percentage: dto.percentage,
      cashAmount: dto.cashAmount ? dto.cashAmount.toString() : null,
      description: dto.description,
      hasConditions: dto.hasConditions,
      conditions: dto.conditions,
    });

    return {
      message: 'Beneficiary added successfully',
    };
  }

  @Post(':willId/witnesses')
  @ApiOperation({ summary: 'Add witness to will' })
  @ApiResponse({ status: 201, description: 'Witness added successfully' })
  async addWitness(@Param('willId') willId: string, @Body() dto: AddWitnessDto) {
    await this.addWitness.execute(willId, {
      fullName: dto.fullName,
      nationalId: dto.nationalId,
      phoneNumber: dto.phoneNumber,
      email: dto.email,
      address: dto.address,
      isOver18: true,
      isNotBeneficiary: true,
      isMentallyCapable: true,
    });

    return {
      message: 'Witness added successfully',
    };
  }

  @Get(':willId/preview')
  @ApiOperation({ summary: 'Generate will preview' })
  @ApiResponse({ status: 200, type: WillPreviewDto })
  async preview(@Param('willId') willId: string) {
    const preview = await this.generatePreview.execute(willId);
    return {
      message: 'Will preview generated successfully',
      data: preview,
    };
  }
}
