import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '@shamba/auth';

import { AssignGuardianDto } from '../../application/dto/request/assign-guardian.dto';
import { GuardianshipResponseDto } from '../../application/dto/response/guardianship.response.dto';
import { GuardianshipService } from '../../application/services/guardianship.service';

interface RequestWithUser extends Request {
  user: { userId: string; email: string; role: string };
}

@ApiTags('Family Tree - Guardianship (Minors)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('guardianships')
export class GuardianshipController {
  constructor(private readonly guardianshipService: GuardianshipService) {}

  // --------------------------------------------------------------------------
  // ASSIGN
  // --------------------------------------------------------------------------

  @Post(':familyId')
  @ApiOperation({ summary: 'Assign a Guardian to a Minor' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Guardianship assigned.',
    type: String, // ID
  })
  async assignGuardian(
    @Req() req: RequestWithUser,
    @Param('familyId') familyId: string,
    @Body() dto: AssignGuardianDto,
  ): Promise<{ id: string }> {
    const id = await this.guardianshipService.assignGuardian(familyId, req.user.userId, dto);
    return { id };
  }

  // --------------------------------------------------------------------------
  // REVOKE
  // --------------------------------------------------------------------------

  @Delete(':familyId/:guardianshipId')
  @ApiOperation({ summary: 'Revoke a guardianship' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Revoked successfully.' })
  async removeGuardian(
    @Req() req: RequestWithUser,
    @Param('familyId') familyId: string,
    @Param('guardianshipId') guardianshipId: string,
  ): Promise<void> {
    // Hardcoded reason for API simplicity, could be body param if needed
    return this.guardianshipService.removeGuardian(
      familyId,
      req.user.userId,
      guardianshipId,
      'User requested removal via API',
    );
  }

  // --------------------------------------------------------------------------
  // READ
  // --------------------------------------------------------------------------

  @Get(':familyId')
  @ApiOperation({ summary: 'List active guardianships' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [GuardianshipResponseDto],
  })
  async getGuardianships(
    @Req() req: RequestWithUser,
    @Param('familyId') familyId: string,
  ): Promise<GuardianshipResponseDto[]> {
    return this.guardianshipService.getGuardianships(familyId, req.user.userId);
  }
}
