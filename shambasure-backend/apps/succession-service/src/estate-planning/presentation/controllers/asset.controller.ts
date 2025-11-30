import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '@shamba/auth';

import { AddAssetDto } from '../../application/dto/request/create-asset.dto';
import { UpdateAssetDto } from '../../application/dto/request/update-asset.dto';
import { AssetResponseDto } from '../../application/dto/response/asset.response.dto';
import { AssetService } from '../../application/services/asset.service';

// Helper type for authenticated requests
interface RequestWithUser extends Request {
  user: { userId: string; email: string; role: string };
}

@ApiTags('Estate Planning - Assets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('assets')
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  // --------------------------------------------------------------------------
  // CREATE
  // --------------------------------------------------------------------------

  @Post()
  @ApiOperation({ summary: 'Register a new asset to the estate' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The asset has been successfully registered.',
    type: String, // Returns ID
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid data provided.' })
  async addAsset(@Req() req: RequestWithUser, @Body() dto: AddAssetDto): Promise<{ id: string }> {
    const id = await this.assetService.addAsset(req.user.userId, dto);
    return { id };
  }

  // --------------------------------------------------------------------------
  // READ
  // --------------------------------------------------------------------------

  @Get()
  @ApiOperation({ summary: 'List all assets belonging to the user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of assets.',
    type: [AssetResponseDto],
  })
  async getEstateAssets(@Req() req: RequestWithUser): Promise<AssetResponseDto[]> {
    return this.assetService.getEstateAssets(req.user.userId);
  }

  @Get('portfolio-value')
  @ApiOperation({ summary: 'Get total portfolio value grouped by currency' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Financial summary of assets.',
  })
  async getPortfolioValue(@Req() req: RequestWithUser) {
    return this.assetService.getPortfolioValue(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific asset' })
  @ApiParam({ name: 'id', description: 'The ID of the asset' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Asset details.',
    type: AssetResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Asset not found.' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied.' })
  async getAsset(@Req() req: RequestWithUser, @Param('id') id: string): Promise<AssetResponseDto> {
    return this.assetService.getAsset(id, req.user.userId);
  }

  // --------------------------------------------------------------------------
  // UPDATE
  // --------------------------------------------------------------------------

  @Patch(':id')
  @ApiOperation({ summary: 'Update asset details or valuation' })
  @ApiParam({ name: 'id', description: 'The ID of the asset to update' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Asset updated successfully.',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Asset not found.' })
  async updateAsset(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: UpdateAssetDto,
  ): Promise<void> {
    return this.assetService.updateAsset(id, req.user.userId, dto);
  }

  // --------------------------------------------------------------------------
  // DELETE
  // --------------------------------------------------------------------------

  @Delete(':id')
  @ApiOperation({ summary: 'Remove (soft delete) an asset from the estate' })
  @ApiParam({ name: 'id', description: 'The ID of the asset to remove' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Asset removed successfully.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete asset (e.g. locked by active will).',
  })
  async removeAsset(@Req() req: RequestWithUser, @Param('id') id: string): Promise<void> {
    return this.assetService.removeAsset(id, req.user.userId);
  }
}
