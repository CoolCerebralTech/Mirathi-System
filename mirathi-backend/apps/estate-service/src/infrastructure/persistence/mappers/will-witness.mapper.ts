// src/estate-service/src/infrastructure/persistence/mappers/will-witness.mapper.ts
import { Injectable } from '@nestjs/common';
import { WillWitness as PrismaWillWitness } from '@prisma/client';

import { UniqueEntityID } from '../../../domain/base/unique-entity-id';
import { WillWitness, WitnessType } from '../../../domain/entities/will-witness.entity';
import { ExecutionDate } from '../../../domain/value-objects/execution-date.vo';
import { WitnessEligibility } from '../../../domain/value-objects/witness-eligibility.vo';

@Injectable()
export class WillWitnessMapper {
  toDomain(prismaWitness: PrismaWillWitness): WillWitness {
    const {
      id,
      willId,
      identityType,
      identityUserId,
      identityExternalDetails,
      status,
      eligibility,
      verificationMethod,
      verificationDocumentId,
      signatureType,
      signedAt,
      signatureLocation,
      executionDate,
      presenceType,
      contactInfo,
      declarations,
      notes,
      evidenceIds,
      invitedAt,
      remindedAt,
      lastContactAttempt,
    } = prismaWitness;

    // 1. Parse Identity
    let witnessIdentity: any;
    switch (identityType) {
      case 'REGISTERED_USER':
        witnessIdentity = {
          type: 'REGISTERED_USER',
          userId: identityUserId || undefined,
        };
        break;
      case 'EXTERNAL_INDIVIDUAL':
      case 'PROFESSIONAL_WITNESS':
      case 'COURT_OFFICER':
      case 'NOTARY_PUBLIC': {
        let parsedExternalDetails: any = undefined;
        if (identityExternalDetails) {
          try {
            parsedExternalDetails =
              typeof identityExternalDetails === 'string'
                ? JSON.parse(identityExternalDetails)
                : identityExternalDetails;
          } catch {
            parsedExternalDetails = {};
          }
        }
        witnessIdentity = {
          type: identityType,
          externalDetails: parsedExternalDetails,
        };
        break;
      }
      default:
        throw new Error(`Unknown witness identity type: ${identityType as any}`);
    }

    // 2. Parse Eligibility
    let parsedEligibility: any;
    try {
      parsedEligibility = typeof eligibility === 'string' ? JSON.parse(eligibility) : eligibility;
    } catch {
      parsedEligibility = { isEligible: false, reasons: [] };
    }
    const witnessEligibility = WitnessEligibility.create(parsedEligibility);

    // 3. Parse Execution Date
    let parsedExecutionDate: ExecutionDate | undefined;
    if (executionDate) {
      try {
        parsedExecutionDate = ExecutionDate.create(executionDate);
      } catch {
        console.warn(`Failed to parse execution date for witness ${id}`);
      }
    }

    // 4. Helper for JSON Fields
    const parseJson = (val: any, defaultVal: any = undefined) => {
      if (!val) return defaultVal;
      if (typeof val === 'object') return val;
      try {
        return JSON.parse(val);
      } catch {
        return defaultVal;
      }
    };

    const parsedContactInfo = parseJson(contactInfo);

    const defaultDeclarations = {
      isNotBeneficiary: false,
      isNotSpouseOfBeneficiary: false,
      isOfSoundMind: false,
      understandsDocument: false,
      isActingVoluntarily: false,
    };
    const parsedDeclarations = parseJson(declarations, defaultDeclarations);

    // 5. Parse Evidence IDs (Array)
    let parsedEvidenceIds: string[] = [];
    if (evidenceIds) {
      if (Array.isArray(evidenceIds)) parsedEvidenceIds = evidenceIds;
      else
        try {
          parsedEvidenceIds = JSON.parse(evidenceIds as string);
        } catch {
          /* empty */
        }
    }

    // 6. Parse Reminded At (Date Array)
    let parsedRemindedAt: Date[] = [];
    if (remindedAt) {
      const rawArr = Array.isArray(remindedAt) ? remindedAt : JSON.parse(remindedAt as string);
      if (Array.isArray(rawArr)) {
        parsedRemindedAt = rawArr.map((d: any) => new Date(d));
      }
    }

    return WillWitness.create(
      {
        willId,
        witnessIdentity,
        status: status as any,
        eligibility: witnessEligibility,
        verificationMethod: verificationMethod as any,
        verificationDocumentId: verificationDocumentId || undefined,
        signatureType: signatureType as any,
        signedAt: signedAt ? new Date(signedAt) : undefined,
        signatureLocation: signatureLocation || undefined,
        executionDate: parsedExecutionDate,
        presenceType: presenceType as any,
        contactInfo: parsedContactInfo,
        declarations: parsedDeclarations,
        notes: notes || undefined,
        evidenceIds: parsedEvidenceIds,
        invitedAt: invitedAt ? new Date(invitedAt) : undefined,
        remindedAt: parsedRemindedAt,
        lastContactAttempt: lastContactAttempt ? new Date(lastContactAttempt) : undefined,
      },
      new UniqueEntityID(id),
    );
  }

