import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shamba/auth';
import { WitnessService } from '../../application/services/witness.service';
import { AddWitnessDto } from '../../application/dto/request/add-witness.dto';
import { WitnessResponseDto } from '../../application/dto/response/witness.response.dto';

interface RequestWithUser extends Request {
  user: { userId: string; email: string; role: string };
}

@ApiTags('Estate Planning - Witnesses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('witnesses')
export class WitnessController {
  constructor(private readonly witnessService: WitnessService) {}

  // --------------------------------------------------------------------------
  // WRITE OPERATIONS
  // --------------------------------------------------------------------------

  @Post(':willId')
  @ApiOperation({ summary: 'Nominate a Witness for a Will' })
  @ApiParam({ name: 'willId', description: 'The ID of the Will' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Witness nominated successfully.',
    type: String, // Returns ID
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed (e.g. Witness is also a Beneficiary).',
  })
  async addWitness(
    @Req() req: RequestWithUser,
    @Param('willId') willId: string,
    @Body() dto: AddWitnessDto,
  ): Promise<{ id: string }> {
    const id = await this.witnessService.addWitness(willId, req.user.userId, dto);
    return { id };
  }

  @Post(':willId/:witnessId/invite')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send/Resend invitation email/SMS to the witness' })
  @ApiParam({ name: 'willId', description: 'The Will ID' })
  @ApiParam({ name: 'witnessId', description: 'The Witness Record ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invitation queued successfully.',
  })
  async inviteWitness(
    @Req() req: RequestWithUser,
    @Param('willId') willId: string,
    @Param('witnessId') witnessId: string,
  ): Promise<void> {
    return this.witnessService.inviteWitness(willId, req.user.userId, witnessId);
  }

  @Delete(':willId/:witnessId')
  @ApiOperation({ summary: 'Remove a witness nomination' })
  @ApiParam({ name: 'willId', description: 'The Will ID' })
  @ApiParam({ name: 'witnessId', description: 'The Witness Record ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Witness removed successfully.',
  })
  async removeWitness(
    @Req() req: RequestWithUser,
    @Param('willId') willId: string,
    @Param('witnessId') witnessId: string,
  ): Promise<void> {
    return this.witnessService.removeWitness(willId, req.user.userId, witnessId);
  }

  // --------------------------------------------------------------------------
  // READ OPERATIONS
  // --------------------------------------------------------------------------

  @Get(':willId')
  @ApiOperation({ summary: 'List all witnesses for a specific Will' })
  @ApiParam({ name: 'willId', description: 'The ID of the Will' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [WitnessResponseDto],
  })
  async getWitnesses(
    @Req() req: RequestWithUser,
    @Param('willId') willId: string,
  ): Promise<WitnessResponseDto[]> {
    return this.witnessService.getWitnesses(willId, req.user.userId);
  }

  @Get(':willId/:witnessId')
  @ApiOperation({ summary: 'Get details/status of a specific witness' })
  @ApiParam({ name: 'willId', description: 'The Will ID' })
  @ApiParam({ name: 'witnessId', description: 'The Witness Record ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: WitnessResponseDto,
  })
  async getWitness(
    @Req() req: RequestWithUser,
    @Param('willId') willId: string,
    @Param('witnessId') witnessId: string,
  ): Promise<WitnessResponseDto> {
    return this.witnessService.getWitness(willId, witnessId, req.user.userId);
  }
}
