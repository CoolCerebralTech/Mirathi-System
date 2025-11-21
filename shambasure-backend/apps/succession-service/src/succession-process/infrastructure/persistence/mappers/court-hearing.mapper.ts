// succession-service/src/succession-process/infrastructure/persistence/mappers/court-hearing.mapper.ts

import { CourtHearing as PrismaHearing } from '@prisma/client';
import { CourtHearing, HearingStatus } from '../../../domain/entities/court-hearing.entity';
import { HearingType } from '../../../../common/types/kenyan-law.types';

export class CourtHearingMapper {

  static toPersistence(domain: CourtHearing): PrismaHearing {
    return {
      id: domain.getId(),
      // Assuming the schema maps 'caseId' to a 'probateCaseId' FK or similar
      probateCaseId: domain.getCaseId(), 
      
      date: domain.getDate(),
      type: domain.getType(),
      virtualLink: (domain as any).virtualLink || null,
      
      status: domain.getStatus(),
      outcomeNotes: domain.getOutcome() || null,
      presidedBy: (domain as any).presidedBy || null,

      createdAt: new Date(), // Managed by DB usually
      updatedAt: new Date(),
    } as unknown as PrismaHearing;
  }

  static toDomain(raw: PrismaHearing): CourtHearing {
    // Map persistence status string to Domain Union Type if strictly typed
    // Assuming direct mapping for MVP
    return CourtHearing.reconstitute({
      id: raw.id,
      caseId: raw.probateCaseId, // Mapping back
      date: raw.date,
      type: raw.type as HearingType,
      
      virtualLink: raw.virtualLink,
      status: raw.status as HearingStatus,
      outcomeNotes: raw.outcomeNotes,
      presidedBy: raw.presidedBy,
      
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
}
