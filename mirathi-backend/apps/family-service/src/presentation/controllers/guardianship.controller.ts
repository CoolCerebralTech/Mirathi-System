// apps/family-service/src/presentation/controllers/guardianship.controller.ts
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '@shamba/auth';

import { GuardianshipService } from '../../application/services/guardianship.service';
import { AssignGuardianDto, CheckGuardianEligibilityDto } from '../dto/guardianship.dto';

@Controller('guardianship')
@UseGuards(JwtAuthGuard)
export class GuardianshipController {
  constructor(private readonly guardianshipService: GuardianshipService) {}

  // ==========================================================================
  // ELIGIBILITY TOOLS
  // ==========================================================================

  @Post('check-eligibility')
  @HttpCode(HttpStatus.OK)
  async checkEligibility(@Body() dto: CheckGuardianEligibilityDto) {
    return this.guardianshipService.checkGuardianEligibility(
      dto.guardianId,
      dto.wardId,
      dto.checklist,
    );
  }

  @Get('checklist-template')
  getChecklistTemplate() {
    return {
      title: 'Guardian Eligibility Checklist',
      subtitle: 'Based on Kenyan Children Act (Cap 141)',
      sections: [
        {
          category: 'Basic Requirements',
          checks: [
            {
              key: 'isOver18',
              label: 'Is the guardian over 18 years old?',
              required: true,
              legalRef: 'Section 70, Children Act',
            },
            {
              key: 'hasNoCriminalRecord',
              label: 'Does the guardian have no criminal record?',
              required: true,
              legalRef: 'Section 71, Children Act',
            },
            {
              key: 'isMentallyCapable',
              label: 'Is the guardian of sound mind?',
              required: true,
              legalRef: 'Section 71, Children Act',
            },
          ],
        },
        {
          category: 'Financial & Stability',
          checks: [
            {
              key: 'hasFinancialStability',
              label: 'Does the guardian have financial stability to provide for the ward?',
              required: false,
            },
            {
              key: 'hasStableResidence',
              label: 'Does the guardian have a stable residence?',
              required: false,
            },
          ],
        },
        {
          category: 'Character & Suitability',
          checks: [
            {
              key: 'hasGoodMoralCharacter',
              label: 'Does the guardian have good moral character?',
              required: false,
            },
            {
              key: 'isNotBeneficiary',
              label: 'Is the guardian NOT a beneficiary of the estate? (No conflict of interest)',
              required: false,
              legalRef: 'Section 72, Children Act',
            },
            {
              key: 'hasNoSubstanceAbuse',
              label: 'Is the guardian free from drug/alcohol abuse?',
              required: false,
            },
          ],
        },
        {
          category: 'Relationship & Legal',
          checks: [
            {
              key: 'hasCloseRelationship',
              label: 'Does the guardian have a close relationship with the ward?',
              required: false,
            },
            {
              key: 'understandsLegalDuties',
              label: 'Does the guardian understand their legal duties?',
              required: false,
            },
            {
              key: 'willingToPostBond',
              label: 'Is the guardian willing to post a bond if required?',
              required: false,
              legalRef: 'Section 72, Children Act',
            },
          ],
        },
      ],
      scoringInfo: {
        eligibilityWeight: 60,
        proximityWeight: 20,
        relationshipWeight: 20,
        passingScore: 60,
        excellentScore: 80,
      },
    };
  }

  // ==========================================================================
  // ASSIGNMENT OPERATIONS
  // ==========================================================================

  @Post(':familyId/assign')
  @HttpCode(HttpStatus.CREATED)
  async assignGuardian(@Param('familyId') familyId: string, @Body() dto: AssignGuardianDto) {
    return this.guardianshipService.assignGuardian(familyId, dto);
  }

  @Get('ward/:wardId/status')
  async getGuardianshipStatus(@Param('wardId') wardId: string) {
    return this.guardianshipService.getGuardianshipStatus(wardId);
  }
}