  toPersistence(witness: WillWitness): any {
    // 1. Map Identity
    const identityType: WitnessType = witness.witnessIdentity.type;
    let identityUserId: string | null = null;
    let identityExternalDetails: any = null;

    if (identityType === 'REGISTERED_USER') {
      identityUserId = witness.witnessIdentity.userId || null;
    } else {
      identityExternalDetails = witness.witnessIdentity.externalDetails || {};
    }

    // 2. Map Value Objects to JSON
    const eligibility = witness.eligibility.toJSON(); // Prisma handles obj -> Json
    const executionDate = witness.executionDate ? witness.executionDate.value : null;

    // 3. Map complex fields
    // Ensure contactInfo is null if empty to match DB constraints if any
    const contactInfo = witness.contactInfo ? witness.contactInfo : null;
    const declarations = witness.declarations;
    const evidenceIds = witness.evidenceIds;

    // 4. Map Dates Array
    let remindedAt: string[] | null = null;
    if (witness.remindedAt && witness.remindedAt.length > 0) {
      remindedAt = witness.remindedAt.map((d) => d.toISOString());
    }

    return {
      id: witness.id.toString(),
      willId: witness.willId,
      identityType,
      identityUserId,
      identityExternalDetails,
      status: witness.status,
      eligibility,
      verificationMethod: witness.verificationMethod || null,
      verificationDocumentId: witness.verificationDocumentId || null,
      signatureType: witness.signatureType || null,
      signedAt: witness.signedAt || null,
      signatureLocation: witness.signatureLocation || null,
      executionDate,
      presenceType: witness.presenceType,
      contactInfo,
      declarations,
      notes: witness.notes || null,
      evidenceIds,
      invitedAt: witness.invitedAt || null,
      remindedAt, // Json
      lastContactAttempt: witness.lastContactAttempt || null,
    };
  }

  toDomainList(prismaWitnesses: PrismaWillWitness[]): WillWitness[] {
    if (!prismaWitnesses) return [];
    return prismaWitnesses
      .map((w) => {
        try {
          return this.toDomain(w);
        } catch (e) {
          console.error(`Witness Mapper Error [${w.id}]:`, e);
          return null;
        }
      })
      .filter((w): w is WillWitness => w !== null);
  }

  toPartialPersistence(witness: WillWitness): Partial<any> {
    const result: any = { updatedAt: new Date() };

    // Simplified checks for update payload
    if (witness.status) result.status = witness.status;
    if (witness.notes) result.notes = witness.notes;

    // Only map complex objects if they exist to overwrite
    if (witness.contactInfo) result.contactInfo = witness.contactInfo;

    return result;
  }
}
