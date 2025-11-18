// estate-planning/presentation/controllers/beneficiary.controller.ts
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
import { BeneficiaryService } from '../../application/services/beneficiary.service';
import { AssignBeneficiaryRequestDto } from '../../application/dto/request/assign-beneficiary.dto';
import { UpdateBeneficiaryRequestDto } from '../../application/dto/request/update-beneficiary.dto';
import { BeneficiaryResponseDto } from '../../application/dto/response/beneficiary.response.dto';

@ApiTags('Beneficiaries')
@ApiBearerAuth()
@Controller('wills/:willId/beneficiaries')
@UseGuards(JwtAuthGuard)
export class BeneficiaryController {
  constructor(private readonly beneficiaryService: BeneficiaryService) {}

  @Post()
  @ApiOperation({
    summary: 'Assign beneficiary to asset',
    description: 'Assign a beneficiary to an asset in a will',
  })
  @ApiResponse({ status: HttpStatus.CREATED, type: BeneficiaryResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Will or asset not found' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or cannot modify will',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied to this will' })
  @UseGuards(TestatorOwnershipGuard, WillStatusGuard)
  async assignBeneficiary(
    @Param('willId') willId: string,
    @Body(KenyanLawValidationPipe) assignBeneficiaryDto: AssignBeneficiaryRequestDto,
    @Request() req,
  ): Promise<BeneficiaryResponseDto> {
    const testatorId = req.user.id;
    return this.beneficiaryService.assignBeneficiary(assignBeneficiaryDto, willId, testatorId);
  }

  @Get()
  @ApiOperation({
    summary: 'Get will beneficiaries',
    description: 'Get all beneficiaries for a specific will',
  })
  @ApiQuery({ name: 'assetId', required: false, description: 'Filter by asset ID' })
  @ApiQuery({
    name: 'distributionStatus',
    required: false,
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'DISPUTED', 'DEFERRED'],
  })
  @ApiResponse({ status: HttpStatus.OK, type: [BeneficiaryResponseDto] })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Will not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied to this will' })
  @UseGuards(TestatorOwnershipGuard)
  async getBeneficiaries(
    @Param('willId') willId: string,
    @Query('assetId') assetId: string,
    @Query('distributionStatus') distributionStatus: string,
    @Request() req,
  ): Promise<{ beneficiaries: BeneficiaryResponseDto[]; summary: any }> {
    const testatorId = req.user.id;
    return this.beneficiaryService.getBeneficiaries(
      willId,
      testatorId,
      assetId,
      distributionStatus as any,
    );
  }

  @Put(':beneficiaryId')
  @ApiOperation({
    summary: 'Update beneficiary assignment',
    description: 'Update a beneficiary assignment in a will',
  })
  @ApiResponse({ status: HttpStatus.OK, type: BeneficiaryResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Will or beneficiary not found' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot modify will in current status',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied to this will' })
  @UseGuards(TestatorOwnershipGuard, WillStatusGuard)
  async updateBeneficiary(
    @Param('willId') willId: string,
    @Param('beneficiaryId') beneficiaryId: string,
    @Body(KenyanLawValidationPipe) updateBeneficiaryDto: UpdateBeneficiaryRequestDto,
    @Request() req,
  ): Promise<BeneficiaryResponseDto> {
    const testatorId = req.user.id;
    return this.beneficiaryService.updateBeneficiaryAssignment(
      beneficiaryId,
      updateBeneficiaryDto,
      willId,
      testatorId,
    );
  }

  @Delete(':beneficiaryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove beneficiary',
    description: 'Remove a beneficiary assignment from a will',
  })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Will or beneficiary not found' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot modify will in current status',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied to this will' })
  @UseGuards(TestatorOwnershipGuard, WillStatusGuard)
  async removeBeneficiary(
    @Param('willId') willId: string,
    @Param('beneficiaryId') beneficiaryId: string,
    @Request() req,
  ): Promise<void> {
    const testatorId = req.user.id;
    return this.beneficiaryService.removeBeneficiary(beneficiaryId, willId, testatorId);
  }

  @Get('distribution/summary')
  @ApiOperation({
    summary: 'Get distribution summary',
    description: 'Get comprehensive distribution summary for the will',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Distribution summary',
    schema: {
      type: 'object',
      properties: {
        assetSummaries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              assetId: { type: 'string' },
              assetName: { type: 'string' },
              totalAllocated: { type: 'number' },
              beneficiaryCount: { type: 'number' },
              conditionalCount: { type: 'number' },
            },
          },
        },
        overallSummary: {
          type: 'object',
          properties: {
            totalAssets: { type: 'number' },
            totalBeneficiaries: { type: 'number' },
            totalConditionalBequests: { type: 'number' },
            totalValueAllocated: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Will not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied to this will' })
  @UseGuards(TestatorOwnershipGuard)
  async getDistributionSummary(
    @Param('willId') willId: string,
    @Request() req,
  ): Promise<{
    assetSummaries: Array<{
      assetId: string;
      assetName: string;
      totalAllocated: number;
      beneficiaryCount: number;
      conditionalCount: number;
    }>;
    overallSummary: {
      totalAssets: number;
      totalBeneficiaries: number;
      totalConditionalBequests: number;
      totalValueAllocated: number;
    };
  }> {
    const testatorId = req.user.id;
    return this.beneficiaryService.getBeneficiaryDistributionSummary(willId);
  }

  @Post('distribution/status')
  @ApiOperation({
    summary: 'Update distribution status',
    description: 'Update distribution status for multiple beneficiaries (executor only)',
  })
  @ApiResponse({ status: HttpStatus.OK })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Insufficient permissions' })
  async updateDistributionStatus(
    @Body() updateStatusDto: { beneficiaryIds: string[]; status: string; notes?: string },
    @Request() req,
  ): Promise<void> {
    // Check if user is executor for these beneficiaries
    // This would require additional validation
    return this.beneficiaryService.updateDistributionStatus(
      updateStatusDto.beneficiaryIds,
      updateStatusDto.status as any,
      updateStatusDto.notes,
    );
  }
}
