// application/dependency/services/commands/dependency-command.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { v4 as uuidv4 } from 'uuid';

import {
  AssessFinancialDependencyRequest,
  CreateDependencyAssessmentRequest,
  FileS26ClaimRequest,
  RecordCourtProvisionRequest,
} from '../dto/request/';
import { DependencyAssessmentResponse } from '../dto/response/dependency-assessment.response';
import { DependencyMapper } from '../mappers/dependency.mapper';
import {
  ApplicationResponse,
  CommandMetadata,
  IDependencyCommandService,
} from '../ports/inbound/dependency.use-case';

@Injectable()
export class DependencyCommandService implements IDependencyCommandService {
  private readonly logger = new Logger(DependencyCommandService.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly mapper: DependencyMapper,
  ) {}

  async createDependencyAssessment(
    request: CreateDependencyAssessmentRequest,
    metadata: CommandMetadata,
    correlationId?: string,
  ): Promise<ApplicationResponse<DependencyAssessmentResponse>> {
    const requestId = uuidv4();
    const startTime = Date.now();

    try {
      this.logger.log(`Creating dependency assessment - Request ID: ${requestId}`, {
        deceasedId: request.deceasedId,
        dependantId: request.dependantId,
        userId: metadata.userId,
      });

      const command = this.mapper.toCreateDependencyAssessmentCommand(
        request,
        metadata,
        correlationId,
        requestId,
      );

      const result = await this.commandBus.execute(command);

      return this.createSuccessResponse(
        result,
        requestId,
        startTime,
        'Dependency assessment created successfully',
      );
    } catch (error) {
      return this.createErrorResponse(
        error,
        requestId,
        startTime,
        'Failed to create dependency assessment',
      );
    }
  }

  async assessFinancialDependency(
    request: AssessFinancialDependencyRequest,
    metadata: CommandMetadata,
    correlationId?: string,
  ): Promise<ApplicationResponse<DependencyAssessmentResponse>> {
    const requestId = uuidv4();
    const startTime = Date.now();

    try {
      this.logger.log(`Assessing financial dependency - Request ID: ${requestId}`, {
        dependencyAssessmentId: request.dependencyAssessmentId,
        userId: metadata.userId,
      });

      const command = this.mapper.toAssessFinancialDependencyCommand(
        request,
        metadata,
        correlationId,
        requestId,
      );

      const result = await this.commandBus.execute(command);

      return this.createSuccessResponse(
        result,
        requestId,
        startTime,
        'Financial dependency assessed successfully',
      );
    } catch (error) {
      return this.createErrorResponse(
        error,
        requestId,
        startTime,
        'Failed to assess financial dependency',
      );
    }
  }

  async fileS26Claim(
    request: FileS26ClaimRequest,
    metadata: CommandMetadata,
    correlationId?: string,
  ): Promise<ApplicationResponse<DependencyAssessmentResponse>> {
    const requestId = uuidv4();
    const startTime = Date.now();

    try {
      this.logger.log(`Filing S.26 claim - Request ID: ${requestId}`, {
        dependencyAssessmentId: request.dependencyAssessmentId,
        amount: request.amount,
        userId: metadata.userId,
      });

      const command = this.mapper.toFileS26ClaimCommand(
        request,
        metadata,
        correlationId,
        requestId,
      );

      const result = await this.commandBus.execute(command);

      return this.createSuccessResponse(
        result,
        requestId,
        startTime,
        'S.26 claim filed successfully',
      );
    } catch (error) {
      return this.createErrorResponse(error, requestId, startTime, 'Failed to file S.26 claim');
    }
  }

  async recordCourtProvision(
    request: RecordCourtProvisionRequest,
    metadata: CommandMetadata,
    correlationId?: string,
  ): Promise<ApplicationResponse<DependencyAssessmentResponse>> {
    const requestId = uuidv4();
    const startTime = Date.now();

    try {
      this.logger.log(`Recording court provision - Request ID: ${requestId}`, {
        dependencyAssessmentId: request.dependencyAssessmentId,
        orderNumber: request.orderNumber,
        amount: request.approvedAmount,
        userId: metadata.userId,
      });

      const command = this.mapper.toRecordCourtProvisionCommand(
        request,
        metadata,
        correlationId,
        requestId,
      );

      const result = await this.commandBus.execute(command);

      return this.createSuccessResponse(
        result,
        requestId,
        startTime,
        'Court provision recorded successfully',
      );
    } catch (error) {
      return this.createErrorResponse(
        error,
        requestId,
        startTime,
        'Failed to record court provision',
      );
    }
  }

  private createSuccessResponse(
    result: any,
    requestId: string,
    startTime: number,
    message: string,
  ): ApplicationResponse<DependencyAssessmentResponse> {
    const executionTime = Date.now() - startTime;

    this.logger.log(`Command executed successfully - Request ID: ${requestId}`, {
      executionTime,
      success: result.success,
    });

    return {
      success: result.success,
      data: result.data,
      message,
      warnings: result.warnings,
      requestId,
      timestamp: new Date().toISOString(),
      executionTimeMs: executionTime,
    };
  }

  private createErrorResponse(
    error: Error,
    requestId: string,
    startTime: number,
    message: string,
  ): ApplicationResponse {
    const executionTime = Date.now() - startTime;

    this.logger.error(`Command execution failed - Request ID: ${requestId}`, error.stack, {
      error: error.message,
      executionTime,
    });

    return {
      success: false,
      message: `${message}: ${error.message}`,
      errors: ['COMMAND_EXECUTION_ERROR'],
      requestId,
      timestamp: new Date().toISOString(),
      executionTimeMs: executionTime,
    };
  }
}
