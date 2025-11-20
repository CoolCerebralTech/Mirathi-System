import { WillWitness as PrismaWitness } from '@prisma/client';
import { Witness, WitnessInfo } from '../../../domain/entities/witness.entity';

export class WitnessMapper {
  static toPersistence(domain: Witness): PrismaWitness {
    const info = domain.getWitnessInfo();

    return {
      id: domain.getId(),
      willId: domain.getWillId(),

      // Info Flattening
      witnessId: info.userId || null,
      fullName: info.fullName,
      email: info.email || null,
      phone: info.phone || null,
      idNumber: info.idNumber || null,
      relationship: info.relationship || null,

      // JSON Address
      address: info.address ? JSON.stringify({ street: info.address }) : null, // Simple string wrapper for JSON field

      // Status
      status: domain.getStatus(),
      signedAt: domain.getSignedAt(),
      signatureData: domain.getSignatureData(),

      verifiedAt: domain.getVerifiedAt(),
      verifiedBy: domain.getVerifiedBy(),

      // Logic Fields
      isEligible: true, // Calculated by policy, stored as true/false
      ineligibilityReason: domain.getRejectionReason(),

      createdAt: domain.getCreatedAt(),
      updatedAt: domain.getUpdatedAt(),
    } as unknown as PrismaWitness;
  }

  static toDomain(raw: PrismaWitness): Witness {
    // Parse Address
    let addressStr: string | undefined;
    if (raw.address) {
      try {
        // Handle if stored as JSON object or simple string
        const parsed = typeof raw.address === 'string' ? JSON.parse(raw.address) : raw.address;
        addressStr = parsed?.street || parsed?.toString();
      } catch {
        addressStr = String(raw.address);
      }
    }

    const info: WitnessInfo = {
      userId: raw.witnessId || undefined,
      fullName: raw.fullName,
      email: raw.email || undefined,
      phone: raw.phone || undefined,
      idNumber: raw.idNumber || undefined,
      relationship: raw.relationship || undefined,
      address: addressStr,
    };

    return Witness.reconstitute({
      id: raw.id,
      willId: raw.willId,
      witnessInfo: info,
      status: raw.status,

      signedAt: raw.signedAt,
      signatureData: raw.signatureData,

      verifiedAt: raw.verifiedAt,
      verifiedBy: raw.verifiedBy,
      rejectionReason: raw.ineligibilityReason,

      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
}
