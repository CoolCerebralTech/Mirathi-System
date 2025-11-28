import { Controller, Post, Body, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shamba/auth';
import {
  CustomaryLawService,
  CustomaryAssessmentDto,
} from '../../application/services/customary-law.service';

// Inline DTO for the assessment request (or reuse from service if exported)
// Re-defining for Swagger visibility if necessary
class AssessUnionDto implements CustomaryAssessmentDto {
  @ApiProperty({ enum: ['NONE', 'PARTIAL', 'FULL'] })
  dowryPaymentStatus: 'NONE' | 'PARTIAL' | 'FULL';

  @ApiProperty({ required: false })
  ceremonyDate?: Date;

  @ApiProperty()
  witnessedByElders: boolean;

  @ApiProperty({ required: false })
  cohabitationStart?: Date;

  @ApiProperty()
  affidavitExists: boolean;
}

@ApiTags('Family Tree - Customary Law Tools')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('customary-law')
export class CustomaryLawController {
  constructor(private readonly customaryService: CustomaryLawService) {}

  @Post('assess-union')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Assess the legitimacy of a Customary Union',
    description: 'Returns legal strength analysis based on Kenyan Case Law precedents.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Assessment result.',
    schema: {
      example: {
        isValid: true,
        status: 'STRONG_CLAIM',
        advice: 'Union likely to be upheld by court.',
      },
    },
  })
  assessUnion(@Body() dto: AssessUnionDto) {
    return this.customaryService.assessUnionLegitimacy(dto);
  }
}
