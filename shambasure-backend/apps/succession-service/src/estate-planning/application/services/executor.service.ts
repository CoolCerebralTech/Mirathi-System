// estate-planning/application/services/executor.service.ts
import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ExecutorStatus } from '@prisma/client';
import { ExecutorRepositoryInterface } from '../../domain/repositories/executor.repository.interface';
import { WillRepositoryInterface } from '../../domain/repositories/will.repository.interface';
import { AssetValue } from '../../domain/value-objects/asset-value.vo';
import { NominateExecutorCommand } from '../commands/nominate-executor.command';
import { GetExecutorsQuery } from '../queries/get-executors.query';
import { ExecutorResponseDto } from '../dto/response/executor.response.dto';

@Injectable()
export class ExecutorService {
  private readonly logger = new Logger(ExecutorService.name);

  constructor(
    private readonly executorRepository: ExecutorRepositoryInterface,
    private readonly willRepository: WillRepositoryInterface
  ) {}

  async nominateExecutor(nominateExecutorDto: any, willId: string, testatorId: string): Promise<ExecutorResponseDto> {
    try {
      const willAggregate = await this.willRepository.findById(willId);
      
      if (!willAggregate) {
        throw new NotFoundException(`Will ${willId} not found`);
      }

      if (willAggregate.getWill().getTestatorId() !== testatorId) {
        throw new BadRequestException('Access denied to this will');
      }

      if (!willAggregate.getWill().canBeModified()) {
        throw new BadRequestException('Cannot nominate executors to will in its current status');
      }

      // Create executor entity based on type
      const executorId = `executor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      let executor;

      switch (nominateExecutorDto.executorType) {
        case 'USER':
          executor = {
            getId: () => executorId,
            getWillId: () => willId,
            getExecutorInfo: () => ({
              userId: nominateExecutorDto.executorId,
              relationship: nominateExecutorDto.relationship
            }),
            getIsPrimary: () => nominateExecutorDto.isPrimary || false,
            getOrderOfPriority: () => nominateExecutorDto.orderOfPriority || 1
          } as any;
          break;

        case 'EXTERNAL':
          if (!nominateExecutorDto.externalExecutor?.fullName || 
              !nominateExecutorDto.externalExecutor?.email || 
              !nominateExecutorDto.externalExecutor?.phone) {
            throw new BadRequestException('External executor requires full name, email, and phone');
          }
          executor = {
            getId: () => executorId,
            getWillId: () => willId,
            getExecutorInfo: () => ({
              fullName: nominateExecutorDto.externalExecutor.fullName,
              email: nominateExecutorDto.externalExecutor.email,
              phone: nominateExecutorDto.externalExecutor.phone,
              relationship: nominateExecutorDto.externalExecutor.relationship,
              address: nominateExecutorDto.externalExecutor.address
            }),
            getIsPrimary: () => nominateExecutorDto.isPrimary || false,
            getOrderOfPriority: () => nominateExecutorDto.orderOfPriority || 1
          } as any;
          break;

        default:
          throw new BadRequestException('Invalid executor type');
      }

      // Set additional properties
      Object.assign(executor, {
        status: ExecutorStatus.NOMINATED,
        isCompensated: nominateExecutorDto.isCompensated || false,
        compensationAmount: nominateExecutorDto.compensationAmount
          ? new AssetValue(nominateExecutorDto.compensationAmount, 'KES')
          : null
      });

      // Add executor to will aggregate
      willAggregate.nominateExecutor(executor);

      await this.willRepository.save(willAggregate);

      return this.mapToExecutorResponseDto(executor);
    } catch (error) {
      this.logger.error(`Failed to nominate executor to will ${willId}:`, error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Could not nominate executor: ${error.message}`);
    }
  }

  async getExecutors(willId: string, testatorId: string): Promise<{
    executors: ExecutorResponseDto[];
    primaryExecutor?: ExecutorResponseDto;
    summary: {
      totalExecutors: number;
      activeExecutors: number;
      nominatedExecutors: number;
    };
  }> {
    try {
      const willAggregate = await this.willRepository.findById(willId);
      
      if (!willAggregate) {
        throw new NotFoundException(`Will ${willId} not found`);
      }

      if (willAggregate.getWill().getTestatorId() !== testatorId) {
        throw new BadRequestException('Access denied to this will');
      }

      const executors = willAggregate.getAllExecutors();
      const primaryExecutor = willAggregate.getPrimaryExecutor();

      const executorDtos = executors.map(executor => this.mapToExecutorResponseDto(executor));
      const primaryExecutorDto = primaryExecutor ? this.mapToExecutorResponseDto(primaryExecutor) : undefined;

      const summary = {
        totalExecutors: executors.length,
        activeExecutors: executors.filter(e => e.isActive()).length,
        nominatedExecutors: executors.filter(e => e.getStatus() === ExecutorStatus.NOMINATED).length
      };

      return {
        executors: executorDtos,
        primaryExecutor: primaryExecutorDto,
        summary
      };
    } catch (error) {
      this.logger.error(`Failed to get executors for will ${willId}:`, error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Could not retrieve executors: ${error.message}`);
    }
  }

  async updateExecutorPriority(executorId: string, priority: number, willId: string, testatorId: string): Promise<ExecutorResponseDto> {
    try {
      const willAggregate = await this.willRepository.findById(willId);
      
      if (!willAggregate) {
        throw new NotFoundException(`Will ${willId} not found`);
      }

      if (willAggregate.getWill().getTestatorId() !== testatorId) {
        throw new BadRequestException('Access denied to this will');
      }

      if (!willAggregate.getWill().canBeModified()) {
        throw new BadRequestException('Cannot update executors in will in its current status');
      }

      const executor = willAggregate.getExecutor(executorId);
      if (!executor) {
        throw new NotFoundException(`Executor ${executorId} not found in will`);
      }

      willAggregate.updateExecutorPriority(executorId, priority);

      await this.willRepository.save(willAggregate);

      return this.mapToExecutorResponseDto(executor);
    } catch (error) {
      this.logger.error(`Failed to update executor priority for ${executorId}:`, error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Could not update executor priority: ${error.message}`);
    }
  }

  async removeExecutor(executorId: string, willId: string, testatorId: string): Promise<void> {
    try {
      const willAggregate = await this.willRepository.findById(willId);
      
      if (!willAggregate) {
        throw new NotFoundException(`Will ${willId} not found`);
      }

      if (willAggregate.getWill().getTestatorId() !== testatorId) {
        throw new BadRequestException('Access denied to this will');
      }

      if (!willAggregate.getWill().canBeModified()) {
        throw new BadRequestException('Cannot remove executors from will in its current status');
      }

      willAggregate.removeExecutor(executorId);

      await this.willRepository.save(willAggregate);
    } catch (error) {
      this.logger.error(`Failed to remove executor ${executorId} from will ${willId}:`, error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Could not remove executor: ${error.message}`);
    }
  }

  async acceptExecutorRole(executorId: string, userId: string): Promise<ExecutorResponseDto> {
    try {
      const executor = await this.executorRepository.findById(executorId);
      if (!executor) {
        throw new NotFoundException(`Executor ${executorId} not found`);
      }

      // Verify the user is the nominated executor
      const executorInfo = executor.getExecutorInfo();
      if (executorInfo.userId !== userId) {
        throw new BadRequestException('You are not nominated as this executor');
      }

      executor.accept();

      await this.executorRepository.save(executor);

      return this.mapToExecutorResponseDto(executor);
    } catch (error) {
      this.logger.error(`Failed to accept executor role ${executorId}:`, error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Could not accept executor role: ${error.message}`);
    }
  }

  async declineExecutorRole(executorId: string, userId: string, reason: string): Promise<ExecutorResponseDto> {
    try {
      const executor = await this.executorRepository.findById(executorId);
      if (!executor) {
        throw new NotFoundException(`Executor ${executorId} not found`);
      }

      // Verify the user is the nominated executor
      const executorInfo = executor.getExecutorInfo();
      if (executorInfo.userId !== userId) {
        throw new BadRequestException('You are not nominated as this executor');
      }

      executor.decline(reason);

      await this.executorRepository.save(executor);

      return this.mapToExecutorResponseDto(executor);
    } catch (error) {
      this.logger.error(`Failed to decline executor role ${executorId}:`, error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Could not decline executor role: ${error.message}`);
    }
  }

  async getExecutorDuties(userId: string): Promise<ExecutorResponseDto[]> {
    try {
      const executors = await this.executorRepository.findExecutorDuties(userId);
      return executors.map(executor => this.mapToExecutorResponseDto(executor));
    } catch (error) {
      this.logger.error(`Failed to get executor duties for user ${userId}:`, error);
      throw new BadRequestException(`Could not retrieve executor duties: ${error.message}`);
    }
  }

  private mapToExecutorResponseDto(executor: any): ExecutorResponseDto {
    const executorInfo = executor.getExecutorInfo();
    
    return {
      id: executor.getId(),
      willId: executor.getWillId(),
      executorInfo: {
        userId: executorInfo.userId,
        fullName: executorInfo.fullName,
        email: executorInfo.email,
        phone: executorInfo.phone,
        relationship: executorInfo.relationship,
        address: executorInfo.address
      },
      isPrimary: executor.getIsPrimary(),
      orderOfPriority: executor.getOrderOfPriority(),
      status: executor.getStatus(),
      appointedAt: executor.getAppointedAt(),
      acceptedAt: executor.getAcceptedAt(),
      declinedAt: executor.getDeclinedAt(),
      declineReason: executor.getDeclineReason(),
      isCompensated: executor.getIsCompensated(),
      compensationAmount: executor.getCompensationAmount()?.getAmount(),
      createdAt: executor.getCreatedAt(),
      updatedAt: executor.getUpdatedAt(),
      executorName: executor.getExecutorName ? executor.getExecutorName() : 
        (executorInfo.fullName || `Executor ${executor.getId().substring(0, 8)}`),
      isExternal: executor.isExternal ? executor.isExternal() : 
        (!!executorInfo.fullName),
      isActive: executor.isActive ? executor.isActive() : 
        (executor.getStatus() === ExecutorStatus.ACTIVE),
      hasAccepted: executor.hasAccepted ? executor.hasAccepted() : 
        (!!executor.getAcceptedAt()),
      canAct: executor.canAct ? executor.canAct() : 
        (executor.getStatus() === ExecutorStatus.ACTIVE && !!executor.getAcceptedAt())
    };
  }
}