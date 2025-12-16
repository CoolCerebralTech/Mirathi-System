import { Injectable, Logger } from '@nestjs/common';
import { Prisma, PolygamousHouse as PrismaPolygamousHouse } from '@prisma/client';

import {
  PolygamousHouse,
  PolygamousHouseProps,
} from '../../../domain/entities/polygamous-house.entity';

@Injectable()
export class PolygamousHouseMapper {
  private readonly logger = new Logger(PolygamousHouseMapper.name);

  /**
   * Converts Prisma PolygamousHouse to Domain PolygamousHouse entity
   */
  toDomain(raw: PrismaPolygamousHouse | null): PolygamousHouse | null {
    if (!raw) return null;

    try {
      // 1. Safe JSON Parsing
      const wivesAgreementDetails =
        raw.wivesAgreementDetails && typeof raw.wivesAgreementDetails === 'object'
          ? raw.wivesAgreementDetails
          : null;

      const props: PolygamousHouseProps = {
        id: raw.id,
        familyId: raw.familyId,
        houseName: raw.houseName,
        houseOrder: raw.houseOrder,
        houseHeadId: raw.houseHeadId ?? undefined,
        establishedDate: raw.establishedDate,
        courtRecognized: raw.courtRecognized,
        courtOrderNumber: raw.courtOrderNumber ?? undefined,
        s40CertificateNumber: raw.s40CertificateNumber ?? undefined,
        certificateIssuedDate: raw.certificateIssuedDate ?? undefined,
        certificateIssuingCourt: raw.certificateIssuingCourt ?? undefined,
        houseSharePercentage: raw.houseSharePercentage ?? undefined,
        houseBusinessName: raw.houseBusinessName ?? undefined,
        houseBusinessKraPin: raw.houseBusinessKraPin ?? undefined,
        separateProperty: raw.separateProperty,
        wivesConsentObtained: raw.wivesConsentObtained,
        wivesConsentDocument: raw.wivesConsentDocument ?? undefined,
        wivesAgreementDetails,
        successionInstructions: raw.successionInstructions ?? undefined,
        houseDissolvedAt: raw.houseDissolvedAt ?? undefined,
        houseAssetsFrozen: raw.houseAssetsFrozen,
        version: raw.version,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      };

      return PolygamousHouse.createFromProps(props);
    } catch (error) {
      this.logger.error(`Failed to reconstitute PolygamousHouse ${raw?.id}`, error.stack);
      throw new Error(`Data integrity error for PolygamousHouse ${raw?.id}: ${error.message}`);
    }
  }

  /**
   * Converts Domain Entity to Persistence Input
   */
  toPersistence(entity: PolygamousHouse): Prisma.PolygamousHouseUncheckedCreateInput {
    const props = entity.toJSON();

    return {
      id: props.id,
      familyId: props.familyId,
      houseName: props.houseName,
      houseOrder: props.houseOrder,
      houseHeadId: props.houseHeadId ?? null,
      establishedDate: props.establishedDate,
      courtRecognized: props.courtRecognized,
      courtOrderNumber: props.courtOrderNumber ?? null,
      s40CertificateNumber: props.s40CertificateNumber ?? null,
      certificateIssuedDate: props.certificateIssuedDate ?? null,
      certificateIssuingCourt: props.certificateIssuingCourt ?? null,
      houseSharePercentage: props.houseSharePercentage ?? null,
      houseBusinessName: props.houseBusinessName ?? null,
      houseBusinessKraPin: props.houseBusinessKraPin ?? null,
      separateProperty: props.separateProperty,
      wivesConsentObtained: props.wivesConsentObtained,
      wivesConsentDocument: props.wivesConsentDocument ?? null,
      wivesAgreementDetails: props.wivesAgreementDetails
        ? (props.wivesAgreementDetails as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      successionInstructions: props.successionInstructions ?? null,
      houseDissolvedAt: props.houseDissolvedAt ?? null,
      houseAssetsFrozen: props.houseAssetsFrozen,
      version: props.version,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }

  /**
   * Converts domain entity to Prisma create input (Optimized)
   */
  toPrismaCreate(entity: PolygamousHouse): Prisma.PolygamousHouseCreateInput {
    const props = entity.toJSON();

    return {
      id: props.id,
      family: { connect: { id: props.familyId } },
      houseName: props.houseName,
      houseOrder: props.houseOrder,
      // Optional relation connection
      houseHead: props.houseHeadId ? { connect: { id: props.houseHeadId } } : undefined,

      establishedDate: props.establishedDate,
      courtRecognized: props.courtRecognized,
      courtOrderNumber: props.courtOrderNumber ?? null,
      s40CertificateNumber: props.s40CertificateNumber ?? null,
      certificateIssuedDate: props.certificateIssuedDate ?? null,
      certificateIssuingCourt: props.certificateIssuingCourt ?? null,
      houseSharePercentage: props.houseSharePercentage ?? null,
      houseBusinessName: props.houseBusinessName ?? null,
      houseBusinessKraPin: props.houseBusinessKraPin ?? null,
      separateProperty: props.separateProperty,
      wivesConsentObtained: props.wivesConsentObtained,
      wivesConsentDocument: props.wivesConsentDocument ?? null,
      wivesAgreementDetails: props.wivesAgreementDetails
        ? (props.wivesAgreementDetails as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      successionInstructions: props.successionInstructions ?? null,
      houseDissolvedAt: props.houseDissolvedAt ?? null,
      houseAssetsFrozen: props.houseAssetsFrozen,
      version: props.version,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }

  /**
   * Creates a partial update DTO
   */
  toPrismaUpdate(entity: PolygamousHouse): Prisma.PolygamousHouseUncheckedUpdateInput {
    const props = entity.toJSON();

    return {
      houseName: props.houseName,
      houseOrder: props.houseOrder,
      houseHeadId: props.houseHeadId ?? null,
      courtRecognized: props.courtRecognized,
      courtOrderNumber: props.courtOrderNumber ?? null,
      s40CertificateNumber: props.s40CertificateNumber ?? null,
      certificateIssuedDate: props.certificateIssuedDate ?? null,
      certificateIssuingCourt: props.certificateIssuingCourt ?? null,
      houseSharePercentage: props.houseSharePercentage ?? null,
      houseBusinessName: props.houseBusinessName ?? null,
      houseBusinessKraPin: props.houseBusinessKraPin ?? null,
      separateProperty: props.separateProperty,
      wivesConsentObtained: props.wivesConsentObtained,
      wivesConsentDocument: props.wivesConsentDocument ?? null,
      wivesAgreementDetails: props.wivesAgreementDetails
        ? (props.wivesAgreementDetails as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      successionInstructions: props.successionInstructions ?? null,
      houseDissolvedAt: props.houseDissolvedAt ?? null,
      houseAssetsFrozen: props.houseAssetsFrozen,
      version: props.version,
      updatedAt: props.updatedAt,
    };
  }

  // --- QUERY HELPERS ---

  createWhereById(id: string): Prisma.PolygamousHouseWhereUniqueInput {
    return { id };
  }

  createWhereByFamily(familyId: string): Prisma.PolygamousHouseWhereInput {
    return { familyId };
  }
}
