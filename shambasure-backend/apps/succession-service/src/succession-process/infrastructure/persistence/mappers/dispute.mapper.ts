// succession-service/src/succession-process/infrastructure/persistence/mappers/dispute.mapper.ts

import { Dispute as PrismaDispute } from '@prisma/client';
import { Dispute } from '../../../domain/entities/dispute.entity';

export class DisputeMapper {
  static toPersistence(domain: Dispute): PrismaDispute {
    const grounds = domain.getGrounds();

    // Note: Domain 'evidenceUrls' matches schema 'evidenceUrls' string array
    return {
      id: domain.getId(),
      willId: domain.getWillId(),
      disputantId: domain.getDisputantId(),

      type: (domain as any).type, // Accessing internal type via cast or getter
      description: (grounds as any).description, // Extract description from VO

      status: domain.getStatus(),
      resolution: domain.getResolution() || null,
      resolvedAt: (domain as any).resolvedAt || null,

      // Mapping specific fields present in schema
      lawyerName: (domain as any).lawyerName || null,
      lawyerContact: (domain as any).lawyerContact || null,
      caseNumber: (domain as any).caseNumber || null,
      evidenceUrls: (domain as any).evidenceUrls || [],

      filedAt: (domain as any).createdAt, // Mapping created to filed
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as PrismaDispute;
  }

  static toDomain(raw: PrismaDispute): Dispute {
    // Reconstitute logic handles the creation of LegalGrounds VO internally
    // based on type, description and evidence
    return Dispute.reconstitute({
      id: raw.id,
      willId: raw.willId,
      disputantId: raw.disputantId,

      type: raw.type,
      description: raw.description,

      status: raw.status,
      resolution: raw.resolution,
      resolvedAt: raw.resolvedAt,

      caseNumber: raw.caseNumber,
      evidenceUrls: raw.evidenceUrls,

      createdAt: raw.filedAt || raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
}
