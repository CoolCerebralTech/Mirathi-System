import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shamba/auth';
import { BeneficiaryService } from '../../application/services/beneficiary.service';
import { AssignBeneficiaryDto } from '../../application/dto/request/assign-beneficiary.dto';
import { BeneficiaryResponseDto } from '../../application/dto/response/beneficiary.response.dto';
import { AssetDistributionSummaryResponse } from '../../application/queries/get-asset-distribution.query';

interface RequestWithUser extends Request {
  user: { userId: string; email: string; role: string };
}

@ApiTags('Estate Planning - Beneficiaries')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('beneficiaries')
export class BeneficiaryController {
  constructor(private readonly beneficiaryService: BeneficiaryService) {}

  // --------------------------------------------------------------------------
  // CREATE / ASSIGN
  // --------------------------------------------------------------------------

  @Post(':willId')
  @ApiOperation({ summary: 'Assign a beneficiary to an asset within a specific Will' })
  @ApiParam({ name: 'willId', description: 'The ID of the Will' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Beneficiary successfully assigned.',
    type: String, // Returns ID
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed (e.g. Total shares exceed 100%).',
  })
  async assignBeneficiary(
    @Req() req: RequestWithUser,
    @Param('willId') willId: string,
    @Body() dto: AssignBeneficiaryDto,
  ): Promise<{ id: string }> {
    const id = await this.beneficiaryService.assignBeneficiary(willId, req.user.userId, dto);
    return { id };
  }

  // --------------------------------------------------------------------------
  // READ
  // --------------------------------------------------------------------------

  @Get(':willId')
  @ApiOperation({ summary: 'List all beneficiaries assigned in a Will' })
  @ApiParam({ name: 'willId', description: 'The ID of the Will' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of beneficiary assignments.',
    type: [BeneficiaryResponseDto],
  })
  async getBeneficiaries(
    @Req() req: RequestWithUser,
    @Param('willId') willId: string,
  ): Promise<BeneficiaryResponseDto[]> {
    return this.beneficiaryService.getBeneficiaries(willId, req.user.userId);
  }

  @Get('assignment/:assignmentId')
  @ApiOperation({ summary: 'Get details of a specific assignment' })
  @ApiParam({ name: 'assignmentId', description: 'The specific assignment ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: BeneficiaryResponseDto,
  })
  async getBeneficiary(
    @Req() req: RequestWithUser,
    @Param('assignmentId') assignmentId: string,
  ): Promise<BeneficiaryResponseDto> {
    return this.beneficiaryService.getBeneficiary(assignmentId, req.user.userId);
  }

  @Get('distribution-stats/:assetId')
  @ApiOperation({ summary: 'Get statistical distribution data for an asset (for charts)' })
  @ApiParam({ name: 'assetId', description: 'The Asset ID to analyze' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Summary of how much of the asset has been allocated.',
    type: Object, // Returns AssetDistributionSummaryResponse
  })
  async getAssetDistribution(
    @Req() req: RequestWithUser,
    @Param('assetId') assetId: string,
  ): Promise<AssetDistributionSummaryResponse> {
    return this.beneficiaryService.getAssetDistribution(assetId, req.user.userId);
  }

  // --------------------------------------------------------------------------
  // UPDATE
  // --------------------------------------------------------------------------

  @Patch(':willId/:assignmentId')
  @ApiOperation({ summary: 'Update a beneficiary assignment (e.g. change percentage)' })
  @ApiParam({ name: 'willId', description: 'The ID of the Will' })
  @ApiParam({ name: 'assignmentId', description: 'The Assignment ID to update' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Assignment updated successfully.',
  })
  async updateBeneficiary(
    @Req() req: RequestWithUser,
    @Param('willId') willId: string,
    @Param('assignmentId') assignmentId: string,
    @Body() dto: Partial<AssignBeneficiaryDto>,
  ): Promise<void> {
    return this.beneficiaryService.updateBeneficiary(willId, req.user.userId, assignmentId, dto);
  }

  // --------------------------------------------------------------------------
  // DELETE
  // --------------------------------------------------------------------------

  @Delete(':willId/:assignmentId')
  @ApiOperation({ summary: 'Remove a beneficiary from the Will' })
  @ApiParam({ name: 'willId', description: 'The ID of the Will' })
  @ApiParam({ name: 'assignmentId', description: 'The Assignment ID to remove' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Beneficiary removed successfully.',
  })
  async removeBeneficiary(
    @Req() req: RequestWithUser,
    @Param('willId') willId: string,
    @Param('assignmentId') assignmentId: string,
  ): Promise<void> {
    return this.beneficiaryService.removeBeneficiary(willId, req.user.userId, assignmentId);
  }
}
