import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { WillStatus } from '@prisma/client';

import { JwtAuthGuard } from '@shamba/auth';

import { CreateWillDto } from '../../application/dto/request/create-will.dto';
import { RevokeWillDto } from '../../application/dto/request/revoke-will.dto';
import { SignWillDto } from '../../application/dto/request/sign-will.dto';
import { UpdateWillDto } from '../../application/dto/request/update-will.dto';
import { WillResponseDto } from '../../application/dto/response/will.response.dto';
import { WillCompletenessResponse } from '../../application/queries/get-will-completeness.query';
import { WillVersionSummary } from '../../application/queries/get-will-versions.query';
// Shared auth library

import { WillService } from '../../application/services/will.service';

interface RequestWithUser extends Request {
  user: { userId: string; email: string; role: string };
}

@ApiTags('Estate Planning - Wills (Core)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wills')
export class WillController {
  constructor(private readonly willService: WillService) {}

  // --------------------------------------------------------------------------
  // WRITE OPERATIONS
  // --------------------------------------------------------------------------

  @Post()
  @ApiOperation({ summary: 'Start drafting a new Will' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Will draft created successfully.',
    type: String, // Returns Will ID
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed (e.g. Testator lacks legal capacity).',
  })
  async createWill(
    @Req() req: RequestWithUser,
    @Body() dto: CreateWillDto,
  ): Promise<{ id: string }> {
    const id = await this.willService.createWill(req.user.userId, dto);
    return { id };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update Will content (Draft Mode)' })
  @ApiParam({ name: 'id', description: 'The Will ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Will updated successfully.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Cannot edit a finalized/active Will.',
  })
  async updateWill(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: UpdateWillDto,
  ): Promise<void> {
    return this.willService.updateWill(id, req.user.userId, dto);
  }

  @Post(':id/sign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record a digital signature (Testator or Witness)' })
  @ApiParam({ name: 'id', description: 'The Will ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Signature recorded successfully.',
  })
  async signWill(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: SignWillDto,
  ): Promise<void> {
    // Force Will ID match for safety
    if (dto.willId && dto.willId !== id) {
      // Ideally throw BadRequest, or just override
      dto.willId = id;
    }
    return this.willService.signWill(req.user.userId, dto);
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Finalize and Activate the Will' })
  @ApiParam({ name: 'id', description: 'The Will ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Will transitioned to ACTIVE state.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Activation failed due to validation errors (e.g. missing witnesses).',
  })
  async activateWill(@Req() req: RequestWithUser, @Param('id') id: string): Promise<void> {
    return this.willService.activateWill(id, req.user.userId);
  }

  @Post(':id/revoke')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Legally revoke an Active Will' })
  @ApiParam({ name: 'id', description: 'The Will ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Will marked as REVOKED.',
  })
  async revokeWill(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: RevokeWillDto,
  ): Promise<void> {
    return this.willService.revokeWill(id, req.user.userId, dto);
  }

  // --------------------------------------------------------------------------
  // READ OPERATIONS
  // --------------------------------------------------------------------------

  @Get()
  @ApiOperation({ summary: 'List all Wills belonging to the user' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['DRAFT', 'PENDING_WITNESS', 'WITNESSED', 'ACTIVE', 'REVOKED', 'EXECUTED'],
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [WillResponseDto],
  })
  async listWills(
    @Req() req: RequestWithUser,
    @Query('status') status?: WillStatus,
  ): Promise<WillResponseDto[]> {
    return this.willService.listWills(req.user.userId, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full Will document (Aggregate view)' })
  @ApiParam({ name: 'id', description: 'The Will ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: WillResponseDto,
  })
  async getWill(@Req() req: RequestWithUser, @Param('id') id: string): Promise<WillResponseDto> {
    return this.willService.getWill(id, req.user.userId);
  }

  @Get(':id/completeness')
  @ApiOperation({ summary: 'Check legal readiness/validation status' })
  @ApiParam({ name: 'id', description: 'The Will ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns a checklist of missing items.',
  })
  async checkCompleteness(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<WillCompletenessResponse> {
    return this.willService.checkCompleteness(id, req.user.userId);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Get audit trail of previous versions' })
  @ApiParam({ name: 'id', description: 'The Will ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of historical snapshots.',
  })
  async getVersions(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<WillVersionSummary[]> {
    return this.willService.getVersions(id, req.user.userId);
  }
}
