import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param,
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
  CreateFamilyDto, 
  AddFamilyMemberDto, 
  FamilyResponseDto,
  RelationshipType,
  createSuccessResponse,
} from '@shamba/common';
import { 
  JwtAuthGuard, 
  RolesGuard, 
  CurrentUser,
} from '@shamba/auth';
import { FamilyService } from '../services/family.service';
import { LoggerService } from '@shamba/observability';
import { JwtPayload } from '@shamba/auth';

@ApiTags('Families')
@Controller('families')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class FamiliesController {
  constructor(
    private familyService: FamilyService,
    private logger: LoggerService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new family' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Family created successfully',
    type: FamilyResponseDto,
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid input data' 
  })
  async createFamily(
    @Body() createFamilyDto: CreateFamilyDto,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.info('Creating family', 'FamiliesController', { userId: user.userId });
    
    const result = await this.familyService.createFamily(createFamilyDto, user.userId);
    
    return createSuccessResponse(result, 'Family created successfully');
  }

  @Get()
  @ApiOperation({ summary: 'Get all families for the current user' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Families retrieved successfully' 
  })
  async getFamilies(@CurrentUser() user: JwtPayload) {
    this.logger.debug('Fetching user families', 'FamiliesController', { userId: user.userId });
    
    const result = await this.familyService.getFamiliesByMember(user.userId, user);
    
    return createSuccessResponse(result, 'Families retrieved successfully');
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get family statistics' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Statistics retrieved successfully' 
  })
  async getFamilyStats(@CurrentUser() user: JwtPayload) {
    this.logger.debug('Fetching family statistics', 'FamiliesController', { userId: user.userId });
    
    // For now, return stats for the first family or aggregate
    const families = await this.familyService.getFamiliesByMember(user.userId, user);
    if (families.length === 0) {
      return createSuccessResponse({}, 'No family statistics available');
    }
    
    const result = await this.familyService.getFamilyStats(families[0].id, user);
    
    return createSuccessResponse(result, 'Statistics retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get family by ID' })
  @ApiParam({ name: 'id', description: 'Family ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Family retrieved successfully',
    type: FamilyResponseDto,
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Family not found' 
  })
  async getFamilyById(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.debug('Fetching family by ID', 'FamiliesController', { familyId: id });
    
    const result = await this.familyService.getFamilyById(id, user);
    
    return createSuccessResponse(result, 'Family retrieved successfully');
  }

  @Get(':id/tree')
  @ApiOperation({ summary: 'Get family tree' })
  @ApiParam({ name: 'id', description: 'Family ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Family tree retrieved successfully' 
  })
  async getFamilyTree(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.debug('Generating family tree', 'FamiliesController', { familyId: id });
    
    const result = await this.familyService.getFamilyTree(id, user);
    
    return createSuccessResponse(result, 'Family tree retrieved successfully');
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add a member to the family' })
  @ApiParam({ name: 'id', description: 'Family ID' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Member added successfully' 
  })
  async addFamilyMember(
    @Param('id') familyId: string,
    @Body() addMemberDto: AddFamilyMemberDto,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.info('Adding family member', 'FamiliesController', { familyId });
    
    const result = await this.familyService.addFamilyMember(familyId, addMemberDto, user);
    
    return createSuccessResponse(result, 'Member added successfully');
  }

  @Post(':id/invite')
  @ApiOperation({ summary: 'Invite a member to the family' })
  @ApiParam({ name: 'id', description: 'Family ID' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Invitation sent successfully' 
  })
  async inviteFamilyMember(
    @Param('id') familyId: string,
    @Body() inviteDto: { email: string; role: RelationshipType },
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.info('Inviting family member', 'FamiliesController', { familyId });
    
    const result = await this.familyService.inviteFamilyMember(
      familyId,
      inviteDto.email,
      inviteDto.role,
      user,
    );
    
    return createSuccessResponse(result, 'Invitation sent successfully');
  }

  @Put(':id/members/:memberId/role')
  @ApiOperation({ summary: 'Update family member role' })
  @ApiParam({ name: 'id', description: 'Family ID' })
  @ApiParam({ name: 'memberId', description: 'Member user ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Role updated successfully' 
  })
  async updateMemberRole(
    @Param('id') familyId: string,
    @Param('memberId') memberId: string,
    @Body('role') role: RelationshipType,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.info('Updating member role', 'FamiliesController', { familyId, memberId });
    
    const result = await this.familyService.updateMemberRole(familyId, memberId, role, user);
    
    return createSuccessResponse(result, 'Role updated successfully');
  }

  @Delete(':id/members/:memberId')
  @ApiOperation({ summary: 'Remove a member from the family' })
  @ApiParam({ name: 'id', description: 'Family ID' })
  @ApiParam({ name: 'memberId', description: 'Member user ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Member removed successfully' 
  })
  async removeFamilyMember(
    @Param('id') familyId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.info('Removing family member', 'FamiliesController', { familyId, memberId });
    
    await this.familyService.removeFamilyMember(familyId, memberId, user);
    
    return createSuccessResponse(null, 'Member removed successfully');
  }
}