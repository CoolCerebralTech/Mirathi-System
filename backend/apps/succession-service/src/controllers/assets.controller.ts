import { Controller, Get, Post, Body, Param, Delete, UseGuards, UseInterceptors, ClassSerializerInterceptor, HttpCode, HttpStatus, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreateAssetRequestDto, UpdateAssetRequestDto } from '@shamba/common';
import { JwtAuthGuard, CurrentUser, JwtPayload } from '@shamba/auth';
import { AssetsService } from '../services/assets.service';
import { AssetEntity } from '../entities/succession.entity';

@ApiTags('Assets')
@Controller('assets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post()
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Create a new asset for the authenticated user' })
  @ApiResponse({ status: HttpStatus.CREATED, type: AssetEntity })
  async create(
    @CurrentUser('sub') userId: string,
    @Body() createAssetDto: CreateAssetRequestDto,
  ): Promise<AssetEntity> {
    const asset = await this.assetsService.create(userId, createAssetDto);
    return new AssetEntity(asset);
  }

  @Get()
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Get all assets for the authenticated user' })
  @ApiResponse({ status: HttpStatus.OK, type: [AssetEntity] })
  async findMyAssets(@CurrentUser('sub') userId: string): Promise<AssetEntity[]> {
    const assets = await this.assetsService.findForOwner(userId);
    return assets.map(asset => new AssetEntity(asset));
  }

  @Get(':id')
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Get a single asset by ID' })
  @ApiResponse({ status: HttpStatus.OK, type: AssetEntity })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<AssetEntity> {
    const asset = await this.assetsService.findOne(id, user);
    return new AssetEntity(asset);
  }

  @Put(':id')
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Update an asset' })
  @ApiResponse({ status: HttpStatus.OK, type: AssetEntity })
  async update(
    @Param('id') id: string,
    @Body() updateAssetDto: UpdateAssetRequestDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<AssetEntity> {
    const asset = await this.assetsService.update(id, updateAssetDto, user);
    return new AssetEntity(asset);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an asset' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload): Promise<void> {
    await this.assetsService.delete(id, user);
  }
}