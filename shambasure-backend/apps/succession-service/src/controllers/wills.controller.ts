// ============================================================================
// wills.controller.ts - Will Management Endpoints
// ============================================================================

import {
  Controller as WillController,
  Get as WillGet,
  Post as WillPost,
  Patch as WillPatch,
  Delete as WillDelete,
  Body as WillBody,
  Param as WillParam,
  UseGuards as WillUseGuards,
  UseInterceptors as WillUseInterceptors,
  ClassSerializerInterceptor as WillClassSerializerInterceptor,
  HttpCode as WillHttpCode,
  HttpStatus as WillHttpStatus,
  ParseUUIDPipe as WillParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags as WillApiTags,
  ApiOperation as WillApiOperation,
  ApiResponse as WillApiResponse,
  ApiBearerAuth as WillApiBearerAuth,
  ApiParam as WillApiParam,
} from '@nestjs/swagger';
import {
  CreateWillRequestDto,
  UpdateWillRequestDto,
  AssignBeneficiaryRequestDto,
} from '@shamba/common';
import * as auth from '@shamba/auth';
import { WillsService } from '../services/wills.service';
import {
  WillEntity,
  WillSummaryEntity,
  BeneficiaryAssignmentEntity,
} from '../entities/succession.entity';

/**
 * WillsController - Will and succession planning endpoints
 *
 * ROUTES:
 * - POST /wills - Create will
 * - GET /wills - List user's wills
 * - GET /wills/active - Get active will
 * - GET /wills/:id - Get single will
 * - PATCH /wills/:id - Update draft will
 * - POST /wills/:id/activate - Activate will
 * - POST /wills/:id/revoke - Revoke will
 * - DELETE /wills/:id - Delete will
 * - POST /wills/:id/assignments - Add beneficiary assignment
 * - DELETE /wills/:id/assignments/:assignmentId - Remove assignment
 */
@WillApiTags('Wills')
@WillController('wills')
@WillUseGuards(auth.JwtAuthGuard)
@WillUseInterceptors(WillClassSerializerInterceptor)
@WillApiBearerAuth()
export class WillsController {
  constructor(private readonly willsService: WillsService) {}

  @WillPost()
  @WillApiOperation({
    summary: 'Create a new will',
    description: 'Create a will in DRAFT status',
  })
  @WillApiResponse({
    status: WillHttpStatus.CREATED,
    description: 'Will created successfully',
    type: WillEntity,
  })
  async create(
    @auth.CurrentUser('sub') userId: string,
    @WillBody() createWillDto: CreateWillRequestDto,
  ): Promise<WillEntity> {
    const will = await this.willsService.create(userId, createWillDto);
    return new WillEntity(will);
  }

  @WillGet()
  @WillApiOperation({
    summary: 'List my wills',
    description: 'Get all wills created by authenticated user',
  })
  @WillApiResponse({
    status: WillHttpStatus.OK,
    description: 'Wills retrieved successfully',
    type: [WillSummaryEntity],
  })
  async findMyWills(@auth.CurrentUser('sub') userId: string): Promise<WillSummaryEntity[]> {
    const wills = await this.willsService.findForTestator(userId);
    return wills.map((will) => new WillSummaryEntity(will));
  }

  @WillGet('active')
  @WillApiOperation({
    summary: 'Get active will',
    description: 'Get the currently active will for authenticated user',
  })
  @WillApiResponse({
    status: WillHttpStatus.OK,
    description: 'Active will retrieved',
    type: WillEntity,
  })
  @WillApiResponse({
    status: WillHttpStatus.NOT_FOUND,
    description: 'No active will found',
  })
  async getActiveWill(@auth.CurrentUser('sub') userId: string): Promise<WillEntity | null> {
    const will = await this.willsService.findActiveWill(userId);
    return will ? new WillEntity(will) : null;
  }

  @WillGet(':id')
  @WillApiParam({
    name: 'id',
    description: 'Will UUID',
    type: 'string',
    format: 'uuid',
  })
  @WillApiOperation({
    summary: 'Get will by ID',
    description: 'Retrieve will details with beneficiary assignments',
  })
  @WillApiResponse({
    status: WillHttpStatus.OK,
    description: 'Will retrieved successfully',
    type: WillEntity,
  })
  @WillApiResponse({
    status: WillHttpStatus.FORBIDDEN,
    description: 'Not authorized to access this will',
  })
  async findOne(
    @WillParam('id', WillParseUUIDPipe) id: string,
    @auth.CurrentUser() user: auth.JwtPayload,
  ): Promise<WillEntity> {
    const will = await this.willsService.findOne(id, user);
    return new WillEntity(will);
  }

  @WillPatch(':id')
  @WillApiParam({
    name: 'id',
    description: 'Will UUID',
    type: 'string',
    format: 'uuid',
  })
  @WillApiOperation({
    summary: 'Update draft will',
    description: 'Update will details (only DRAFT wills can be edited)',
  })
  @WillApiResponse({
    status: WillHttpStatus.OK,
    description: 'Will updated successfully',
    type: WillEntity,
  })
  @WillApiResponse({
    status: WillHttpStatus.CONFLICT,
    description: 'Only DRAFT wills can be modified',
  })
  async update(
    @WillParam('id', WillParseUUIDPipe) id: string,
    @WillBody() updateWillDto: UpdateWillRequestDto,
    @auth.CurrentUser() user: auth.JwtPayload,
  ): Promise<WillEntity> {
    const will = await this.willsService.update(id, updateWillDto, user);
    return new WillEntity(will);
  }

