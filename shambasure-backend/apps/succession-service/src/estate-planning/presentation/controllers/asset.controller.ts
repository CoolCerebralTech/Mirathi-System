// estate-planning/presentation/controllers/asset.controller.ts
import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shamba/auth';
import { TestatorOwnershipGuard } from '../../../common/guards/testator-ownership.guard';
import { WillStatusGuard } from '../../../common/guards/will-status.guard';
import { KenyanLawValidationPipe } from '../../../common/pipes/kenyan-law-validation.pipe';
import { AssetService } from '../../application/services/asset.service';
import { AddAssetRequestDto } from '../../application/dto/request/add-asset.dto';
import { AssetResponseDto } from '../../application/dto/response/asset.response.dto';

@ApiTags('Assets')
@ApiBearerAuth()
@Controller('wills/:willId/assets')
@UseGuards(JwtAuthGuard)
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  @Post()
  @ApiOperation({ summary: 'Add asset to will', description: 'Add a new asset to a specific will' })
  @ApiResponse({ status: HttpStatus.CREATED, type: AssetResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Will not found' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or cannot modify will',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied to this will' })
  @UseGuards(TestatorOwnershipGuard, WillStatusGuard)
  async addAsset(
    @Param('willId') willId: string,
    @Body(KenyanLawValidationPipe) addAssetDto: AddAssetRequestDto,
    @Request() req,
  ): Promise<AssetResponseDto> {
    const testatorId = req.user.id;
    return this.assetService.addAssetToWill(addAssetDto, willId, testatorId);
  }

  @Get()
  @ApiOperation({ summary: 'Get will assets', description: 'Get all assets for a specific will' })
  @ApiResponse({ status: HttpStatus.OK, type: [AssetResponseDto] })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Will not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied to this will' })
  @UseGuards(TestatorOwnershipGuard)
  async getWillAssets(
    @Param('willId') willId: string,
    @Request() req,
  ): Promise<{
    willAssets: AssetResponseDto[];
    standaloneAssets: AssetResponseDto[];
    totalValue: number;
  }> {
    const testatorId = req.user.id;
    return this.assetService.getEstateAssets(testatorId, willId, false);
  }

  @Get('estate')
  @ApiOperation({
    summary: 'Get estate assets',
    description: "Get all assets for user's estate (including standalone assets)",
  })
  @ApiResponse({ status: HttpStatus.OK, type: [AssetResponseDto] })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async getEstateAssets(@Request() req): Promise<{
    willAssets: AssetResponseDto[];
    standaloneAssets: AssetResponseDto[];
    totalValue: number;
  }> {
    const testatorId = req.user.id;
    return this.assetService.getEstateAssets(testatorId);
  }

  @Delete(':assetId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove asset from will',
    description: 'Remove an asset from a will (only allowed for DRAFT status)',
  })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Will or asset not found' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot remove asset from will in current status',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied to this will' })
  @UseGuards(TestatorOwnershipGuard, WillStatusGuard)
  async removeAsset(
    @Param('willId') willId: string,
    @Param('assetId') assetId: string,
    @Request() req,
  ): Promise<void> {
    const testatorId = req.user.id;
    return this.assetService.removeAssetFromWill(assetId, willId, testatorId);
  }

  @Post(':assetId/verify')
  @ApiOperation({
    summary: 'Verify asset document',
    description: 'Mark asset document as verified (admin/verifier only)',
  })
  @ApiResponse({ status: HttpStatus.OK, type: AssetResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Asset not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Insufficient permissions' })
  async verifyAsset(
    @Param('assetId') assetId: string,
    @Body() verifyDto: { verified: boolean },
    @Request() req,
  ): Promise<AssetResponseDto> {
    const verifiedBy = req.user.id;
    // Check user role for verification permissions
    if (!['ADMIN', 'VERIFIER'].includes(req.user.role)) {
      throw new Error('Insufficient permissions to verify assets');
    }
    return this.assetService.updateAssetVerification(assetId, verifyDto.verified, verifiedBy);
  }

  @Get('types/:assetType')
  @ApiOperation({
    summary: 'Get assets by type',
    description: 'Get all assets of a specific type for the user',
  })
  @ApiResponse({ status: HttpStatus.OK, type: [AssetResponseDto] })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async getAssetsByType(
    @Param('assetType') assetType: string,
    @Request() req,
  ): Promise<AssetResponseDto[]> {
    const testatorId = req.user.id;
    return this.assetService.getAssetsByType(testatorId, assetType as any);
  }
}
