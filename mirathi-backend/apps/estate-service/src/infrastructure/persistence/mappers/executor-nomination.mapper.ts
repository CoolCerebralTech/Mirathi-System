// src/estate-service/src/infrastructure/persistence/mappers/executor-nomination.mapper.ts
import { Injectable } from '@nestjs/common';
import { WillExecutor as PrismaWillExecutor } from '@prisma/client';

import { UniqueEntityID } from '../../../domain/base/unique-entity-id';
import { WillExecutor } from '../../../domain/entities/executor-nomination.entity';
import { ExecutorPriority } from '../../../domain/value-objects/executor-priority.vo';

@Injectable()
export class ExecutorNominationMapper {
  toDomain(prismaExecutor: PrismaWillExecutor): WillExecutor {
    const {
      id,
      willId,
      identityType,
      identityUserId,
      identityFamilyMemberId,
      identityExternalDetails,
      priorityLevel,
      priorityOrder,
      appointmentType,
      appointmentDate,
      consentStatus,
      consentDate,
      consentNotes,
      isQualified,
      qualificationReasons,
      isMinor,
      isMentallyIncapacitated,
      hasCriminalRecord,
      isBankrupt,
      contactInfo,
      powers,
      restrictions,
      compensation,
    } = prismaExecutor;

    // 1. Parse Identity
    let executorIdentity: any;
    switch (identityType) {
      case 'USER':
        executorIdentity = {
          type: 'USER',
          userId: identityUserId || undefined,
        };
        break;
      case 'FAMILY_MEMBER':
        executorIdentity = {
          type: 'FAMILY_MEMBER',
          familyMemberId: identityFamilyMemberId || undefined,
        };
        break;
      case 'EXTERNAL': {
        let parsedExternalDetails: any = undefined;
        if (identityExternalDetails) {
          try {
            // Handle both JSON object and string cases
            parsedExternalDetails =
              typeof identityExternalDetails === 'string'
                ? JSON.parse(identityExternalDetails)
                : identityExternalDetails;
          } catch {
            parsedExternalDetails = {};
          }
        }
        executorIdentity = {
          type: 'EXTERNAL',
          externalDetails: parsedExternalDetails,
        };
        break;
      }
      default:
        // Cast to 'any' to avoid TS2345/TS2339 when switch is exhaustive
        throw new Error(`Unknown executor identity type: ${identityType as any}`);
    }

    // 2. Parse Priority (using the new Factory)
    const priority = ExecutorPriority.create(priorityLevel, priorityOrder);

    // 3. Helper for Arrays/Objects
    const parseJsonArray = (val: any) => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      try {
        return JSON.parse(val);
      } catch {
        return [];
      }
    };

    const parseJsonObject = (val: any) => {
      if (!val) return undefined;
      if (typeof val === 'object') return val;
      try {
        return JSON.parse(val);
      } catch {
        return undefined;
      }
    };

    // 4. Create Entity
    return WillExecutor.create(
      {
        willId,
        executorIdentity,
        priority,
        appointmentType: appointmentType as 'TESTAMENTARY' | 'SPECIAL_EXECUTOR',
        appointmentDate: new Date(appointmentDate),
        consentStatus: consentStatus as any,
        consentDate: consentDate ? new Date(consentDate) : undefined,
        consentNotes: consentNotes || undefined,
        isQualified,
        qualificationReasons: parseJsonArray(qualificationReasons),
        isMinor,
        isMentallyIncapacitated,
        hasCriminalRecord,
        isBankrupt,
        contactInfo: parseJsonObject(contactInfo),
        powers: parseJsonArray(powers),
        restrictions: parseJsonArray(restrictions),
        compensation: parseJsonObject(compensation),
      },
      new UniqueEntityID(id), // Fix: Wrap string ID
    );
  }

  toPersistence(executor: WillExecutor): any {
    // 1. Map Identity
    let identityType: 'USER' | 'FAMILY_MEMBER' | 'EXTERNAL' = 'EXTERNAL';
    let identityUserId: string | null = null;
    let identityFamilyMemberId: string | null = null;
    let identityExternalDetails: any = null;

    const identity = executor.executorIdentity;
    if (identity.type === 'USER') {
      identityType = 'USER';
      identityUserId = identity.userId || null;
    } else if (identity.type === 'FAMILY_MEMBER') {
      identityType = 'FAMILY_MEMBER';
      identityFamilyMemberId = identity.familyMemberId || null;
    } else {
      identityType = 'EXTERNAL';
      identityExternalDetails = identity.externalDetails || {};
    }

    // 2. Map Priority (Using the new Getters)
    const priorityLevel = executor.priority.level;
    const priorityOrder = executor.priority.order;

    // 3. Map Complex Fields
    // Use null for optional fields to satisfy DB constraints if column is nullable
    const contactInfo = executor.contactInfo || null;
    const powers = executor.powers || [];
    const restrictions = executor.restrictions || [];
    const compensation = executor.compensation || null;
    const qualificationReasons = executor.qualificationReasons || [];

    return {
      id: executor.id.toString(),
      willId: executor.willId,
      identityType,
      identityUserId,
      identityFamilyMemberId,
      identityExternalDetails,
      priorityLevel,
      priorityOrder,
      appointmentType: executor.appointmentType,
      appointmentDate: executor.appointmentDate,
      consentStatus: executor.consentStatus || 'PENDING',
      consentDate: executor.consentDate || null,
      consentNotes: executor.consentNotes || null,
      isQualified: executor.isQualified,
      qualificationReasons,
      isMinor: executor.isMinor,
      isMentallyIncapacitated: executor.isMentallyIncapacitated,
      hasCriminalRecord: executor.hasCriminalRecord,
      isBankrupt: executor.isBankrupt,
      contactInfo,
      powers,
      restrictions,
      compensation,
      updatedAt: new Date(),
    };
  }

  toDomainList(prismaExecutors: PrismaWillExecutor[]): WillExecutor[] {
    if (!prismaExecutors) return [];
    return prismaExecutors
      .map((executor) => {
        try {
          return this.toDomain(executor);
        } catch (error) {
          console.error(`Error mapping executor ${executor.id}:`, error);
          return null;
        }
      })
      .filter((executor): executor is WillExecutor => executor !== null);
  }

  /**
   * Partial persistence for updates
   */
  toPartialPersistence(executor: WillExecutor): Partial<any> {
    const result: any = {
      updatedAt: new Date(),
    };

    // Example of mapping priority for update
    if (executor.priority) {
      result.priorityLevel = executor.priority.level;
      result.priorityOrder = executor.priority.order;
    }

    // Map identity (simplified check)
    if (executor.executorIdentity) {
      const identity = executor.executorIdentity;
      if (identity.type === 'USER') result.identityType = 'USER';
      else if (identity.type === 'FAMILY_MEMBER') result.identityType = 'FAMILY_MEMBER';
      else result.identityType = 'EXTERNAL';
    }

    // Map direct properties
    if (executor.consentStatus !== undefined) result.consentStatus = executor.consentStatus;
    if (executor.isQualified !== undefined) result.isQualified = executor.isQualified;

    return result;
  }
}
