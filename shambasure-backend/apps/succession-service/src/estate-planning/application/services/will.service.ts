// estate-planning/application/services/will.service.ts
import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { CommandBus, QueryBus, EventBus } from '@nestjs/cqrs';
import { WillStatus } from '@prisma/client';
import { WillRepositoryInterface } from '../../domain/repositories/will.repository.interface';
import { WillValidationService } from '../../domain/services/will-validation.service';
import { LegalCapacity } from '../../domain/value-objects/legal-capacity.vo';
import { CreateWillCommand } from '../commands/create-will.command';
import { UpdateWillCommand } from '../commands/update-will.command';
import { ActivateWillCommand } from '../commands/activate-will.command';
import { RevokeWillCommand } from '../commands/revoke-will.command';
import { GetWillQuery } from '../queries/get-will.query';
import { ListWillsQuery } from '../queries/list-wills.query';
import { WillResponseDto } from '../dto/response/will.response.dto';

@Injectable()
export class WillService {
  private readonly logger = new Logger(WillService.name);

  constructor(
    private readonly willRepository: WillRepositoryInterface,
    private readonly willValidationService: WillValidationService,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly eventBus: EventBus,
  ) {}

  async createWill(createWillDto: any, testatorId: string): Promise<WillResponseDto> {
    try {
      // Validate testator has legal capacity (in reality, we'd check this from user service)
      const legalCapacity = LegalCapacity.createValidAssessment();

      const command = new CreateWillCommand(
        testatorId,
        createWillDto.title,
        createWillDto.funeralWishes,
        createWillDto.residuaryClause,
        createWillDto.digitalAssetInstructions,
        createWillDto.specialInstructions,
        createWillDto.requiresWitnesses,
      );

      // In CQRS, we'd use command bus, but for now we'll implement directly
      const willAggregate = await this.createWillHandler(command, legalCapacity);

      return this.mapToWillResponseDto(willAggregate);
    } catch (error) {
      this.logger.error(`Failed to create will for testator ${testatorId}:`, error);
      throw new BadRequestException(`Could not create will: ${error.message}`);
    }
  }

  async getWill(willId: string, testatorId: string): Promise<WillResponseDto> {
    try {
      const willAggregate = await this.willRepository.findById(willId);

      if (!willAggregate) {
        throw new NotFoundException(`Will ${willId} not found`);
      }

      const will = willAggregate.getWill();
      if (will.getTestatorId() !== testatorId) {
        throw new BadRequestException('Access denied to this will');
      }

      return this.mapToWillResponseDto(willAggregate);
    } catch (error) {
      this.logger.error(`Failed to get will ${willId}:`, error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Could not retrieve will: ${error.message}`);
    }
  }

  async listWills(
    testatorId: string,
    status?: WillStatus,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    wills: WillResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const wills = await this.willRepository.findByTestatorId(testatorId);

      // Filter by status if provided
      const filteredWills = status
        ? wills.filter((will) => will.getWill().getStatus() === status)
        : wills;

      // Paginate results
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedWills = filteredWills.slice(startIndex, endIndex);

      const willDtos = paginatedWills.map((will) => this.mapToWillResponseDto(will));

      return {
        wills: willDtos,
        total: filteredWills.length,
        page,
        totalPages: Math.ceil(filteredWills.length / limit),
      };
    } catch (error) {
      this.logger.error(`Failed to list wills for testator ${testatorId}:`, error);
      throw new BadRequestException(`Could not list wills: ${error.message}`);
    }
  }

  async updateWill(
    willId: string,
    updateWillDto: any,
    testatorId: string,
  ): Promise<WillResponseDto> {
    try {
      const willAggregate = await this.willRepository.findById(willId);

      if (!willAggregate) {
        throw new NotFoundException(`Will ${willId} not found`);
      }

      const will = willAggregate.getWill();
      if (will.getTestatorId() !== testatorId) {
        throw new BadRequestException('Access denied to this will');
      }

      if (!will.canBeModified()) {
        throw new BadRequestException('Cannot modify will in its current status');
      }

      // Update will details
      willAggregate.updateWillDetails(
        updateWillDto.title || will.getTitle(),
        updateWillDto.funeralWishes,
        updateWillDto.burialLocation,
        updateWillDto.residuaryClause,
        updateWillDto.digitalAssetInstructions,
        updateWillDto.specialInstructions,
      );

      // Create new version if significant changes
      will.createNewVersion();

      await this.willRepository.save(willAggregate);

      return this.mapToWillResponseDto(willAggregate);
    } catch (error) {
      this.logger.error(`Failed to update will ${willId}:`, error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Could not update will: ${error.message}`);
    }
  }

