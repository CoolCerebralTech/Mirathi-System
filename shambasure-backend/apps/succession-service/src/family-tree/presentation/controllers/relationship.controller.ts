import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '@shamba/auth';

import { CreateRelationshipDto } from '../../application/dto/request/create-relationship.dto';
import { VerifyRelationshipDto } from '../../application/dto/request/verify-relationship.dto';
import { RelationshipResponseDto } from '../../application/dto/response/relationship.response.dto';
import { RelationshipService } from '../../application/services/relationship.service';

interface RequestWithUser extends Request {
  user: { userId: string; email: string; role: string };
}

@ApiTags('Family Tree - Lineage (Relationships)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('relationships')
export class RelationshipController {
  constructor(private readonly relationshipService: RelationshipService) {}

  // --------------------------------------------------------------------------
  // WRITE OPERATIONS
  // --------------------------------------------------------------------------

  @Post(':familyId')
  @ApiOperation({ summary: 'Create a lineage link (e.g., Parent -> Child)' })
  @ApiParam({ name: 'familyId', description: 'Family ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Relationship created.',
    type: String, // ID
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid relationship (e.g. Cycle detected or Biological impossibility).',
  })
  async createRelationship(
    @Req() req: RequestWithUser,
    @Param('familyId') familyId: string,
    @Body() dto: CreateRelationshipDto,
  ): Promise<{ id: string }> {
    const id = await this.relationshipService.createRelationship(familyId, req.user.userId, dto);
    return { id };
  }

  @Post(':relationshipId/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify a relationship with legal proof',
    description: 'Used by Admins/Verifiers to confirm a link via Birth Certificate or Affidavit.',
  })
  @ApiParam({ name: 'relationshipId', description: 'Relationship ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Relationship verified.' })
  async verifyRelationship(
    @Req() req: RequestWithUser,
    @Param('relationshipId') relationshipId: string,
    @Body() dto: VerifyRelationshipDto,
  ): Promise<void> {
    // Note: Real systems would check if req.user.role === 'VERIFIER' here
    return this.relationshipService.verifyRelationship(relationshipId, req.user.userId, dto);
  }

  @Delete(':familyId/:relationshipId')
  @ApiOperation({ summary: 'Remove a lineage link' })
  @ApiParam({ name: 'familyId', description: 'Family ID' })
  @ApiParam({ name: 'relationshipId', description: 'Relationship ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Relationship removed.' })
  async removeRelationship(
    @Req() req: RequestWithUser,
    @Param('familyId') familyId: string,
    @Param('relationshipId') relationshipId: string,
  ): Promise<void> {
    return this.relationshipService.removeRelationship(familyId, req.user.userId, relationshipId);
  }

  // --------------------------------------------------------------------------
  // READ OPERATIONS
  // --------------------------------------------------------------------------

  @Get(':familyId')
  @ApiOperation({ summary: 'Get all lineage edges for the family' })
  @ApiParam({ name: 'familyId', description: 'Family ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [RelationshipResponseDto],
  })
  async getRelationships(
    @Req() req: RequestWithUser,
    @Param('familyId') familyId: string,
  ): Promise<RelationshipResponseDto[]> {
    return this.relationshipService.getRelationships(familyId, req.user.userId);
  }

  @Get('children/:parentId')
  @ApiOperation({ summary: 'Get children of a specific member' })
  @ApiParam({ name: 'parentId', description: 'Member ID of the parent' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [RelationshipResponseDto],
  })
  async getChildren(
    @Req() req: RequestWithUser,
    @Param('parentId') parentId: string,
  ): Promise<RelationshipResponseDto[]> {
    return this.relationshipService.getChildren(parentId, req.user.userId);
  }
}
