// src/estate-service/src/infrastructure/persistence/mappers/codicil.mapper.ts
import { Injectable } from '@nestjs/common';
import { Codicil as PrismaCodicil } from '@prisma/client';

import { UniqueEntityID } from '../../../domain/base/unique-entity-id';
import { Codicil } from '../../../domain/entities/codicil.entity';
import { ExecutionDate } from '../../../domain/value-objects/execution-date.vo';

@Injectable()
export class CodicilMapper {
  /**
   * Persistence (Prisma) -> Domain (Entity)
   */
  toDomain(prismaCodicil: PrismaCodicil): Codicil {
    const {
      id,
      willId,
      title,
      content,
      codicilDate,
      versionNumber,
      executionDate,
      witnesses,
      amendmentType,
      affectedClauses,
      legalBasis,
      isDependent,
    } = prismaCodicil;

    // 1. Parse Execution Date safely
    // We use the Factory method 'create' which handles Date | string inputs
    let parsedExecutionDate: ExecutionDate;
    try {
      if (executionDate) {
        parsedExecutionDate = ExecutionDate.create(executionDate);
      } else {
        // Fallback for legacy data: assume signed "now" if missing in DB
        parsedExecutionDate = ExecutionDate.create(new Date());
      }
    } catch {
      console.warn(
        `Data Integrity Warning: Invalid execution date for Codicil ${id}. Defaulting to now.`,
      );
      parsedExecutionDate = ExecutionDate.create(new Date());
    }

    // 2. Parse Affected Clauses (Handling Prisma Arrays)
    // Prisma normally returns string[] for String[] columns, but we ensure safety
    let parsedAffectedClauses: string[] | undefined;
    if (Array.isArray(affectedClauses)) {
      parsedAffectedClauses = affectedClauses;
    } else {
      parsedAffectedClauses = [];
    }

    // 3. Construct Domain Entity
    return Codicil.create(
      {
        willId,
        title,
        content,
        codicilDate: new Date(codicilDate),
        versionNumber,
        executionDate: parsedExecutionDate,
        witnesses: witnesses, // Assumes Prisma returns string[]
        amendmentType: amendmentType as 'ADDITION' | 'MODIFICATION' | 'REVOCATION',
        affectedClauses: parsedAffectedClauses,
        legalBasis: legalBasis ?? undefined, // Convert null to undefined
        isDependent,
      },
      new UniqueEntityID(id), // Wrap the ID string
    );
  }

  /**
   * Domain (Entity) -> Persistence (Prisma)
   */
  toPersistence(codicil: Codicil): any {
    // 1. Extract raw date from Value Object
    const executionDate = codicil.executionDate ? codicil.executionDate.value : null;

    // 2. Handle Arrays (Prisma expects arrays for scalar lists)
    const affectedClauses = codicil.affectedClauses || [];
    const witnesses = codicil.witnesses || [];

    return {
      id: codicil.id.toString(),
      willId: codicil.willId,
      title: codicil.title,
      content: codicil.content,
      codicilDate: codicil.codicilDate,
      versionNumber: codicil.versionNumber,
      executionDate: executionDate,
      witnesses: witnesses,
      amendmentType: codicil.amendmentType,
      affectedClauses: affectedClauses,
      legalBasis: codicil.legalBasis || null, // Convert undefined to null for DB
      isDependent: codicil.isDependent,
      updatedAt: new Date(), // Always refresh update timestamp
    };
  }

  /**
   * Helper: Map a list safely
   */
  toDomainList(prismaCodicils: PrismaCodicil[]): Codicil[] {
    if (!prismaCodicils) return [];
    return prismaCodicils
      .map((codicil) => {
        try {
          return this.toDomain(codicil);
        } catch (error) {
          console.error(`Error mapping codicil ${codicil.id}:`, error);
          return null;
        }
      })
      .filter((c): c is Codicil => c !== null);
  }
}
