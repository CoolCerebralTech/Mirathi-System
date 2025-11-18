import { WitnessStatus } from '@prisma/client';
import { Witness } from '../../../domain/entities/witness.entity';

export class WitnessMapper {
  static toDomain(prismaWitness: any): Witness {
    if (!prismaWitness) return null;

    const witnessInfo: any = {
      fullName: prismaWitness.fullName,
    };

    if (prismaWitness.witnessId) {
      witnessInfo.userId = prismaWitness.witnessId;
    } else {
      witnessInfo.email = prismaWitness.email;
      witnessInfo.phone = prismaWitness.phone;
      witnessInfo.idNumber = prismaWitness.idNumber;
      witnessInfo.relationship = prismaWitness.relationship;
      witnessInfo.address = prismaWitness.address;
    }

    const witness = new Witness(prismaWitness.id, prismaWitness.willId, witnessInfo);

    // Set additional properties
    Object.assign(witness, {
      status: prismaWitness.status as WitnessStatus,
      signedAt: prismaWitness.signedAt,
      signatureData: prismaWitness.signatureData,
      verifiedAt: prismaWitness.verifiedAt,
      verifiedBy: prismaWitness.verifiedBy,
      isEligible: prismaWitness.isEligible,
      ineligibilityReason: prismaWitness.ineligibilityReason,
      createdAt: prismaWitness.createdAt,
      updatedAt: prismaWitness.updatedAt,
    });

    return witness;
  }

  static toPersistence(witness: Witness): any {
    const persistenceObj: any = {
      id: witness.getId(),
      willId: witness.getWillId(),
      status: witness.getStatus(),
      signedAt: witness.getSignedAt(),
      signatureData: witness.getSignatureData(),
      verifiedAt: witness.getVerifiedAt(),
      verifiedBy: witness.getVerifiedBy(),
      isEligible: witness.getIsEligible(),
      ineligibilityReason: witness.getIneligibilityReason(),
      createdAt: witness.getCreatedAt(),
      updatedAt: witness.getUpdatedAt(),
    };

    // Set witness identification
    const witnessInfo = witness.getWitnessInfo();
    if (witnessInfo.userId) {
      persistenceObj.witnessId = witnessInfo.userId;
    } else {
      persistenceObj.fullName = witnessInfo.fullName;
      persistenceObj.email = witnessInfo.email;
      persistenceObj.phone = witnessInfo.phone;
      persistenceObj.idNumber = witnessInfo.idNumber;
      persistenceObj.relationship = witnessInfo.relationship;
      persistenceObj.address = witnessInfo.address;
    }

    return persistenceObj;
  }

  static toDomainList(prismaWitnesses: any[]): Witness[] {
    return prismaWitnesses.map((witness) => this.toDomain(witness)).filter(Boolean);
  }
}
