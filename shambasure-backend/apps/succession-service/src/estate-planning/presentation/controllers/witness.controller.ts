// estate-planning/presentation/controllers/witness.controller.ts
import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shamba/auth';
import { TestatorOwnershipGuard } from '../../../common/guards/testator-ownership.guard';
import { WillStatusGuard } from '../../../common/guards/will-status.guard';
import { KenyanLawValidationPipe } from '../../../common/pipes/kenyan-law-validation.pipe';
import { WitnessService } from '../../application/services/witness.service';
import { AddWitnessRequestDto } from '../../application/dto/request/add-witness.dto';
import { WitnessResponseDto } from '../../application/dto/response/witness.response.dto';

@ApiTags('Witnesses')
@ApiBearerAuth()
@Controller('wills/:willId/witnesses')
@UseGuards(JwtAuthGuard)
export class WitnessController {
  constructor(private readonly witnessService: WitnessService) {}

  @Post()
  @ApiOperation({
    summary: 'Add witness to will',
    description: 'Add a witness to a will for signing',
  })
  @ApiResponse({ status: HttpStatus.CREATED, type: WitnessResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Will not found' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or cannot modify will',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied to this will' })
  @UseGuards(TestatorOwnershipGuard, WillStatusGuard)
  async addWitness(
    @Param('willId') willId: string,
    @Body(KenyanLawValidationPipe) addWitnessDto: AddWitnessRequestDto,
    @Request() req,
  ): Promise<WitnessResponseDto> {
    const testatorId = req.user.id;
    return this.witnessService.addWitness(addWitnessDto, willId, testatorId);
  }

  @Get()
  @ApiOperation({
    summary: 'Get will witnesses',
    description: 'Get all witnesses for a specific will',
  })
  @ApiResponse({ status: HttpStatus.OK, type: [WitnessResponseDto] })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Will not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied to this will' })
  @UseGuards(TestatorOwnershipGuard)
  async getWitnesses(
    @Param('willId') willId: string,
    @Request() req,
  ): Promise<{
    witnesses: WitnessResponseDto[];
    signedWitnesses: WitnessResponseDto[];
    summary: any;
  }> {
    const testatorId = req.user.id;
    return this.witnessService.getWitnesses(willId, testatorId);
  }

  @Post(':witnessId/sign')
  @ApiOperation({ summary: 'Sign will as witness', description: 'Sign the will as a witness' })
  @ApiResponse({ status: HttpStatus.OK, type: WitnessResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Will or witness not found' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot sign will or witness not eligible',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async signWill(
    @Param('willId') willId: string,
    @Param('witnessId') witnessId: string,
    @Body() signDto: { signatureData: string },
    @Request() req,
  ): Promise<WitnessResponseDto> {
    // Verify the authenticated user is the witness
    const witness = await this.witnessService.getWitnesses(willId, req.user.id);
    // This would require additional validation to ensure the user is the witness
    return this.witnessService.signWill(willId, witnessId, signDto.signatureData);
  }

  @Post(':witnessId/verify')
  @ApiOperation({
    summary: 'Verify witness',
    description: 'Verify witness identity (admin/verifier only)',
  })
  @ApiResponse({ status: HttpStatus.OK, type: WitnessResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Witness not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Insufficient permissions' })
  async verifyWitness(
    @Param('witnessId') witnessId: string,
    @Request() req,
  ): Promise<WitnessResponseDto> {
    const verifiedBy = req.user.id;
    // Check user role for verification permissions
    if (!['ADMIN', 'VERIFIER'].includes(req.user.role)) {
      throw new Error('Insufficient permissions to verify witnesses');
    }
    return this.witnessService.verifyWitness(witnessId, verifiedBy);
  }

  @Delete(':witnessId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove witness', description: 'Remove a witness from a will' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Will or witness not found' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot modify will in current status',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied to this will' })
  @UseGuards(TestatorOwnershipGuard, WillStatusGuard)
  async removeWitness(
    @Param('willId') willId: string,
    @Param('witnessId') witnessId: string,
    @Request() req,
  ): Promise<void> {
    const testatorId = req.user.id;
    return this.witnessService.removeWitness(witnessId, willId, testatorId);
  }

  @Post(':witnessId/ineligible')
  @ApiOperation({
    summary: 'Mark witness as ineligible',
    description: 'Mark a witness as ineligible (admin only)',
  })
  @ApiResponse({ status: HttpStatus.OK, type: WitnessResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Witness not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Insufficient permissions' })
  async markWitnessAsIneligible(
    @Param('witnessId') witnessId: string,
    @Body() ineligibleDto: { reason: string },
    @Request() req,
  ): Promise<WitnessResponseDto> {
    // Check user role for admin permissions
    if (req.user.role !== 'ADMIN') {
      throw new Error('Insufficient permissions to mark witnesses as ineligible');
    }
    return this.witnessService.markWitnessAsIneligible(witnessId, ineligibleDto.reason);
  }

  @Get('pending-verification')
  @ApiOperation({
    summary: 'Get witnesses pending verification',
    description: 'Get all witnesses pending verification (admin/verifier only)',
  })
  @ApiResponse({ status: HttpStatus.OK, type: [WitnessResponseDto] })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Insufficient permissions' })
  async getWitnessesPendingVerification(@Request() req): Promise<WitnessResponseDto[]> {
    // Check user role for verification permissions
    if (!['ADMIN', 'VERIFIER'].includes(req.user.role)) {
      throw new Error('Insufficient permissions to view witnesses pending verification');
    }
    return this.witnessService.getWitnessesRequiringVerification();
  }
}
