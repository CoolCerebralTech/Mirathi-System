import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser, JwtAuthGuard, type JwtPayload } from '@shamba/auth';

// Mappers & DTOs
import { Result } from '../../../application/common/result';
// Application Queries
import { GetActiveWillQuery } from '../../../application/will/queries/impl/get-active-will.query';
import { GetExecutorAssignmentsQuery } from '../../../application/will/queries/impl/get-executor-assignments.query';
import { GetTestatorHistoryQuery } from '../../../application/will/queries/impl/get-testator-history.query';
import { GetWillByIdQuery } from '../../../application/will/queries/impl/get-will-by-id.query';
import { GetWillComplianceReportQuery } from '../../../application/will/queries/impl/get-will-compliance-report.query';
import { SearchWillsQuery } from '../../../application/will/queries/impl/search-wills.query';
// View Models
import { ComplianceReportVm } from '../../../application/will/queries/view-models/compliance-report.vm';
import { ExecutorDashboardItemVm } from '../../../application/will/queries/view-models/executor-dashboard.vm';
import { WillDetailVm } from '../../../application/will/queries/view-models/will-detail.vm';
import { WillSummaryVm } from '../../../application/will/queries/view-models/will-summary.vm';
import { PaginatedResult } from '../../../domain/interfaces/will.repository.interface';
import { WillSearchFilterDto } from '../dto/request/will-search-filter.dto';
import { ComplianceReportResponseDto } from '../dto/response/compliance-report.response.dto';
import { ExecutorAssignmentResponseDto } from '../dto/response/executor-assignment.response.dto';
import { PaginatedWillResponseDto } from '../dto/response/paginated-will.response.dto';
import { WillDetailResponseDto } from '../dto/response/will-detail.response.dto';
import { WillSummaryResponseDto } from '../dto/response/will-summary.response.dto';
import { WillPresenterMapper } from '../mappers/will-presenter.mapper';

@ApiTags('Wills (Queries)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wills')
export class WillQueryController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('active')
  @ApiOperation({ summary: 'Get my currently Active Will' })
  @ApiResponse({ status: 200, type: WillDetailResponseDto })
  async getActiveWill(@CurrentUser() user: JwtPayload) {
    const query = new GetActiveWillQuery({
      testatorId: user.sub,
      userId: user.sub,
    });

    const result = await this.queryBus.execute<GetActiveWillQuery, Result<WillDetailVm | null>>(
      query,
    );
    const vm = this.handleResult(result);

    if (!vm) return null;
    return WillPresenterMapper.toDetailDto(vm);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get history of all my wills (Draft, Revoked, Active)' })
  @ApiResponse({ status: 200, type: [WillSummaryResponseDto] })
  async getHistory(@CurrentUser() user: JwtPayload) {
    const query = new GetTestatorHistoryQuery({
      testatorId: user.sub,
      userId: user.sub,
    });

    const result = await this.queryBus.execute<GetTestatorHistoryQuery, Result<WillSummaryVm[]>>(
      query,
    );
    const vms = this.handleResult(result);

    return vms.map((vm) => WillPresenterMapper.toSummaryDto(vm));
  }

  @Get('search')
  @ApiOperation({ summary: 'Search Wills (Admin/Registry)' })
  @ApiResponse({ status: 200, type: PaginatedWillResponseDto })
  async searchWills(@CurrentUser() user: JwtPayload, @Query() filters: WillSearchFilterDto) {
    // 🛠️ FIX: Manually map string dates from Query Params to Date objects
    // The HTTP layer (filters) gives strings; The Application layer (criteria) expects Dates.
    const query = new SearchWillsQuery({
      criteria: {
        ...filters,
        createdFrom: filters.createdFrom ? new Date(filters.createdFrom) : undefined,
        createdTo: filters.createdTo ? new Date(filters.createdTo) : undefined,
        // If you add executedFrom/To to the Request DTO later, map them here too
      },
      userId: user.sub,
    });

    const result = await this.queryBus.execute<
      SearchWillsQuery,
      Result<PaginatedResult<WillSummaryVm>>
    >(query);
    const paginatedVm = this.handleResult(result);

    return WillPresenterMapper.toPaginatedDto(paginatedVm);
  }

  @Get('executor-assignments')
  @ApiOperation({ summary: 'Get my jobs (Wills where I am Executor)' })
  @ApiResponse({ status: 200, type: [ExecutorAssignmentResponseDto] })
  async getExecutorAssignments(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string[],
  ) {
    // Ensure status is an array even if single value provided
    const statusArray = Array.isArray(status) ? status : status ? [status] : undefined;

    const query = new GetExecutorAssignmentsQuery({
      executorIdentifier: user.sub,
      willStatus: statusArray,
      userId: user.sub,
    });

    const result = await this.queryBus.execute<
      GetExecutorAssignmentsQuery,
      Result<ExecutorDashboardItemVm[]>
    >(query);
    const vms = this.handleResult(result);

    return vms.map((vm) => WillPresenterMapper.toExecutorAssignmentDto(vm));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Will Details' })
  @ApiResponse({ status: 200, type: WillDetailResponseDto })
  async getWillById(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) willId: string,
    @Query('includeDetails') includeDetails?: string, // Query params come as strings usually
  ) {
    // Convert 'true'/'false' string to boolean
    const includeDetailsBool = includeDetails !== 'false';

    const query = new GetWillByIdQuery({
      willId,
      userId: user.sub,
      includeDetails: includeDetailsBool,
    });

    const result = await this.queryBus.execute<GetWillByIdQuery, Result<WillDetailVm>>(query);
    const vm = this.handleResult(result);

    return WillPresenterMapper.toDetailDto(vm);
  }

  @Get(':id/compliance')
  @ApiOperation({ summary: 'Get Legal Compliance Report (Radar)' })
  @ApiResponse({ status: 200, type: ComplianceReportResponseDto })
  async getComplianceReport(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) willId: string,
    @Query('scope') scope?: 'INTERNAL' | 'FULL',
  ) {
    const query = new GetWillComplianceReportQuery({
      willId,
      userId: user.sub,
      scope: scope || 'INTERNAL',
    });

    const result = await this.queryBus.execute<
      GetWillComplianceReportQuery,
      Result<ComplianceReportVm>
    >(query);
    const vm = this.handleResult(result);

    return WillPresenterMapper.toComplianceReportDto(vm);
  }

  // --- Helper to Unpack Result<T> ---
  private handleResult<T>(result: Result<T>): T {
    if (result.isFailure) {
      const error = result.error;
      const message = error ? error.message : 'Operation failed';

      if (error?.name === 'NotFoundError') {
        throw new HttpException(message, HttpStatus.NOT_FOUND);
      }
      if (error?.name === 'SecurityError') {
        throw new HttpException(message, HttpStatus.FORBIDDEN);
      }

      throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return result.getValue();
  }
}
