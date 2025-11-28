// succession-service/src/succession-process/infrastructure/persistence/mappers/succession-certificate.mapper.ts

import { GrantOfAdministration as PrismaGrant } from '@prisma/client';
import { SuccessionCertificate } from '../../../domain/entities/succession-certificate.entity';

export class SuccessionCertificateMapper {
  static toPersistence(domain: SuccessionCertificate): PrismaGrant {
    return {
      id: domain.getId(),
      estateId: (domain as any).estateId,
      applicantId: (domain as any).applicantId,

      grantType: domain.getType(),

      issuedAt: domain.getIssueDate(),
      issuedBy: 'COURT_SYSTEM', // Placeholder or captured from context

      // Logic: If confirmed date exists, status is CONFIRMED, else ISSUED/PENDING
      status: domain.isConfirmed() ? 'COMPLETED' : 'PENDING',

      // Notes / File Ref
      notes: (domain as any).fileReference ? `File Ref: ${(domain as any).fileReference}` : null,

      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as PrismaGrant;
  }

  static toDomain(raw: PrismaGrant): SuccessionCertificate {
    return SuccessionCertificate.reconstitute({
      id: raw.id,
      estateId: raw.estateId,
      applicantId: raw.applicantId,
      grantType: raw.grantType,

      issuedAt: raw.issuedAt || new Date(), // Fallback if null in DB
      confirmedAt: raw.status === 'COMPLETED' ? raw.updatedAt : null, // Infer confirmation from status

      fileReference: raw.notes, // Extract ref if stored in notes

      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
}
