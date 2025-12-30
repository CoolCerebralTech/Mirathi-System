// src/estate-service/src/infrastructure/persistence/mappers/will.mapper.ts
import { Injectable } from '@nestjs/common';
import { Will as PrismaWill } from '@prisma/client';

import { Will } from '../../../domain/aggregates/will.aggregate';
import { UniqueEntityID } from '../../../domain/base/unique-entity-id';
import { WillStatus } from '../../../domain/enums/will-status.enum';
import { WillType } from '../../../domain/enums/will-type.enum';
import { ExecutionDate } from '../../../domain/value-objects/execution-date.vo';
import { TestatorCapacityDeclaration } from '../../../domain/value-objects/testator-capacity-declaration.vo';

@Injectable()
export class WillMapper {
  toDomain(prismaWill: PrismaWill): Will {
    const {
      id,
      testatorId,
      status,
      type,
      versionNumber,
      isRevoked,
      revocationMethod,
      revokedAt,
      supersedesWillId,
      supersededByWillId,
      executionDate,
      funeralWishes,
      burialLocation,
      residuaryClause,
      storageLocation,
      probateCaseNumber,
      isValid,
      validationErrors,
      capacityDeclaration,
    } = prismaWill;

    // 1. Parse execution date
    let parsedExecutionDate: ExecutionDate | undefined;
    if (executionDate) {
      try {
        parsedExecutionDate = ExecutionDate.create(executionDate);
      } catch (error) {
        console.warn(`Failed to parse execution date for will ${id}:`, error);
      }
    }

    // 2. Parse capacity declaration
    let parsedCapacityDeclaration: TestatorCapacityDeclaration | undefined;
    if (capacityDeclaration) {
      try {
        const capacityJson =
          typeof capacityDeclaration === 'string'
            ? JSON.parse(capacityDeclaration)
            : capacityDeclaration;

        parsedCapacityDeclaration = TestatorCapacityDeclaration.create(capacityJson);
      } catch (error) {
        console.warn(`Failed to parse capacity declaration for will ${id}:`, error);
      }
    }

    // 3. Reconstitute Aggregate
    return Will.reconstitute(
      {
        testatorId,
        versionNumber,
        status: status as WillStatus,
        type: type as WillType,
        isRevoked,
        revocationMethod: revocationMethod as any,
        revokedAt: revokedAt ? new Date(revokedAt) : undefined,
        supersedesWillId: supersedesWillId || undefined,
        supersededByWillId: supersededByWillId || undefined,
        capacityDeclaration: parsedCapacityDeclaration,
        executionDate: parsedExecutionDate,
        funeralWishes: funeralWishes || undefined,
        burialLocation: burialLocation || undefined,
        residuaryClause: residuaryClause || undefined,

        // Children initialized as empty (Hydrated by Repository)
        codicils: [],
        executors: [],
        bequests: [],
        witnesses: [],
        disinheritanceRecords: [],

        storageLocation: storageLocation || undefined,
        probateCaseNumber: probateCaseNumber || undefined,
        isValid: isValid || false,
        validationErrors: validationErrors || [],
      },
      new UniqueEntityID(id),
    );
  }

  toPersistence(will: Will): any {
    // 1. Convert Value Objects
    const executionDate = will.executionDate ? will.executionDate.value : null;

    // FIX: Explicitly type as any to allow object assignment
    let capacityDeclaration: any = null;
    if (will.capacityDeclaration) {
      capacityDeclaration = will.capacityDeclaration.toJSON();
    }

    // 2. Construct Root Persistence Object
    return {
      id: will.id.toString(),
      testatorId: will.testatorId,
      status: will.status,
      type: will.type,
      versionNumber: will.versionNumber,
      isRevoked: will.isRevoked,
      revocationMethod: will.revocationMethod || null,
      revokedAt: will.revokedAt || null,
      supersedesWillId: will.supersedesWillId || null,
      supersededByWillId: will.supersededByWillId || null,
      executionDate,
      funeralWishes: will.funeralWishes || null,
      burialLocation: will.burialLocation || null,
      residuaryClause: will.residuaryClause || null,
      storageLocation: will.storageLocation || null,
      probateCaseNumber: will.probateCaseNumber || null,
      isValid: will.isValid,
      validationErrors: will.validationErrors,
      capacityDeclaration,
      updatedAt: new Date(),
    };
  }

  toDomainList(prismaWills: PrismaWill[]): Will[] {
    if (!prismaWills) return [];
    return prismaWills
      .map((will) => {
        try {
          return this.toDomain(will);
        } catch (error) {
          console.error(`Error mapping will ${will.id}:`, error);
          return null;
        }
      })
      .filter((will): will is Will => will !== null);
  }
}
