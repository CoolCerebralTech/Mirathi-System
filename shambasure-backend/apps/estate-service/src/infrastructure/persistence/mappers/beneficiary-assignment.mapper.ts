// src/estate-service/src/infrastructure/persistence/mappers/beneficiary-assignment.mapper.ts
import { Injectable } from '@nestjs/common';
import { WillBequest as PrismaWillBequest } from '@prisma/client';

import { UniqueEntityID } from '../../../domain/base/unique-entity-id';
import { WillBequest } from '../../../domain/entities/beneficiary-assignment.entity';
import { BeneficiaryIdentity } from '../../../domain/value-objects/beneficiary-identity.vo';
import { BequestCondition } from '../../../domain/value-objects/bequest-condition.vo';
import { MoneyVO } from '../../../domain/value-objects/money.vo';

@Injectable()
export class BeneficiaryAssignmentMapper {
  toDomain(prismaBequest: PrismaWillBequest): WillBequest {
    const {
      id,
      willId,
      bequestType,
      specificAssetId,
      percentage,
      fixedAmountAmount,
      fixedAmountCurrency,
      residuaryShare,
      lifeInterestDetails,
      trustDetails,
      conditions,
      priority,
      executionOrder,
      alternateBeneficiary,
      alternateConditions,
      description,
      notes,
      isVested,
      isSubjectToHotchpot,
      isValid,
      validationErrors,
    } = prismaBequest;

    // 1. Parse Beneficiary (Assuming stored as JSON object in Prisma Json column)
    const beneficiaryJson = prismaBequest.beneficiary as any;
    const beneficiary = BeneficiaryIdentity.create({
      type: beneficiaryJson.type,
      identifier: beneficiaryJson.identifier, // Optional if derived
      userId: beneficiaryJson.userId,
      familyMemberId: beneficiaryJson.familyMemberId,
      externalDetails: beneficiaryJson.externalDetails,
    });

    // 2. Parse Fixed Amount (Handle Prisma Decimal -> Number)
    let fixedAmount: MoneyVO | undefined;
    if (fixedAmountAmount && fixedAmountCurrency) {
      fixedAmount = MoneyVO.create({
        amount: Number(fixedAmountAmount), // Convert Decimal to JS Number
        currency: fixedAmountCurrency,
      });
    }

    // 3. Parse Conditions
    // Prisma Json[] -> Domain VO[]
    const parsedConditions: BequestCondition[] = [];
    if (Array.isArray(conditions)) {
      for (const c of conditions as any[]) {
        try {
          parsedConditions.push(
            BequestCondition.create({
              type: c.type,
              details: c.details,
              parameters: c.parameters,
              isMet: c.isMet,
            }),
          );
        } catch (e) {
          // Warn but continue - data integrity issue
          console.warn('Skipping invalid condition', e);
        }
      }
    }

    // 4. Parse Complex JSON Fields
    const parseJson = (val: any) => {
      if (!val) return undefined;
      if (typeof val === 'object') return val;
      try {
        return JSON.parse(val);
      } catch {
        return undefined;
      }
    };

    const parsedLifeInterest = parseJson(lifeInterestDetails);
    const parsedTrust = parseJson(trustDetails);

    // 5. Parse Alternate Beneficiary
    let parsedAltBeneficiary: BeneficiaryIdentity | undefined;
    if (alternateBeneficiary) {
      try {
        const altJson = parseJson(alternateBeneficiary);
        if (altJson) {
          parsedAltBeneficiary = BeneficiaryIdentity.create({
            type: altJson.type,
            userId: altJson.userId,
            familyMemberId: altJson.familyMemberId,
            externalDetails: altJson.externalDetails,
          });
        }
      } catch {
        // Ignore invalid alternate beneficiary data
      }
    }

    // 6. Parse Alternate Conditions
    const parsedAltConditions: BequestCondition[] = [];
    if (Array.isArray(alternateConditions)) {
      for (const c of alternateConditions as any[]) {
        try {
          parsedAltConditions.push(
            BequestCondition.create({
              type: c.type,
              parameters: c.parameters,
              isMet: c.isMet,
            }),
          );
        } catch {
          // Ignore invalid alternate conditions
        }
      }
    }

    return WillBequest.create(
      {
        willId,
        beneficiary,
        bequestType: bequestType as any,
        specificAssetId: specificAssetId || undefined,
        percentage: percentage || undefined,
        fixedAmount,
        residuaryShare: residuaryShare || undefined,
        lifeInterestDetails: parsedLifeInterest,
        trustDetails: parsedTrust,
        conditions: parsedConditions,
        priority: priority as any,
        executionOrder,
        alternateBeneficiary: parsedAltBeneficiary,
        alternateConditions: parsedAltConditions,
        description,
        notes: notes || undefined,
        isVested,
        isSubjectToHotchpot,
        isValid: isValid || false,
        validationErrors: validationErrors || [],
      },
      new UniqueEntityID(id),
    );
  }

  toPersistence(bequest: WillBequest): any {
    // Note: In strict Clean Architecture, we should use public getters, not getProps()
    // but assuming existing Entity pattern exposes properties:

    const beneficiary = bequest.beneficiary.toJSON();

    // Fix: Explicit typing to allow null assignment
    let fixedAmountAmount: number | null = null;
    let fixedAmountCurrency: string | null = null;

    if (bequest.fixedAmount) {
      fixedAmountAmount = bequest.fixedAmount.amount;
      fixedAmountCurrency = bequest.fixedAmount.currency;
    }

    const conditions = bequest.conditions.map((c) => c.toJSON());

    // For JSON columns, pass object directly
    const lifeInterestDetails = bequest.lifeInterestDetails || null;
    const trustDetails = bequest.trustDetails || null;

    const alternateBeneficiary = bequest.alternateBeneficiary
      ? bequest.alternateBeneficiary.toJSON()
      : null;
    const alternateConditions = bequest.alternateConditions.map((c) => c.toJSON());

    return {
      id: bequest.id.toString(),
      willId: bequest.willId,
      beneficiary, // JSON
      bequestType: bequest.bequestType,
      specificAssetId: bequest.specificAssetId || null,
      percentage: bequest.percentage || null,
      fixedAmountAmount, // Decimal compatible
      fixedAmountCurrency,
      residuaryShare: bequest.residuaryShare || null,
      lifeInterestDetails,
      trustDetails,
      conditions, // JSON
      priority: bequest.priority,
      executionOrder: bequest.executionOrder,
      alternateBeneficiary,
      alternateConditions,
      description: bequest.description,
      notes: bequest.notes || null,
      isVested: bequest.isVested,
      isSubjectToHotchpot: bequest.isSubjectToHotchpot,
      isValid: bequest.isValid,
      validationErrors: bequest.validationErrors,
      updatedAt: new Date(),
    };
  }

  toDomainList(prismaBequests: PrismaWillBequest[]): WillBequest[] {
    if (!prismaBequests) return [];
    return prismaBequests
      .map((bequest) => {
        try {
          return this.toDomain(bequest);
        } catch (error) {
          console.error(`Error mapping bequest ${bequest.id}:`, error);
          return null;
        }
      })
      .filter((bequest): bequest is WillBequest => bequest !== null);
  }
}
