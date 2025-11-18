// estate-planning/presentation/controllers/will.controller.ts
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
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shamba/auth';
import { TestatorOwnershipGuard } from '../../../common/guards/testator-ownership.guard';
import { WillStatusGuard } from '../../../common/guards/will-status.guard';
import { KenyanLawValidationPipe } from '../../../common/pipes/kenyan-law-validation.pipe';
import { WillService } from '../../application/services/will.service';
import { CreateWillRequestDto } from '../../application/dto/request/create-will.dto';
import { UpdateWillRequestDto } from '../../application/dto/request/update-will.dto';
import { WillResponseDto } from '../../application/dto/response/will.response.dto';

@ApiTags('Wills')
@ApiBearerAuth()
@Controller('wills')
@UseGuards(JwtAuthGuard)
export class WillController {
  constructor(private readonly willService: WillService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new will',
    description: 'Create a new will for the authenticated user',
  })
  @ApiResponse({ status: HttpStatus.CREATED, type: WillResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async createWill(
    @Body(KenyanLawValidationPipe) createWillDto: CreateWillRequestDto,
    @Request() req,
  ): Promise<WillResponseDto> {
    const testatorId = req.user.id;
    return this.willService.createWill(createWillDto, testatorId);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all wills for user',
    description: 'Get paginated list of wills for the authenticated user',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['DRAFT', 'PENDING_WITNESS', 'WITNESSED', 'ACTIVE', 'REVOKED', 'EXECUTED'],
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: HttpStatus.OK, type: [WillResponseDto] })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async getWills(
    @Query('status') status: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Request() req,
  ): Promise<{ wills: WillResponseDto[]; total: number; page: number; totalPages: number }> {
    const testatorId = req.user.id;
    return this.willService.listWills(testatorId, status as any, page, limit);
  }

  @Get(':willId')
  @ApiOperation({
    summary: 'Get will by ID',
    description: 'Get a specific will by ID for the authenticated user',
  })
  @ApiResponse({ status: HttpStatus.OK, type: WillResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Will not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied to this will' })
  async getWill(@Param('willId') willId: string, @Request() req): Promise<WillResponseDto> {
    const testatorId = req.user.id;
    return this.willService.getWill(willId, testatorId);
  }

  @Put(':willId')
  @ApiOperation({
    summary: 'Update will',
    description: 'Update a specific will (only allowed for DRAFT status)',
  })
  @ApiResponse({ status: HttpStatus.OK, type: WillResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Will not found' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot modify will in current status',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied to this will' })
  @UseGuards(TestatorOwnershipGuard, WillStatusGuard)
  async updateWill(
    @Param('willId') willId: string,
    @Body(KenyanLawValidationPipe) updateWillDto: UpdateWillRequestDto,
    @Request() req,
  ): Promise<WillResponseDto> {
    const testatorId = req.user.id;
    return this.willService.updateWill(willId, updateWillDto, testatorId);
  }

  @Post(':willId/activate')
  @ApiOperation({
    summary: 'Activate will',
    description: 'Activate a witnessed will (requires legal capacity assessment)',
  })
  @ApiResponse({ status: HttpStatus.OK, type: WillResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Will not found' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot activate will in current status',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async activateWill(
    @Param('willId') willId: string,
    @Body() activateWillDto: any,
    @Request() req,
  ): Promise<WillResponseDto> {
    const activatedBy = req.user.id;
    return this.willService.activateWill(willId, activateWillDto, activatedBy);
  }

  @Post(':willId/revoke')
  @ApiOperation({ summary: 'Revoke will', description: 'Revoke an active will' })
  @ApiResponse({ status: HttpStatus.OK, type: WillResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Will not found' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot revoke will in current status',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async revokeWill(
    @Param('willId') willId: string,
    @Body() revokeWillDto: any,
    @Request() req,
  ): Promise<WillResponseDto> {
    const revokedBy = req.user.id;
    return this.willService.revokeWill(willId, revokeWillDto, revokedBy);
  }

  @Get(':willId/validate')
  @ApiOperation({
    summary: 'Validate will',
    description: 'Validate will against Kenyan legal requirements',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Will validation result',
    schema: {
      type: 'object',
      properties: {
        isValid: { type: 'boolean' },
        errors: { type: 'array', items: { type: 'string' } },
        warnings: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        complianceLevel: { type: 'string', enum: ['FULL', 'PARTIAL', 'MINIMAL', 'NON_COMPLIANT'] },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Will not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied to this will' })
  async validateWill(
    @Param('willId') willId: string,
    @Request() req,
  ): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    recommendations: string[];
    complianceLevel: string;
  }> {
    const testatorId = req.user.id;
    return this.willService.validateWill(willId, testatorId);
  }

  @Delete(':willId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete will',
    description: 'Soft delete a will (only allowed for DRAFT status)',
  })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Will not found' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete will in current status',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied to this will' })
  @UseGuards(TestatorOwnershipGuard, WillStatusGuard)
  async deleteWill(@Param('willId') willId: string, @Request() req): Promise<void> {
    const testatorId = req.user.id;
    // Implementation would call willService.softDeleteWill(willId, testatorId)
    // For now, we'll just return 204
    return;
  }
}
