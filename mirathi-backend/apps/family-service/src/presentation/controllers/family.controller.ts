// apps/family-service/src/presentation/controllers/family.controller.ts
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '@shamba/auth';

import { FamilyService } from '../../application/services/family.service';
import { AddFamilyMemberDto, CreateFamilyDto, UpdateFamilyMemberDto } from '../dto/family.dto';

@Controller('family')
@UseGuards(JwtAuthGuard)
export class FamilyController {
  constructor(private readonly familyService: FamilyService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createFamily(@Request() req, @Body() dto: CreateFamilyDto) {
    return this.familyService.createFamily(req.user.id, dto.name, dto.description);
  }

  @Post(':familyId/members')
  @HttpCode(HttpStatus.CREATED)
  async addFamilyMember(@Param('familyId') familyId: string, @Body() dto: AddFamilyMemberDto) {
    return this.familyService.addFamilyMember(familyId, dto);
  }

  @Put('members/:memberId')
  async updateFamilyMember(
    @Param('memberId') memberId: string,
    @Body() dto: UpdateFamilyMemberDto,
  ) {
    return this.familyService.updateFamilyMember(memberId, dto);
  }

  @Get(':familyId/tree')
  async getFamilyTree(@Param('familyId') familyId: string) {
    return this.familyService.getFamilyTree(familyId);
  }

  @Get(':familyId/potential-heirs')
  async getPotentialHeirs(@Param('familyId') familyId: string) {
    const heirs = await this.familyService.getPotentialHeirs(familyId);

    return {
      heirs,
      disclaimer:
        'This is informational only based on Kenyan Law of Succession Act. ' +
        'Actual distribution requires court determination and estate valuation.',
      legalNote:
        'For testate succession (with a will), the will takes precedence. ' +
        'For intestate succession (without a will), statutory rules apply.',
    };
  }
}
