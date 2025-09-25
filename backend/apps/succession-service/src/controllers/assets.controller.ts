import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { 
  CreateAssetDto, 
  UpdateAssetDto, 
  AssetResponseDto,
  AssetType,
  createSuccessResponse,
} from '@shamba/common';
import { 
  JwtAuthGuard, 
  RolesGuard, 
  CurrentUser,
} from '@shamba/auth';
import { AssetService } from '../services/asset.service';
import { LoggerService } from '@shamba/observability';
import { JwtPayload } from '@shamba/auth';

@ApiTags('Assets')
@Controller('assets')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AssetsController {
  constructor(
    private assetService: AssetService,
    private logger: LoggerService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new asset' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Asset created successfully',
    type: AssetResponseDto,
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid input data' 
  })
  async createAsset(
    @Body() createAssetDto: CreateAssetDto,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.info('Creating asset', 'AssetsController', { userId: user.userId });
    
    const result = await this.assetService.createAsset(createAssetDto, user.userId);
    
    return createSuccessResponse(result, 'Asset created successfully');
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Bulk create assets' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Assets created successfully' 
  })
  async bulkCreateAssets(
    @Body() assets: CreateAssetDto[],
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.info('Bulk creating assets', 'AssetsController', { 
      userId: user.userId,
      count: assets.length,
    });
    
    const result = await this.assetService.bulkCreateAssets(assets, user.userId);
    
    return createSuccessResponse(result, 'Assets created successfully');
  }

  @Get()
  @ApiOperation({ summary: 'Get all assets for the current user' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Assets retrieved successfully' 
  })
  async getAssets(@CurrentUser() user: JwtPayload) {
    this.logger.debug('Fetching user assets', 'AssetsController', { userId: user.userId });
    
    const result = await this.assetService.getAssetsByOwner(user.userId, user);
    
    return createSuccessResponse(result, 'Assets retrieved successfully');
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get asset statistics for the current user' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Statistics retrieved successfully' 
  })
  async getAssetStats(@CurrentUser() user: JwtPayload) {
    this.logger.debug('Fetching asset statistics', 'AssetsController', { userId: user.userId });
    
    const result = await this.assetService.getAssetStats(user.userId, user);
    
    return createSuccessResponse(result, 'Statistics retrieved successfully');
  }

  @Get('search')
  @ApiOperation({ summary: 'Search assets' })
  @ApiQuery({ name: 'q', description: 'Search query' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Search completed successfully' 
  })
  async searchAssets(
    @Query('q') query: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.debug('Searching assets', 'AssetsController', { 
      userId: user.userId,
      query,
    });
    
    const result = await this.assetService.searchAssets(user.userId, query, user);
    
    return createSuccessResponse(result, 'Search completed successfully');
  }

  @Get('type/:type')
  @ApiOperation({ summary: 'Get assets by type' })
  @ApiParam({ name: 'type', enum: AssetType })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Assets retrieved successfully' 
  })
  async getAssetsByType(
    @Param('type') type: AssetType,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.debug('Fetching assets by type', 'AssetsController', { 
      userId: user.userId,
      type,
    });
    
    const result = await this.assetService.getAssetsByType(user.userId, type, user);
    
    return createSuccessResponse(result, 'Assets retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get asset by ID' })
  @ApiParam({ name: 'id', description: 'Asset ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Asset retrieved successfully',
    type: AssetResponseDto,
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Asset not found' 
  })
  async getAssetById(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.debug('Fetching asset by ID', 'AssetsController', { assetId: id });
    
    const result = await this.assetService.getAssetById(id, user);
    
    return createSuccessResponse(result, 'Asset retrieved successfully');
  }

  @Get(':id/valuation')
  @ApiOperation({ summary: 'Get asset valuation' })
  @ApiParam({ name: 'id', description: 'Asset ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Valuation retrieved successfully' 
  })
  async getAssetValuation(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.debug('Getting asset valuation', 'AssetsController', { assetId: id });
    
    const result = await this.assetService.getAssetValuation(id, user);
    
    return createSuccessResponse(result, 'Valuation retrieved successfully');
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an asset' })
  @ApiParam({ name: 'id', description: 'Asset ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Asset updated successfully',
    type: AssetResponseDto,
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Access denied' 
  })
  async updateAsset(
    @Param('id') id: string,
    @Body() updateAssetDto: UpdateAssetDto,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.info('Updating asset', 'AssetsController', { assetId: id });
    
    const result = await this.assetService.updateAsset(id, updateAssetDto, user);
    
    return createSuccessResponse(result, 'Asset updated successfully');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an asset' })
  @ApiParam({ name: 'id', description: 'Asset ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Asset deleted successfully' 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Access denied' 
  })
  async deleteAsset(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.info('Deleting asset', 'AssetsController', { assetId: id });
    
    await this.assetService.deleteAsset(id, user);
    
    return createSuccessResponse(null, 'Asset deleted successfully');
  }
}