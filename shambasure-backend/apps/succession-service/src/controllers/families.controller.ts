
// ============================================================================
// families.controller.ts - Family Management Endpoints
// ============================================================================

import { 
  Controller as FamilyController, 
  Get as FamilyGet, 
  Post as FamilyPost, 
  Patch as FamilyPatch,
  Delete as FamilyDelete, 
  Body as FamilyBody, 
  Param as FamilyParam, 
  UseGuards as FamilyUseGuards, 
  UseInterceptors as FamilyUseInterceptors, 
  ClassSerializerInterceptor as FamilyClassSerializerInterceptor, 
  HttpStatus as FamilyHttpStatus, 
  HttpCode as FamilyHttpCode,
  ParseUUIDPipe as FamilyParseUUIDPipe,
} from '@nestjs/common';
import { 
  ApiTags as FamilyApiTags, 
  ApiOperation as FamilyApiOperation, 
  ApiResponse as FamilyApiResponse, 
  ApiBearerAuth as FamilyApiBearerAuth,
  ApiParam as FamilyApiParam,
} from '@nestjs/swagger';
import { 
  CreateFamilyRequestDto, 
  AddFamilyMemberRequestDto,
  UpdateFamilyMemberRequestDto,
} from '@shamba/common';
import { 
  JwtAuthGuard as FamilyJwtAuthGuard, 
  CurrentUser as FamilyCurrentUser, 
  JwtPayload as FamilyJwtPayload 
} from '@shamba/auth';
import { FamiliesService } from '../services/families.service';
import { FamilyEntity, FamilyMemberEntity } from '../entities/succession.entity';

/**
 * FamiliesController - Family/HeirLink™ management endpoints
 * 
 * ROUTES:
 * - POST /families - Create family
 * - GET /families - List user's families
 * - GET /families/:id - Get single family
 * - DELETE /families/:id - Delete family
 * - POST /families/:id/members - Add family member
 * - PATCH /families/:id/members/:userId - Update member role
 * - DELETE /families/:id/members/:userId - Remove member
 */
@FamilyApiTags('Families')
@FamilyController('families')
@FamilyUseGuards(FamilyJwtAuthGuard)
@FamilyUseInterceptors(FamilyClassSerializerInterceptor)
@FamilyApiBearerAuth()
export class FamiliesController {
  constructor(private readonly familiesService: FamiliesService) {}

  @FamilyPost()
  @FamilyApiOperation({ 
    summary: 'Create a new family (HeirLink™)',
    description: 'Create a family group for organizing succession. Creator becomes first PARENT.'
  })
  @FamilyApiResponse({ 
    status: FamilyHttpStatus.CREATED, 
    description: 'Family created successfully',
    type: FamilyEntity 
  })
  async create(
    @FamilyCurrentUser('sub') userId: string,
    @FamilyBody() createFamilyDto: CreateFamilyRequestDto,
  ): Promise<FamilyEntity> {
    const family = await this.familiesService.create(userId, createFamilyDto);
    return new FamilyEntity(family);
  }

  @FamilyGet()
  @FamilyApiOperation({ 
    summary: 'List my families',
    description: 'Get all families where user is a member'
  })
  @FamilyApiResponse({ 
    status: FamilyHttpStatus.OK, 
    description: 'Families retrieved successfully',
    type: [FamilyEntity] 
  })
  async findMyFamilies(@FamilyCurrentUser('sub') userId: string): Promise<FamilyEntity[]> {
    const families = await this.familiesService.findForUser(userId);
    return families.map(f => new FamilyEntity(f));
  }

  @FamilyGet(':id')
  @FamilyApiParam({ 
    name: 'id', 
    description: 'Family UUID',
    type: 'string',
    format: 'uuid'
  })
  @FamilyApiOperation({ 
    summary: 'Get family by ID',
    description: 'Retrieve family details with all members'
  })
  @FamilyApiResponse({ 
    status: FamilyHttpStatus.OK, 
    description: 'Family retrieved successfully',
    type: FamilyEntity 
  })
  @FamilyApiResponse({ 
    status: FamilyHttpStatus.FORBIDDEN, 
    description: 'Not a member of this family' 
  })
  async findOne(
    @FamilyParam('id', FamilyParseUUIDPipe) id: string,
    @FamilyCurrentUser() user: FamilyJwtPayload,
  ): Promise<FamilyEntity> {
    const family = await this.familiesService.findOne(id, user);
    return new FamilyEntity(family);
  }