  @WillPost(':id/activate')
  @WillApiParam({
    name: 'id',
    description: 'Will UUID',
    type: 'string',
    format: 'uuid',
  })
  @WillApiOperation({
    summary: 'Activate will',
    description: 'Activate will (DRAFT → ACTIVE). Revokes any existing active will.',
  })
  @WillApiResponse({
    status: WillHttpStatus.OK,
    description: 'Will activated successfully',
    type: WillEntity,
  })
  @WillApiResponse({
    status: WillHttpStatus.CONFLICT,
    description: 'Can only activate DRAFT wills',
  })
  async activate(
    @WillParam('id', WillParseUUIDPipe) id: string,
    @auth.CurrentUser() user: auth.JwtPayload,
  ): Promise<WillEntity> {
    const will = await this.willsService.activateWill(id, user);
    return new WillEntity(will);
  }

  @WillPost(':id/revoke')
  @WillApiParam({
    name: 'id',
    description: 'Will UUID',
    type: 'string',
    format: 'uuid',
  })
  @WillApiOperation({
    summary: 'Revoke will',
    description: 'Revoke active will (ACTIVE → REVOKED)',
  })
  @WillApiResponse({
    status: WillHttpStatus.OK,
    description: 'Will revoked successfully',
    type: WillEntity,
  })
  @WillApiResponse({
    status: WillHttpStatus.CONFLICT,
    description: 'Can only revoke ACTIVE wills',
  })
  async revoke(
    @WillParam('id', WillParseUUIDPipe) id: string,
    @auth.CurrentUser() user: auth.JwtPayload,
  ): Promise<WillEntity> {
    const will = await this.willsService.revokeWill(id, user);
    return new WillEntity(will);
  }

  @WillPost(':id/assignments')
  @WillApiParam({
    name: 'id',
    description: 'Will UUID',
    type: 'string',
    format: 'uuid',
  })
  @WillApiOperation({
    summary: 'Assign beneficiary',
    description: 'Assign asset to beneficiary with optional share percentage',
  })
  @WillApiResponse({
    status: WillHttpStatus.CREATED,
    description: 'Assignment created successfully',
    type: BeneficiaryAssignmentEntity,
  })
  @WillApiResponse({
    status: WillHttpStatus.BAD_REQUEST,
    description: 'Total shares exceed 100%',
  })
  @WillApiResponse({
    status: WillHttpStatus.CONFLICT,
    description: 'Can only modify DRAFT wills or duplicate assignment',
  })
  async addAssignment(
    @WillParam('id', WillParseUUIDPipe) willId: string,
    @WillBody() assignDto: AssignBeneficiaryRequestDto,
    @auth.CurrentUser() user: auth.JwtPayload,
  ): Promise<BeneficiaryAssignmentEntity> {
    const assignment = await this.willsService.addAssignment(willId, assignDto, user);
    return new BeneficiaryAssignmentEntity(assignment);
  }

  @WillDelete(':id/assignments/:assignmentId')
  @WillHttpCode(WillHttpStatus.NO_CONTENT)
  @WillApiParam({
    name: 'id',
    description: 'Will UUID',
    type: 'string',
    format: 'uuid',
  })
  @WillApiParam({
    name: 'assignmentId',
    description: 'Assignment UUID',
    type: 'string',
    format: 'uuid',
  })
  @WillApiOperation({
    summary: 'Remove assignment',
    description: 'Remove beneficiary assignment from will',
  })
  @WillApiResponse({
    status: WillHttpStatus.NO_CONTENT,
    description: 'Assignment removed successfully',
  })
  @WillApiResponse({
    status: WillHttpStatus.CONFLICT,
    description: 'Can only modify DRAFT wills',
  })
  async removeAssignment(
    @WillParam('id', WillParseUUIDPipe) willId: string,
    @WillParam('assignmentId', WillParseUUIDPipe) assignmentId: string,
    @auth.CurrentUser() user: auth.JwtPayload,
  ): Promise<void> {
    await this.willsService.removeAssignment(willId, assignmentId, user);
  }

  @WillDelete(':id')
  @WillHttpCode(WillHttpStatus.NO_CONTENT)
  @WillApiParam({
    name: 'id',
    description: 'Will UUID',
    type: 'string',
    format: 'uuid',
  })
  @WillApiOperation({
    summary: 'Delete will',
    description: 'Delete will (not allowed for ACTIVE or EXECUTED wills)',
  })
  @WillApiResponse({
    status: WillHttpStatus.NO_CONTENT,
    description: 'Will deleted successfully',
  })
  @WillApiResponse({
    status: WillHttpStatus.CONFLICT,
    description: 'Cannot delete ACTIVE or EXECUTED wills',
  })
  async delete(
    @WillParam('id', WillParseUUIDPipe) id: string,
    @auth.CurrentUser() user: auth.JwtPayload,
  ): Promise<void> {
    await this.willsService.delete(id, user);
  }
}
