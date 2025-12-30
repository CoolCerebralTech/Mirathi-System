import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '@shamba/auth';

// Queries
import {
  GetApplicationDashboardQuery,
  GetConsentStatusQuery,
  GetGeneratedFormsQuery,
  ValidateFilingReadinessQuery,
} from '../../../application/probate/queries/impl/probate.queries';
import { ConsentMatrixResponseDto } from '../dtos/response/consent-matrix.response.dto';
import { FilingReadinessResponseDto } from '../dtos/response/filing-readiness.response.dto';
import { FormBundleResponseDto } from '../dtos/response/form-bundle.response.dto';
// Response DTOs
import { ProbateDashboardResponseDto } from '../dtos/response/probate-dashboard.response.dto';
// Mapper
import { ProbatePresenterMapper } from '../mappers/probate-presenter.mapper';

@ApiTags('Probate Application [Queries]')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('probate')
export class ProbateQueryController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':id/dashboard')
  @ApiOperation({ summary: 'Get main application dashboard' })
  @ApiResponse({ status: 200, type: ProbateDashboardResponseDto })
  async getDashboard(@Param('id') id: string): Promise<ProbateDashboardResponseDto> {
    const query = new GetApplicationDashboardQuery({ applicationId: id });
    const result = await this.queryBus.execute(query);

    if (result.isFailure) throw new Error(result.error?.message);
    return ProbatePresenterMapper.toDashboardResponse(result.getValue());
  }

  @Get(':id/forms')
  @ApiOperation({ summary: 'Get generated form bundle status' })
  @ApiResponse({ status: 200, type: FormBundleResponseDto })
  async getForms(@Param('id') id: string): Promise<FormBundleResponseDto> {
    const query = new GetGeneratedFormsQuery({ applicationId: id });
    const result = await this.queryBus.execute(query);

    if (result.isFailure) throw new Error(result.error?.message);
    return ProbatePresenterMapper.toFormBundleResponse(result.getValue());
  }

  @Get(':id/consents')
  @ApiOperation({ summary: 'Get family consent matrix' })
  @ApiResponse({ status: 200, type: ConsentMatrixResponseDto })
  async getConsents(@Param('id') id: string): Promise<ConsentMatrixResponseDto> {
    const query = new GetConsentStatusQuery({ applicationId: id });
    const result = await this.queryBus.execute(query);

    if (result.isFailure) throw new Error(result.error?.message);
    return ProbatePresenterMapper.toConsentMatrixResponse(result.getValue());
  }

  @Get(':id/filing/readiness')
  @ApiOperation({ summary: 'Check filing readiness and fees' })
  @ApiResponse({ status: 200, type: FilingReadinessResponseDto })
  async getFilingReadiness(@Param('id') id: string): Promise<FilingReadinessResponseDto> {
    const query = new ValidateFilingReadinessQuery({ applicationId: id });
    const result = await this.queryBus.execute(query);

    if (result.isFailure) throw new Error(result.error?.message);
    return ProbatePresenterMapper.toFilingReadinessResponse(result.getValue());
  }
}