  async activateWill(
    willId: string,
    activateWillDto: any,
    activatedBy: string,
  ): Promise<WillResponseDto> {
    try {
      const willAggregate = await this.willRepository.findById(willId);

      if (!willAggregate) {
        throw new NotFoundException(`Will ${willId} not found`);
      }

      // Set legal capacity assessment
      const legalCapacity = new LegalCapacity(
        activateWillDto.legalCapacityAssessment,
        'Activated by administrator',
      );

      willAggregate.setLegalCapacity(legalCapacity);

      // Validate will completeness
      const validation = willAggregate.validateWillCompleteness();
      if (!validation.isValid) {
        throw new BadRequestException(`Will cannot be activated: ${validation.issues.join(', ')}`);
      }

      // Activate the will
      willAggregate.activate(activatedBy);

      await this.willRepository.save(willAggregate);

      return this.mapToWillResponseDto(willAggregate);
    } catch (error) {
      this.logger.error(`Failed to activate will ${willId}:`, error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Could not activate will: ${error.message}`);
    }
  }

  async revokeWill(
    willId: string,
    revokeWillDto: any,
    revokedBy: string,
  ): Promise<WillResponseDto> {
    try {
      const willAggregate = await this.willRepository.findById(willId);

      if (!willAggregate) {
        throw new NotFoundException(`Will ${willId} not found`);
      }

      const will = willAggregate.getWill();
      if (!will.isRevocable()) {
        throw new BadRequestException('Will cannot be revoked in its current status');
      }

      // Revoke the will
      will.revoke(revokedBy, revokeWillDto.reason);

      await this.willRepository.save(willAggregate);

      return this.mapToWillResponseDto(willAggregate);
    } catch (error) {
      this.logger.error(`Failed to revoke will ${willId}:`, error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Could not revoke will: ${error.message}`);
    }
  }

  async validateWill(
    willId: string,
    testatorId: string,
  ): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    recommendations: string[];
    complianceLevel: string;
  }> {
    try {
      const willAggregate = await this.willRepository.findById(willId);

      if (!willAggregate) {
        throw new NotFoundException(`Will ${willId} not found`);
      }

      if (willAggregate.getWill().getTestatorId() !== testatorId) {
        throw new BadRequestException('Access denied to this will');
      }

      // Get testator context (in reality, we'd fetch from user service)
      const context = {
        testatorAge: 30, // This would come from user profile
        familyMembers: [], // This would come from family service
        legalCapacity: willAggregate.getLegalCapacity() || LegalCapacity.createValidAssessment(),
      };

      return await this.willValidationService.validateWill(willAggregate, context);
    } catch (error) {
      this.logger.error(`Failed to validate will ${willId}:`, error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Could not validate will: ${error.message}`);
    }
  }

  private async createWillHandler(
    command: CreateWillCommand,
    legalCapacity: LegalCapacity,
  ): Promise<any> {
    const willId = `will_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const willAggregate = await this.willRepository.transaction(async () => {
      const willAggregate = await this.willRepository.create(
        willId,
        command.title,
        command.testatorId,
        legalCapacity,
      );

      // Set additional properties
      const will = willAggregate.getWill();
      will.updateDetails(
        command.funeralWishes,
        command.funeralWishes?.burialLocation,
        command.residuaryClause,
        command.digitalAssetInstructions,
        command.specialInstructions,
      );

      if (command.requiresWitnesses !== undefined) {
        // will.requiresWitnesses = command.requiresWitnesses; // Would need setter method
      }

      return willAggregate;
    });

    await this.willRepository.save(willAggregate);
    return willAggregate;
  }

  private mapToWillResponseDto(willAggregate: any): WillResponseDto {
    const will = willAggregate.getWill();
    const validation = willAggregate.validateWillCompleteness();

    return {
      id: will.getId(),
      title: will.getTitle(),
      status: will.getStatus(),
      testatorId: will.getTestatorId(),
      willDate: will.getWillDate(),
      lastModified: will.getLastModified(),
      versionNumber: will.getVersionNumber(),
      activatedAt: will.getActivatedAt(),
      executedAt: will.getExecutedAt(),
      revokedAt: will.getRevokedAt(),
      funeralWishes: will.getFuneralWishes(),
      burialLocation: will.getBurialLocation(),
      residuaryClause: will.getResiduaryClause(),
      requiresWitnesses: will.getRequiresWitnesses(),
      witnessCount: will.getWitnessCount(),
      hasAllWitnesses: will.getHasAllWitnesses(),
      digitalAssetInstructions: will.getDigitalAssetInstructions(),
      specialInstructions: will.getSpecialInstructions(),
      isActive: will.getIsActive(),
      createdAt: will.getCreatedAt(),
      updatedAt: will.getUpdatedAt(),
      canBeModified: will.canBeModified(),
      isActiveWill: will.isActiveWill(),
      isRevocable: will.isRevocable(),
      legalCompliance: {
        isValid: validation.isValid,
        issues: validation.issues,
      },
    };
  }
}
