import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '@shamba/auth';

import { CreateMarriageDto } from '../../application/dto/request/create-marriage.dto';
import { DissolveMarriageDto } from '../../application/dto/request/dissolve-marriage.dto';
import { UpdateMarriageDto } from '../../application/dto/request/update-marriage.dto';
import { MarriageResponseDto } from '../../application/dto/response/marriage.response.dto';
import { MarriageService } from '../../application/services/marriage.service';

interface RequestWithUser extends Request {
  user: { userId: string; email: string; role: string };
}

@ApiTags('Family Tree - Marriages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('marriages')
export class MarriageController {
  constructor(private readonly marriageService: MarriageService) {}

  // --------------------------------------------------------------------------
  // CREATE / REGISTER
  // --------------------------------------------------------------------------

  @Post(':familyId')
  @ApiOperation({ summary: 'Register a new marriage' })
  @ApiParam({ name: 'familyId', description: 'Family ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Marriage registered.',
    type: String, // ID
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed (e.g. Polygamy not allowed for Civil Marriage).',
  })
  async registerMarriage(
    @Req() req: RequestWithUser,
    @Param('familyId') familyId: string,
    @Body() dto: CreateMarriageDto,
  ): Promise<{ id: string }> {
    const id = await this.marriageService.registerMarriage(familyId, req.user.userId, dto);
    return { id };
  }

  // --------------------------------------------------------------------------
  // UPDATE / DISSOLVE
  // --------------------------------------------------------------------------

  @Patch(':familyId/:marriageId')
  @ApiOperation({ summary: 'Update marriage details (e.g. add Certificate Number)' })
  async updateMarriage(
    @Req() req: RequestWithUser,
    @Param('familyId') familyId: string,
    @Param('marriageId') marriageId: string,
    @Body() dto: UpdateMarriageDto,
  ): Promise<void> {
    return this.marriageService.updateMarriage(familyId, req.user.userId, marriageId, dto);
  }

  @Post(':familyId/:marriageId/dissolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dissolve a marriage (Divorce)' })
  @ApiParam({ name: 'marriageId', description: 'Marriage ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Marriage marked as dissolved.',
  })
  async dissolveMarriage(
    @Req() req: RequestWithUser,
    @Param('familyId') familyId: string,
    @Param('marriageId') marriageId: string,
    @Body() dto: DissolveMarriageDto,
  ): Promise<void> {
    return this.marriageService.dissolveMarriage(familyId, req.user.userId, marriageId, dto);
  }

  // --------------------------------------------------------------------------
  // READ
  // --------------------------------------------------------------------------

  @Get(':familyId')
  @ApiOperation({ summary: 'Get all marriages in the family tree' })
  async getMarriages(
    @Req() req: RequestWithUser,
    @Param('familyId') familyId: string,
  ): Promise<MarriageResponseDto[]> {
    return this.marriageService.getMarriages(familyId, req.user.userId);
  }

  @Get('member/:memberId')
  @ApiOperation({ summary: 'Get marriage history for a specific person' })
  async getMemberMarriages(
    @Req() req: RequestWithUser,
    @Param('memberId') memberId: string,
  ): Promise<MarriageResponseDto[]> {
    return this.marriageService.getMemberMarriages(memberId, req.user.userId);
  }
}
