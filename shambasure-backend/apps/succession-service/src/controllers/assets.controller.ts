// ============================================================================
// assets.controller.ts - Asset Management Endpoints
// ============================================================================

import { 
  Controller, 
  Get, 
  Post, 
  Patch,
  Delete, 
  Body, 
  Param, 
  Query,
  UseGuards, 
  UseInterceptors, 
  ClassSerializerInterceptor, 
  HttpCode, 
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CreateAssetRequestDto, UpdateAssetRequestDto } from '@shamba/common';
import { JwtAuthGuard, CurrentUser, JwtPayload } from '@shamba/auth';
import { AssetType } from '@shamba/database';
import { AssetsService } from '../services/assets.service';
import { AssetEntity, AssetSummaryEntity } from '../entities/succession.entity';

/**
 * AssetsController - Asset management endpoints
 * 
 * ROUTES:
 * - POST /assets - Create new asset
 * - GET /assets - List user's assets
 * - GET /assets/stats - Get asset statistics
 * - GET /assets/:id - Get single asset
 * - PATCH /assets/:id - Update asset
 * - DELETE /assets/:id - Delete asset
 */
@ApiTags('Assets')
@Controller('assets')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
@ApiBearerAuth()
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Create a new asset',
    description: 'Create an asset (land, vehicle, property, etc.) for the authenticated user'
  })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Asset created successfully',
    type: AssetEntity 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid asset data (e.g., land parcel without description)' 
  })
  async create(
    @CurrentUser('sub') userId: string,
    @Body() createAssetDto: CreateAssetRequestDto,
  ): Promise<AssetEntity> {
    const asset = await this.assetsService.create(userId, createAssetDto);
    return new AssetEntity(asset);
  }

  @Get()
  @ApiOperation({ 
    summary: 'List my assets',
    description: 'Get all assets owned by the authenticated user'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Assets retrieved successfully',
    type: [AssetSummaryEntity] 
  })
  async findMyAssets(
    @CurrentUser('sub') userId: string,
    @Query('type') type?: AssetType,
  ): Promise<AssetSummaryEntity[]> {
    const assets = type 
      ? await this.assetsService.findByType(userId, type)
      : await this.assetsService.findForOwner(userId);
    return assets.map(asset => new AssetSummaryEntity(asset));
  }

  @Get('stats')
  @ApiOperation({ 
    summary: 'Get asset statistics',
    description: 'Get total count and breakdown by type'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Statistics retrieved successfully'
  })
  async getStats(@CurrentUser('sub') userId: string) {
    return this.assetsService.getOwnerStats(userId);
  }

  @Get(':id')
  @ApiParam({ 
    name: 'id', 
    description: 'Asset UUID',
    type: 'string',
    format: 'uuid'
  })
  @ApiOperation({ 
    summary: 'Get asset by ID',
    description: 'Retrieve single asset with beneficiary assignments'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Asset retrieved successfully',
    type: AssetEntity 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Asset not found' 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Not authorized to access this asset' 
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<AssetEntity> {
    const asset = await this.assetsService.findOne(id, user);
    return new AssetEntity(asset);
  }

  @Patch(':id')
  @ApiParam({ 
    name: 'id', 
    description: 'Asset UUID',
    type: 'string',
    format: 'uuid'
  })
  @ApiOperation({ 
    summary: 'Update asset',
    description: 'Update asset details (name, description, type)'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Asset updated successfully',
    type: AssetEntity 
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: 'Cannot modify asset assigned in a will' 
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAssetDto: UpdateAssetRequestDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<AssetEntity> {
    const asset = await this.assetsService.update(id, updateAssetDto, user);
    return new AssetEntity(asset);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ 
    name: 'id', 
    description: 'Asset UUID',
    type: 'string',
    format: 'uuid'
  })
  @ApiOperation({ 
    summary: 'Delete asset',
    description: 'Delete asset (not allowed if assigned in a will)'
  })
  @ApiResponse({ 
    status: HttpStatus.NO_CONTENT, 
    description: 'Asset deleted successfully' 
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: 'Cannot delete asset assigned in a will' 
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string, 
    @CurrentUser() user: JwtPayload
  ): Promise<void> {
    await this.assetsService.delete(id, user);
  }
}
