// apps/family-service/src/presentation/controllers/family.controller.ts
import {
  Body,
  Controller,
  Delete,
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

@Controller()
@UseGuards(JwtAuthGuard)
export class FamilyController {
  constructor(private readonly familyService: FamilyService) {}

  // ==========================================================================
  // FAMILY AGGREGATE ENDPOINTS
  // ==========================================================================

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createOrGetFamily(@Request() req, @Body() dto: CreateFamilyDto) {
    // Idempotent: Creates if not exists, returns existing if found
    return this.familyService.createFamily(req.user.sub, dto.name, dto.description);
  }

  @Get('mine')
  async getMyFamily(@Request() req) {
    // Convenience endpoint: Get the family aggregate for the logged-in user
    return this.familyService.getMyFamily(req.user.sub);
  }

  @Get('mine/tree')
  async getMyFamilyTree(@Request() req) {
    // Convenience endpoint: Get the visual tree for the logged-in user
    const family = await this.familyService.getMyFamily(req.user.sub);
    return this.familyService.getFamilyTree(family.id);
  }

  @Get(':familyId/tree')
  async getFamilyTreeById(@Param('familyId') familyId: string) {
    return this.familyService.getFamilyTree(familyId);
  }

  // ==========================================================================
  // MEMBER MANAGEMENT ENDPOINTS
  // ==========================================================================

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

  @Delete('members/:memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeFamilyMember(@Param('memberId') memberId: string) {
    await this.familyService.removeFamilyMember(memberId);
  }

  // ==========================================================================
  // SUCCESSION INTELLIGENCE ENDPOINTS
  // ==========================================================================

  @Get(':familyId/potential-heirs')
  async getPotentialHeirs(@Param('familyId') familyId: string) {
    const heirs = await this.familyService.getPotentialHeirs(familyId);

    return {
      heirs,
      disclaimer:
        'This is informational only based on Kenyan Law of Succession Act (Cap 160). ' +
        'Actual distribution requires court determination and estate valuation.',
      legalNote:
        'For testate succession (with a will), the will takes precedence (Section 5). ' +
        'For intestate succession (without a will), statutory rules apply (Sections 35-40).',
    };
  }
}
