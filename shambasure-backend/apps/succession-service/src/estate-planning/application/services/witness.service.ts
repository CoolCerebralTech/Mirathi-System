// estate-planning/application/services/witness.service.ts
import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { WitnessStatus } from '@prisma/client';
import { WitnessRepositoryInterface } from '../../domain/interfaces/witness.repository.interface';
import { WillRepositoryInterface } from '../../domain/interfaces/will.repository.interface';
import { KenyanId } from '../../domain/value-objects/kenyan-id.vo';
import { AddWitnessCommand } from '../commands/add-witness.command';
import { SignWillCommand } from '../commands/sign-will.command';
import { GetWitnessesQuery } from '../queries/get-witnesses.query';
import { WitnessResponseDto } from '../dto/response/witness.response.dto';

@Injectable()
export class WitnessService {
  private readonly logger = new Logger(WitnessService.name);

  constructor(
    private readonly witnessRepository: WitnessRepositoryInterface,
    private readonly willRepository: WillRepositoryInterface
  ) {}

  async addWitness(addWitnessDto: any, willId: string, testatorId: string): Promise<WitnessResponseDto> {
    try {
      const willAggregate = await this.willRepository.findById(willId);
      
      if (!willAggregate) {
        throw new NotFoundException(`Will ${willId} not found`);
      }

      if (willAggregate.getWill().getTestatorId() !== testatorId) {
        throw new BadRequestException('Access denied to this will');
      }

      if (willAggregate.getWill().getStatus() !== 'DRAFT' && willAggregate.getWill().getStatus() !== 'PENDING_WITNESS') {
        throw new BadRequestException('Cannot add witnesses to will in its current status');
      }

      // Create witness entity based on type
      const witnessId = `witness_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      let witness;

      switch (addWitnessDto.witnessType) {
        case 'USER':
          witness = {
            getId: () => witnessId,
            getWillId: () => willId,
            getWitnessInfo: () => ({
              userId: addWitnessDto.witnessId,
              fullName: 'User Witness', // Would fetch from user service
              relationship: addWitnessDto.relationship
            })
          } as any;
          break;

        case 'EXTERNAL':
          if (!addWitnessDto.externalWitness?.fullName || 
              !addWitnessDto.externalWitness?.idNumber || 
              !addWitnessDto.externalWitness?.email || 
              !addWitnessDto.externalWitness?.phone) {
            throw new BadRequestException('External witness requires full name, ID number, email, and phone');
          }

          // Validate Kenyan ID
          if (!KenyanId.isValid(addWitnessDto.externalWitness.idNumber)) {
            throw new BadRequestException('Invalid Kenyan ID number');
          }

          witness = {
            getId: () => witnessId,
            getWillId: () => willId,
            getWitnessInfo: () => ({
              fullName: addWitnessDto.externalWitness.fullName,
              idNumber: addWitnessDto.externalWitness.idNumber,
              email: addWitnessDto.externalWitness.email,
              phone: addWitnessDto.externalWitness.phone,
              relationship: addWitnessDto.externalWitness.relationship,
              address: addWitnessDto.externalWitness.address
            })
          } as any;
          break;

        default:
          throw new BadRequestException('Invalid witness type');
      }

      // Set initial properties
      Object.assign(witness, {
        status: WitnessStatus.PENDING,
        isEligible: true
      });

      // Add witness to will aggregate
      willAggregate.addWitness(witness);

      await this.willRepository.save(willAggregate);

      return this.mapToWitnessResponseDto(witness);
    } catch (error) {
      this.logger.error(`Failed to add witness to will ${willId}:`, error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Could not add witness: ${error.message}`);
    }
  }

  async getWitnesses(willId: string, testatorId: string): Promise<{
    witnesses: WitnessResponseDto[];
    signedWitnesses: WitnessResponseDto[];
    summary: {
      totalWitnesses: number;
      signedWitnesses: number;
      verifiedWitnesses: number;
      meetsLegalRequirements: boolean;
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

      const witnesses = willAggregate.getAllWitnesses();
      const signedWitnesses = willAggregate.getSignedWitnesses();

      const witnessDtos = witnesses.map(witness => this.mapToWitnessResponseDto(witness));
      const signedWitnessDtos = signedWitnesses.map(witness => this.mapToWitnessResponseDto(witness));

      const summary = {
        totalWitnesses: witnesses.length,
        signedWitnesses: signedWitnesses.length,
        verifiedWitnesses: witnesses.filter(w => w.isVerified()).length,
        meetsLegalRequirements: signedWitnesses.length >= 2
      };

      return {
        witnesses: witnessDtos,
        signedWitnesses: signedWitnessDtos,
        summary
      };
    } catch (error) {
      this.logger.error(`Failed to get witnesses for will ${willId}:`, error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Could not retrieve witnesses: ${error.message}`);
    }
  }

  async signWill(willId: string, witnessId: string, signatureData: string): Promise<WitnessResponseDto> {
    try {
      const witness = await this.witnessRepository.findById(witnessId);
      if (!witness) {
        throw new NotFoundException(`Witness ${witnessId} not found`);
      }

      if (witness.getWillId() !== willId) {
        throw new BadRequestException('Witness does not belong to this will');
      }

      // Validate witness eligibility
      const eligibility = await this.witnessRepository.validateWitnessEligibility(willId, witnessId);
      if (!eligibility.isEligible) {
        throw new BadRequestException(`Witness is not eligible to sign: ${eligibility.reasons.join(', ')}`);
      }

      witness.sign(signatureData);

      await this.witnessRepository.save(witness);

      return this.mapToWitnessResponseDto(witness);
    } catch (error) {
      this.logger.error(`Failed to sign will ${willId} by witness ${witnessId}:`, error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Could not sign will: ${error.message}`);
    }
  }

  async verifyWitness(witnessId: string, verifiedBy: string): Promise<WitnessResponseDto> {
    try {
      const witness = await this.witnessRepository.findById(witnessId);
      if (!witness) {
        throw new NotFoundException(`Witness ${witnessId} not found`);
      }

      witness.verify(verifiedBy);

      await this.witnessRepository.save(witness);

      return this.mapToWitnessResponseDto(witness);
    } catch (error) {
      this.logger.error(`Failed to verify witness ${witnessId}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Could not verify witness: ${error.message}`);
    }
  }

  async removeWitness(witnessId: string, willId: string, testatorId: string): Promise<void> {
    try {
      const willAggregate = await this.willRepository.findById(willId);
      
      if (!willAggregate) {
        throw new NotFoundException(`Will ${willId} not found`);
      }

      if (willAggregate.getWill().getTestatorId() !== testatorId) {
        throw new BadRequestException('Access denied to this will');
      }

      if (willAggregate.getWill().getStatus() !== 'DRAFT' && willAggregate.getWill().getStatus() !== 'PENDING_WITNESS') {
        throw new BadRequestException('Cannot remove witnesses from will in its current status');
      }

      willAggregate.removeWitness(witnessId);

      await this.willRepository.save(willAggregate);
    } catch (error) {
      this.logger.error(`Failed to remove witness ${witnessId} from will ${willId}:`, error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Could not remove witness: ${error.message}`);
    }
  }

  async markWitnessAsIneligible(witnessId: string, reason: string): Promise<WitnessResponseDto> {
    try {
      const witness = await this.witnessRepository.findById(witnessId);
      if (!witness) {
        throw new NotFoundException(`Witness ${witnessId} not found`);
      }

      witness.markAsIneligible(reason);

      await this.witnessRepository.save(witness);

      return this.mapToWitnessResponseDto(witness);
    } catch (error) {
      this.logger.error(`Failed to mark witness ${witnessId} as ineligible:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Could not mark witness as ineligible: ${error.message}`);
    }
  }

  async getWitnessesRequiringVerification(): Promise<WitnessResponseDto[]> {
    try {
      const witnesses = await this.witnessRepository.findWitnessesRequiringVerification();
      return witnesses.map(witness => this.mapToWitnessResponseDto(witness));
    } catch (error) {
      this.logger.error(`Failed to get witnesses requiring verification:`, error);
      throw new BadRequestException(`Could not retrieve witnesses requiring verification: ${error.message}`);
    }
  }

  private mapToWitnessResponseDto(witness: any): WitnessResponseDto {
    const witnessInfo = witness.getWitnessInfo();
    const legalValidation = witness.validateForKenyanLaw ? witness.validateForKenyanLaw() : { isValid: true, issues: [] };

    return {
      id: witness.getId(),
      willId: witness.getWillId(),
      witnessInfo: {
        userId: witnessInfo.userId,
        fullName: witnessInfo.fullName,
        email: witnessInfo.email,
        phone: witnessInfo.phone,
        idNumber: witnessInfo.idNumber,
        relationship: witnessInfo.relationship,
        address: witnessInfo.address
      },
      status: witness.getStatus(),
      signedAt: witness.getSignedAt(),
      signatureData: witness.getSignatureData(),
      verifiedAt: witness.getVerifiedAt(),
      verifiedBy: witness.getVerifiedBy(),
      isEligible: witness.getIsEligible(),
      ineligibilityReason: witness.getIneligibilityReason(),
      createdAt: witness.getCreatedAt(),
      updatedAt: witness.getUpdatedAt(),
      witnessName: witness.getWitnessName ? witness.getWitnessName() : witnessInfo.fullName,
      isRegisteredUser: witness.isRegisteredUser ? witness.isRegisteredUser() : !!witnessInfo.userId,
      hasSigned: witness.hasSigned ? witness.hasSigned() : 
        (witness.getStatus() === WitnessStatus.SIGNED || witness.getStatus() === WitnessStatus.VERIFIED),
      isVerified: witness.isVerified ? witness.isVerified() : 
        (witness.getStatus() === WitnessStatus.VERIFIED),
      canSign: witness.canSign ? witness.canSign() : 
        (witness.getStatus() === WitnessStatus.PENDING && witness.getIsEligible()),
      legalValidation
    };
  }
}