  @FamilyPost(':id/members')
  @FamilyApiParam({ 
    name: 'id', 
    description: 'Family UUID',
    type: 'string',
    format: 'uuid'
  })
  @FamilyApiOperation({ 
    summary: 'Add family member',
    description: 'Add new member to family (requires PARENT role)'
  })
  @FamilyApiResponse({ 
    status: FamilyHttpStatus.CREATED, 
    description: 'Member added successfully',
    type: FamilyMemberEntity 
  })
  @FamilyApiResponse({ 
    status: FamilyHttpStatus.FORBIDDEN, 
    description: 'Only PARENT role can add members' 
  })
  @FamilyApiResponse({ 
    status: FamilyHttpStatus.CONFLICT, 
    description: 'User is already a family member' 
  })
  async addMember(
    @FamilyParam('id', FamilyParseUUIDPipe) familyId: string,
    @FamilyBody() addMemberDto: AddFamilyMemberRequestDto,
    @FamilyCurrentUser() user: FamilyJwtPayload,
  ): Promise<FamilyMemberEntity> {
    const member = await this.familiesService.addMember(familyId, addMemberDto, user);
    return new FamilyMemberEntity(member);
  }

  @FamilyPatch(':id/members/:userId')
  @FamilyApiParam({ 
    name: 'id', 
    description: 'Family UUID',
    type: 'string',
    format: 'uuid'
  })
  @FamilyApiParam({ 
    name: 'userId', 
    description: 'User UUID',
    type: 'string',
    format: 'uuid'
  })
  @FamilyApiOperation({ 
    summary: 'Update member role',
    description: 'Change family member relationship type (requires PARENT role)'
  })
  @FamilyApiResponse({ 
    status: FamilyHttpStatus.OK, 
    description: 'Member updated successfully',
    type: FamilyMemberEntity 
  })
  @FamilyApiResponse({ 
    status: FamilyHttpStatus.BAD_REQUEST, 
    description: 'Cannot change creator role' 
  })
  async updateMember(
    @FamilyParam('id', FamilyParseUUIDPipe) familyId: string,
    @FamilyParam('userId', FamilyParseUUIDPipe) userId: string,
    @FamilyBody() updateDto: UpdateFamilyMemberRequestDto,
    @FamilyCurrentUser() user: FamilyJwtPayload,
  ): Promise<FamilyMemberEntity> {
    const member = await this.familiesService.updateMember(familyId, userId, updateDto, user);
    return new FamilyMemberEntity(member);
  }

  @FamilyDelete(':id/members/:userId')
  @FamilyHttpCode(FamilyHttpStatus.NO_CONTENT)
  @FamilyApiParam({ 
    name: 'id', 
    description: 'Family UUID',
    type: 'string',
    format: 'uuid'
  })
  @FamilyApiParam({ 
    name: 'userId', 
    description: 'User UUID',
    type: 'string',
    format: 'uuid'
  })
  @FamilyApiOperation({ 
    summary: 'Remove family member',
    description: 'Remove member from family (requires PARENT role, cannot remove creator)'
  })
  @FamilyApiResponse({ 
    status: FamilyHttpStatus.NO_CONTENT, 
    description: 'Member removed successfully' 
  })
  @FamilyApiResponse({ 
    status: FamilyHttpStatus.BAD_REQUEST, 
    description: 'Cannot remove family creator' 
  })
  async removeMember(
    @FamilyParam('id', FamilyParseUUIDPipe) familyId: string,
    @FamilyParam('userId', FamilyParseUUIDPipe) userId: string,
    @FamilyCurrentUser() user: FamilyJwtPayload,
  ): Promise<void> {
    await this.familiesService.removeMember(familyId, userId, user);
  }

  @FamilyDelete(':id')
  @FamilyHttpCode(FamilyHttpStatus.NO_CONTENT)
  @FamilyApiParam({ 
    name: 'id', 
    description: 'Family UUID',
    type: 'string',
    format: 'uuid'
  })
  @FamilyApiOperation({ 
    summary: 'Delete family',
    description: 'Delete family and all member relationships (creator only)'
  })
  @FamilyApiResponse({ 
    status: FamilyHttpStatus.NO_CONTENT, 
    description: 'Family deleted successfully' 
  })
  @FamilyApiResponse({ 
    status: FamilyHttpStatus.FORBIDDEN, 
    description: 'Only creator can delete family' 
  })
  async delete(
    @FamilyParam('id', FamilyParseUUIDPipe) id: string,
    @FamilyCurrentUser() user: FamilyJwtPayload,
  ): Promise<void> {
    await this.familiesService.delete(id, user);
  }
}
