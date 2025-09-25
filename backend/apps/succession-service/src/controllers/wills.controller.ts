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
} from '@nestjs/swagger';
import { 
  CreateWillDto, 
  UpdateWillDto, 
  WillResponseDto,
  BeneficiaryAssignmentDto,
  createSuccessResponse,
  createPaginatedResponse,
} from '@shamba/common';
import { 
  JwtAuthGuard, 
  RolesGuard, 
  CurrentUser,
} from '@shamba/auth';
import { WillService } from '../services/will.service';
import { LoggerService } from '@shamba/observability';
import { JwtPayload } from '@shamba/auth';

@ApiTags('Wills')
@Controller('wills')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class WillsController {
  constructor(
    private willService: WillService,
    private logger: LoggerService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new will' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Will created successfully',
    type: WillResponseDto,
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid input data' 
  })
  async createWill(
    @Body() createWillDto: CreateWillDto,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.info('Creating will', 'WillsController', { userId: user.userId });
    
    const result = await this.willService.createWill(createWillDto, user.userId);
    
    return createSuccessResponse(result, 'Will created successfully');
  }

  @Get()
  @ApiOperation({ summary: 'Get all wills for the current user' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Wills retrieved successfully' 
  })
  async getWills(@CurrentUser() user: JwtPayload) {
    this.logger.debug('Fetching user wills', 'WillsController', { userId: user.userId });
    
    const result = await this.willService.getWillsByTestator(user.userId, user);
    
    return createSuccessResponse(result, 'Wills retrieved successfully');
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get will statistics for the current user' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Statistics retrieved successfully' 
  })
  async getWillStats(@CurrentUser() user: JwtPayload) {
    this.logger.debug('Fetching will statistics', 'WillsController', { userId: user.userId });
    
    const result = await this.willService.getWillStats(user.userId, user);
    
    return createSuccessResponse(result, 'Statistics retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get will by ID' })
  @ApiParam({ name: 'id', description: 'Will ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Will retrieved successfully',
    type: WillResponseDto,
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Will not found' 
  })
  async getWillById(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.debug('Fetching will by ID', 'WillsController', { willId: id });
    
    const result = await this.willService.getWillById(id, user);
    
    return createSuccessResponse(result, 'Will retrieved successfully');
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a will' })
  @ApiParam({ name: 'id', description: 'Will ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Will updated successfully',
    type: WillResponseDto,
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Access denied' 
  })
  async updateWill(
    @Param('id') id: string,
    @Body() updateWillDto: UpdateWillDto,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.info('Updating will', 'WillsController', { willId: id });
    
    const result = await this.willService.updateWill(id, updateWillDto, user);
    
    return createSuccessResponse(result, 'Will updated successfully');
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate a will' })
  @ApiParam({ name: 'id', description: 'Will ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Will activated successfully',
    type: WillResponseDto,
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: 'Will cannot be activated' 
  })
  async activateWill(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.info('Activating will', 'WillsController', { willId: id });
    
    const result = await this.willService.activateWill(id, user);
    
    return createSuccessResponse(result, 'Will activated successfully');
  }

  @Post(':id/revoke')
  @ApiOperation({ summary: 'Revoke a will' })
  @ApiParam({ name: 'id', description: 'Will ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Will revoked successfully',
    type: WillResponseDto,
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: 'Will cannot be revoked' 
  })
  async revokeWill(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.info('Revoking will', 'WillsController', { willId: id });
    
    const result = await this.willService.revokeWill(id, user);
    
    return createSuccessResponse(result, 'Will revoked successfully');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a will' })
  @ApiParam({ name: 'id', description: 'Will ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Will deleted successfully' 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Access denied' 
  })
  async deleteWill(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.info('Deleting will', 'WillsController', { willId: id });
    
    await this.willService.deleteWill(id, user);
    
    return createSuccessResponse(null, 'Will deleted successfully');
  }

  @Post(':id/beneficiaries')
  @ApiOperation({ summary: 'Add a beneficiary to a will' })
  @ApiParam({ name: 'id', description: 'Will ID' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Beneficiary added successfully' 
  })
  async addBeneficiary(
    @Param('id') willId: string,
    @Body() assignmentDto: BeneficiaryAssignmentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.info('Adding beneficiary to will', 'WillsController', { willId });
    
    const result = await this.willService.addBeneficiary(willId, assignmentDto, user);
    
    return createSuccessResponse(result, 'Beneficiary added successfully');
  }

  @Get(':id/validation')
  @ApiOperation({ summary: 'Validate will distribution' })
  @ApiParam({ name: 'id', description: 'Will ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Validation completed' 
  })
  async validateWillDistribution(
    @Param('id') willId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.debug('Validating will distribution', 'WillsController', { willId });
    
    const result = await this.willService.validateWillDistribution(willId);
    
    return createSuccessResponse(result, 'Validation completed');
  }
}