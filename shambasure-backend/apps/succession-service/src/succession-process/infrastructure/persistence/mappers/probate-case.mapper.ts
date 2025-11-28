// succession-service/src/succession-process/infrastructure/persistence/mappers/probate-case.mapper.ts

import { Estate as PrismaEstate, GrantType } from '@prisma/client';
import { ProbateCase, CaseStatus } from '../../../domain/entities/probate-case.entity';

export class ProbateCaseMapper {
  static toPersistence(domain: ProbateCase): PrismaEstate {
    // We map the Aggregate back to the Estate table fields
    return {
      id: domain.getId(),
      // estateId is the ID itself in this mapping strategy

      probateCaseNumber: domain.getCaseNumber() || null,
      administrationType: domain.getApplicationType().getValue(), // Enum GrantType

      // Status mapping: Domain 'CaseStatus' -> Prisma 'DistributionStatus' (or specific status column)
      // Assuming 'status' column exists on Estate as per schema
      status: domain.getStatus() as any,

      updatedAt: new Date(),
    } as unknown as PrismaEstate;
  }

  static toDomain(raw: PrismaEstate): ProbateCase {
    // We need to infer Court Details if they aren't explicitly stored on the Estate table yet.
    // For MVP, we default to High Court/Nairobi or load from metadata if available.
    const courtDetails = {
      level: 'HIGH_COURT',
      station: 'NAIROBI',
      county: 'NAIROBI',
    };

    return ProbateCase.reconstitute({
      id: raw.id,
      estateId: raw.id, // Self-reference
      grantType: raw.administrationType as GrantType,

      caseNumber: raw.probateCaseNumber,
      status: raw.status as CaseStatus,

      // Court details (Mocked or loaded from JSON metadata if schema extended)
      courtLevel: courtDetails.level,
      courtStation: courtDetails.station,
      courtCounty: courtDetails.county,

      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
}
