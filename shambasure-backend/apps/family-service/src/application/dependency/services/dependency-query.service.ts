// application/dependency/services/queries/dependency-query.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { v4 as uuidv4 } from 'uuid';

import { DependencyAssessmentResponse } from '../dto/response';
import { DependencyMapper } from '../mappers/dependency.mapper';
import {
  ApplicationResponse,
  IDependencyQueryService,
  PaginatedApplicationResponse,
  QueryMetadata,
} from '../ports/inbound/dependency.use-case';

@Injectable()
export class DependencyQueryService implements IDependencyQueryService {
  private readonly logger = new Logger(DependencyQueryService.name);

  constructor(
    private readonly queryBus: QueryBus,
    private readonly mapper: DependencyMapper,
  ) {}

  async getDependencyById(
    dependencyId: string,
    options?: any,
    metadata?: QueryMetadata,
    requestId?: string,
  ): Promise<ApplicationResponse<DependencyAssessmentResponse>> {
    const queryRequestId = requestId || uuidv4();
    const startTime = Date.now();

    try {
      const query = this.mapper.toGetDependencyByIdQuery(
        dependencyId,
        options,
        metadata,
        queryRequestId,
      );

      const result = await this.queryBus.execute(query);

      return this.createQueryResponse(
        result,
        queryRequestId,
        startTime,
        'Dependency assessment retrieved successfully',
      );
    } catch (error) {
      return this.createQueryErrorResponse(
        error,
        queryRequestId,
        startTime,
        'Failed to retrieve dependency assessment',
      );
    }
  }

  async listDependenciesByDeceased(
    deceasedId: string,
    options?: any,
    metadata?: QueryMetadata,
    requestId?: string,
  ): Promise<PaginatedApplicationResponse<DependencyAssessmentResponse>> {
    const queryRequestId = requestId || uuidv4();
    const startTime = Date.now();

    try {
      const query = this.mapper.toListDependenciesByDeceasedQuery(
        deceasedId,
        options,
        metadata,
        queryRequestId,
      );

      const result = await this.queryBus.execute(query);

      const response: PaginatedApplicationResponse<DependencyAssessmentResponse> = {
        success: result.success,
        data: result.data,
        message: result.message,
        warnings: result.warnings,
        requestId: queryRequestId,
        timestamp: new Date().toISOString(),
        executionTimeMs: result.executionTimeMs,
        pagination: result.pagination,
      };

      this.logQuerySuccess(queryRequestId, startTime, deceasedId, result.data?.length);

      return response;
    } catch (error) {
      return this.createPaginatedErrorResponse(
        error,
        queryRequestId,
        startTime,
        'Failed to list dependencies',
      );
    }
  }

  async checkS29Compliance(
    deceasedId: string,
    options?: any,
    metadata?: QueryMetadata,
    requestId?: string,
  ): Promise<ApplicationResponse<any>> {
    const queryRequestId = requestId || uuidv4();
    const startTime = Date.now();

    try {
      const query = this.mapper.toCheckS29ComplianceQuery(
        deceasedId,
        options,
        metadata,
        queryRequestId,
      );

      const result = await this.queryBus.execute(query);

      return this.createQueryResponse(
        result,
        queryRequestId,
        startTime,
        'S.29 compliance check completed',
      );
    } catch (error) {
      return this.createQueryErrorResponse(
        error,
        queryRequestId,
        startTime,
        'Failed to check S.29 compliance',
      );
    }
  }

  async getDependencyStatistics(
    deceasedId: string,
    options?: any,
    metadata?: QueryMetadata,
    requestId?: string,
  ): Promise<ApplicationResponse<any>> {
    const queryRequestId = requestId || uuidv4();
    const startTime = Date.now();

    try {
      const query = this.mapper.toGetDependencyStatisticsQuery(
        deceasedId,
        options,
        metadata,
        queryRequestId,
      );

      const result = await this.queryBus.execute(query);

      return this.createQueryResponse(
        result,
        queryRequestId,
        startTime,
        'Dependency statistics retrieved',
      );
    } catch (error) {
      return this.createQueryErrorResponse(
        error,
        queryRequestId,
        startTime,
        'Failed to get dependency statistics',
      );
    }
  }

  private createQueryResponse(
    result: any,
    requestId: string,
    startTime: number,
    message: string,
  ): ApplicationResponse {
    const executionTime = Date.now() - startTime;

    return {
      success: result.success,
      data: result.data,
      message,
      warnings: result.warnings,
      errors: result.errors,
      requestId,
      timestamp: new Date().toISOString(),
      executionTimeMs: result.executionTimeMs || executionTime,
    };
  }

  private createQueryErrorResponse(
    error: Error,
    requestId: string,
    startTime: number,
    message: string,
  ): ApplicationResponse {
    const executionTime = Date.now() - startTime;

    this.logger.error(`Query execution failed - Request ID: ${requestId}`, error.stack, {
      error: error.message,
      executionTime,
    });

    return {
      success: false,
      message: `${message}: ${error.message}`,
      errors: ['QUERY_EXECUTION_ERROR'],
      requestId,
      timestamp: new Date().toISOString(),
      executionTimeMs: executionTime,
    };
  }

  private createPaginatedErrorResponse(
    error: Error,
    requestId: string,
    startTime: number,
    message: string,
  ): PaginatedApplicationResponse<any> {
    const executionTime = Date.now() - startTime;

    this.logger.error(`Query execution failed - Request ID: ${requestId}`, error.stack, {
      error: error.message,
      executionTime,
    });

    return {
      success: false,
      message: `${message}: ${error.message}`,
      errors: ['QUERY_EXECUTION_ERROR'],
      requestId,
      timestamp: new Date().toISOString(),
      executionTimeMs: executionTime,
    };
  }

  private logQuerySuccess(
    requestId: string,
    startTime: number,
    deceasedId: string,
    count?: number,
  ): void {
    const executionTime = Date.now() - startTime;

    this.logger.log(`Query executed successfully - Request ID: ${requestId}`, {
      deceasedId,
      count,
      executionTime,
    });
  }
}
