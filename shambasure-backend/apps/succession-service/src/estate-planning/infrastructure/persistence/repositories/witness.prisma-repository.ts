import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@shamba/database';
import { WitnessStatus } from '@prisma/client';
import { WitnessRepositoryInterface } from '../../../domain/repositories/witness.repository.interface';
import { Witness } from '../../../domain/entities/witness.entity';
import { WitnessMapper } from '../mappers/witness.mapper';

@Injectable()
export class WitnessPrismaRepository implements WitnessRepositoryInterface {
  private readonly logger = new Logger(WitnessPrismaRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Witness | null> {
    try {
      const prismaWitness = await this.prisma.willWitness.findUnique({
        where: { id }
      });

      return prismaWitness ? WitnessMapper.toDomain(prismaWitness) : null;
    } catch (error) {
      this.logger.error(`Failed to find witness by ID ${id}:`, error);
      throw new Error(`Could not retrieve witness: ${error.message}`);
    }
  }

  async findByWillId(willId: string): Promise<Witness[]> {
    try {
      const prismaWitnesses = await this.prisma.willWitness.findMany({
        where: { willId },
        orderBy: { createdAt: 'asc' }
      });

      return WitnessMapper.toDomainList(prismaWitnesses);
    } catch (error) {
      this.logger.error(`Failed to find witnesses for will ${willId}:`, error);
      throw new Error(`Could not retrieve witnesses: ${error.message}`);
    }
  }

  async save(witness: Witness): Promise<void> {
    try {
      const witnessData = WitnessMapper.toPersistence(witness);
      
      await this.prisma.willWitness.upsert({
        where: { id: witness.getId() },
        create: witnessData,
        update: witnessData
      });

      // Update will witness count
      await this.updateWillWitnessCount(witness.getWillId());

      this.logger.log(`Successfully saved witness ${witness.getId()}`);
    } catch (error) {
      this.logger.error(`Failed to save witness ${witness.getId()}:`, error);
      throw new Error(`Could not save witness: ${error.message}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const witness = await this.prisma.willWitness.findUnique({
        where: { id },
        select: { willId: true }
      });

      if (!witness) {
        throw new Error(`Witness ${id} not found`);
      }

      await this.prisma.willWitness.delete({
        where: { id }
      });

      // Update will witness count
      await this.updateWillWitnessCount(witness.willId);

      this.logger.log(`Successfully deleted witness ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete witness ${id}:`, error);
      throw new Error(`Could not delete witness: ${error.message}`);
    }
  }

  async findByStatus(willId: string, status: WitnessStatus): Promise<Witness[]> {
    try {
      const prismaWitnesses = await this.prisma.willWitness.findMany({
        where: { 
          willId,
          status
        },
        orderBy: { createdAt: 'asc' }
      });

      return WitnessMapper.toDomainList(prismaWitnesses);
    } catch (error) {
      this.logger.error(`Failed to find witnesses with status ${status} for will ${willId}:`, error);
      throw new Error(`Could not retrieve witnesses: ${error.message}`);
    }
  }

  async findSignedWitnesses(willId: string): Promise<Witness[]> {
    try {
      const prismaWitnesses = await this.prisma.willWitness.findMany({
        where: { 
          willId,
          status: { in: [WitnessStatus.SIGNED, WitnessStatus.VERIFIED] }
        },
        orderBy: { signedAt: 'asc' }
      });

      return WitnessMapper.toDomainList(prismaWitnesses);
    } catch (error) {
      this.logger.error(`Failed to find signed witnesses for will ${willId}:`, error);
      throw new Error(`Could not retrieve signed witnesses: ${error.message}`);
    }
  }

  async findVerifiedWitnesses(willId: string): Promise<Witness[]> {
    try {
      const prismaWitnesses = await this.prisma.willWitness.findMany({
        where: { 
          willId,
          status: WitnessStatus.VERIFIED
        },
        orderBy: { verifiedAt: 'asc' }
      });

      return WitnessMapper.toDomainList(prismaWitnesses);
    } catch (error) {
      this.logger.error(`Failed to find verified witnesses for will ${willId}:`, error);
      throw new Error(`Could not retrieve verified witnesses: ${error.message}`);
    }
  }

  async findByWitnessUserId(userId: string): Promise<Witness[]> {
    try {
      const prismaWitnesses = await this.prisma.willWitness.findMany({
        where: { witnessId: userId },
        orderBy: { createdAt: 'desc' }
      });

      return WitnessMapper.toDomainList(prismaWitnesses);
    } catch (error) {
      this.logger.error(`Failed to find witness roles for user ${userId}:`, error);
      throw new Error(`Could not retrieve witness roles: ${error.message}`);
    }
  }

  async findWitnessesRequiringVerification(): Promise<Witness[]> {
    try {
      const prismaWitnesses = await this.prisma.willWitness.findMany({
        where: { 
          status: WitnessStatus.SIGNED,
          verifiedAt: null
        },
        include: {
          will: {
            select: {
              title: true,
              testator: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        },
        orderBy: { signedAt: 'asc' }
      });

      return WitnessMapper.toDomainList(prismaWitnesses);
    } catch (error) {
      this.logger.error(`Failed to find witnesses requiring verification:`, error);
      throw new Error(`Could not retrieve witnesses requiring verification: ${error.message}`);
    }
  }

  async countSignedWitnesses(willId: string): Promise<number> {
    try {
      return await this.prisma.willWitness.count({
        where: { 
          willId,
          status: { in: [WitnessStatus.SIGNED, WitnessStatus.VERIFIED] }
        }
      });
    } catch (error) {
      this.logger.error(`Failed to count signed witnesses for will ${willId}:`, error);
      throw new Error(`Could not count signed witnesses: ${error.message}`);
    }
  }

  async validateWitnessEligibility(willId: string, witnessId: string): Promise<{ isEligible: boolean; reasons: string[] }> {
    try {
      const witness = await this.prisma.willWitness.findUnique({
        where: { id: witnessId },
        include: {
          will: {
            include: {
              beneficiaryAssignments: true
            }
          }
        }
      });

      if (!witness) {
        return { isEligible: false, reasons: ['Witness not found'] };
      }

      const reasons: string[] = [];

      // Check if witness is a beneficiary
      const isBeneficiary = witness.will.beneficiaryAssignments.some(
        assignment => assignment.beneficiaryId === witness.witnessId
      );

      if (isBeneficiary) {
        reasons.push('Witness cannot be a beneficiary');
      }

      // Check if witness is the testator
      if (witness.witnessId === witness.will.testatorId) {
        reasons.push('Testator cannot be a witness');
      }

      // Check if witness is already signed
      if (witness.status === WitnessStatus.SIGNED || witness.status === WitnessStatus.VERIFIED) {
        reasons.push('Witness has already signed');
      }

      // Check if witness is marked as ineligible
      if (!witness.isEligible) {
        reasons.push(witness.ineligibilityReason || 'Witness is marked as ineligible');
      }

      return {
        isEligible: reasons.length === 0,
        reasons
      };
    } catch (error) {
      this.logger.error(`Failed to validate witness eligibility for witness ${witnessId}:`, error);
      throw new Error(`Could not validate witness eligibility: ${error.message}`);
    }
  }

  async bulkUpdateStatus(witnessIds: string[], status: WitnessStatus): Promise<void> {
    try {
      await this.prisma.willWitness.updateMany({
        where: { 
          id: { in: witnessIds }
        },
        data: { 
          status,
          updatedAt: new Date(),
          ...(status === WitnessStatus.SIGNED && {
            signedAt: new Date()
          }),
          ...(status === WitnessStatus.VERIFIED && {
            verifiedAt: new Date()
          })
        }
      });

      this.logger.log(`Successfully updated status for ${witnessIds.length} witnesses`);
    } catch (error) {
      this.logger.error(`Failed to update status for witnesses:`, error);
      throw new Error(`Could not update witness status: ${error.message}`);
    }
  }

  async markWitnessesAsVerified(witnessIds: string[], verifiedBy: string): Promise<void> {
    try {
      await this.prisma.willWitness.updateMany({
        where: { 
          id: { in: witnessIds }
        },
        data: { 
          status: WitnessStatus.VERIFIED,
          verifiedAt: new Date(),
          verifiedBy,
          updatedAt: new Date()
        }
      });

      this.logger.log(`Successfully verified ${witnessIds.length} witnesses`);
    } catch (error) {
      this.logger.error(`Failed to verify witnesses:`, error);
      throw new Error(`Could not verify witnesses: ${error.message}`);
    }
  }

  private async updateWillWitnessCount(willId: string): Promise<void> {
    try {
      const witnessCount = await this.prisma.willWitness.count({
        where: { 
          willId,
          status: { in: [WitnessStatus.SIGNED, WitnessStatus.VERIFIED] }
        }
      });

      const hasAllWitnesses = witnessCount >= 2;

      await this.prisma.will.update({
        where: { id: willId },
        data: {
          witnessCount,
          hasAllWitnesses
        }
      });
    } catch (error) {
      this.logger.error(`Failed to update witness count for will ${willId}:`, error);
      // Don't throw here as it's a secondary operation
    }
  }
}