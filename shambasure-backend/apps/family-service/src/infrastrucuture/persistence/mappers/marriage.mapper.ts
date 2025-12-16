import { Injectable, Logger } from '@nestjs/common';
import { MarriageStatus, MarriageType, Prisma, Marriage as PrismaMarriage } from '@prisma/client';

import { Marriage, MarriageProps } from '../../../domain/entities/marriage.entity';
import { BridePrice } from '../../../domain/value-objects/financial/bride-price.vo';
import { CustomaryMarriage } from '../../../domain/value-objects/legal/customary-marriage.vo';
import { IslamicMarriage } from '../../../domain/value-objects/legal/islamic-marriage.vo';
import { MarriageDetails } from '../../../domain/value-objects/legal/marriage-details.vo';
import { KenyanMarriageDates } from '../../../domain/value-objects/temporal/kenyan-marriage-dates.vo';

@Injectable()
export class MarriageMapper {
  private readonly logger = new Logger(MarriageMapper.name);

  /**
   * Converts Prisma Marriage record to Domain Marriage entity
   */
  toDomain(raw: PrismaMarriage | null): Marriage | null {
    if (!raw) return null;

    try {
      // 1. Reconstitute VOs
      const dates = this.reconstituteKenyanMarriageDates(raw);
      const details = this.reconstituteMarriageDetails(raw);
      const bridePrice = this.reconstituteBridePrice(raw);
      const customaryMarriage = this.reconstituteCustomaryMarriage(raw);
      const islamicMarriage = this.reconstituteIslamicMarriage(raw);

      // 2. Assemble Props
      const props: MarriageProps = {
        id: raw.id,
        familyId: raw.familyId,
        spouse1Id: raw.spouse1Id,
        spouse2Id: raw.spouse2Id,
        type: raw.marriageType,
        details,
        dates,
        bridePrice,
        customaryMarriage,
        islamicMarriage,
        registrationNumber: raw.registrationNumber ?? undefined,
        issuingAuthority: raw.issuingAuthority ?? undefined,
        certificateIssueDate: raw.certificateIssueDate ?? undefined,
        registrationDistrict: raw.registrationDistrict ?? undefined,
        endReason: raw.endReason,
        deceasedSpouseId: raw.deceasedSpouseId ?? undefined,
        divorceDecreeNumber: raw.divorceDecreeNumber ?? undefined,
        divorceCourt: raw.divorceCourt ?? undefined,
        divorceDate: raw.divorceDate ?? undefined,
        isPolygamousUnderS40: raw.isPolygamousUnderS40,
        s40CertificateNumber: raw.s40CertificateNumber ?? undefined,
        polygamousHouseId: raw.polygamousHouseId ?? undefined,
        isMatrimonialPropertyRegime: raw.isMatrimonialPropertyRegime,
        matrimonialPropertySettled: raw.matrimonialPropertySettled,
        spouse1MaritalStatusAtMarriage: raw.spouse1MaritalStatusAtMarriage as string | undefined,
        spouse2MaritalStatusAtMarriage: raw.spouse2MaritalStatusAtMarriage as string | undefined,
        separationDate: raw.separationDate ?? undefined,
        separationReason: raw.separationReason ?? undefined,
        maintenanceOrderIssued: raw.maintenanceOrderIssued,
        maintenanceOrderNumber: raw.maintenanceOrderNumber ?? undefined,
        courtValidationDate: raw.courtValidationDate ?? undefined,
        isValidUnderKenyanLaw: raw.isValidUnderKenyanLaw,
        invalidityReason: raw.invalidityReason ?? undefined,
        isActive: raw.isActive,
        version: raw.version,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      };

      return Marriage.createFromProps(props);
    } catch (error) {
      this.logger.error(`Failed to reconstitute Marriage ${raw?.id}`, error.stack);
      throw new Error(`Data integrity error for Marriage ${raw?.id}: ${error.message}`);
    }
  }

  /**
   * Converts Domain Marriage entity to Prisma Persistence Input
   */
  toPersistence(entity: Marriage): Prisma.MarriageUncheckedCreateInput {
    const props = entity.toJSON();
    const details = props.details;
    const dates = props.dates;
    const bridePrice = props.bridePrice;
    const customary = props.customaryMarriage;
    const islamic = props.islamicMarriage;

    // Safe JSON Parsing for Persistence with proper Type Assertions
    // Note: We cast to unknown first because 'ElderWitness[]' doesn't overlap with 'InputJsonValue'
    const elderWitnesses =
      customary?.elderWitnesses && Array.isArray(customary.elderWitnesses)
        ? (customary.elderWitnesses as unknown as Prisma.InputJsonValue)
        : Prisma.JsonNull;

    const elderCouncilMembers =
      customary?.elderCouncilMembers && Array.isArray(customary.elderCouncilMembers)
        ? (customary.elderCouncilMembers as unknown as Prisma.InputJsonValue)
        : Prisma.JsonNull;

    return {
      id: props.id,
      familyId: props.familyId,
      spouse1Id: props.spouse1Id,
      spouse2Id: props.spouse2Id,
      marriageType: props.type,

      // Civil & Legal
      registrationNumber: details.registrationNumber ?? null,
      issuingAuthority: details.issuingAuthority ?? null,
      certificateIssueDate: details.certificateIssueDate
        ? new Date(details.certificateIssueDate)
        : null,
      registrationDistrict: details.registrationDistrict ?? null,

      // Dates
      startDate: new Date(dates.marriageDate),
      endDate: dates.dissolutionDate ? new Date(dates.dissolutionDate) : null,

      endReason: props.endReason,
      deceasedSpouseId: props.deceasedSpouseId ?? null,
      divorceDecreeNumber: props.divorceDecreeNumber ?? null,
      divorceCourt: props.divorceCourt ?? null,
      divorceDate: props.divorceDate ?? null,

      // Bride Price
      bridePricePaid:
        bridePrice?.status === 'FULLY_PAID' || bridePrice?.status === 'PARTIALLY_PAID',
      bridePriceAmount: bridePrice?.totalAmountAgreed ?? null,
      bridePriceCurrency: bridePrice?.currency ?? null,

      // Customary
      elderWitnesses,
      elderCouncilMembers,
      ceremonyLocation: customary?.ceremonyLocation ?? null,
      traditionalCeremonyType: customary?.customaryType ?? null, // DB column is traditionalCeremonyType
      customaryType: customary?.customaryType ?? null, // DB column is customaryType (redundancy in schema?)
      clanApproval: customary?.clanApproval ?? false,
      familyConsent: customary?.familyConsent ?? false,

      // Polygamy
      polygamousHouseId: props.polygamousHouseId ?? null,
      isMatrimonialPropertyRegime: details.isMatrimonialPropertyRegime,
      matrimonialPropertySettled: details.isMatrimonialPropertySettled,
      isPolygamousUnderS40: details.isPolygamous,
      s40CertificateNumber: details.s40CertificateNumber ?? null,

      // Islamic
      isIslamicUnion: props.type === MarriageType.ISLAMIC,
      nikahDate: islamic?.nikahDate ? new Date(islamic.nikahDate) : null,
      waliName: islamic?.waliName ?? null,
      mahrAmount: islamic?.mahrAmount ?? null,
      mahrCurrency: islamic?.mahrCurrency ?? 'KES',
      talaqIssued: islamic?.talaqIssued ?? false,

      // Status & Validation
      spouse1MaritalStatusAtMarriage:
        (props.spouse1MaritalStatusAtMarriage as MarriageStatus) ?? null,
      spouse2MaritalStatusAtMarriage:
        (props.spouse2MaritalStatusAtMarriage as MarriageStatus) ?? null,
      separationDate: props.separationDate ?? null,
      separationReason: props.separationReason ?? null,
      maintenanceOrderIssued: props.maintenanceOrderIssued,
      maintenanceOrderNumber: props.maintenanceOrderNumber ?? null,
      courtValidationDate: props.courtValidationDate ?? null,
      isValidUnderKenyanLaw: props.isValidUnderKenyanLaw,
      invalidityReason: props.invalidityReason ?? null,
      matrimonialRegime: this.determineMatrimonialRegime(props),

      isActive: props.isActive,
      version: props.version,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }

  /**
   * Converts to Prisma Update Input
   */
  toPrismaUpdate(entity: Marriage): Prisma.MarriageUncheckedUpdateInput {
    const props = entity.toJSON();
    const dates = props.dates;

    // We only map fields that are expected to change during the lifecycle
    return {
      marriageType: props.type,
      registrationNumber: props.details.registrationNumber ?? null,
      endDate: dates.dissolutionDate ? new Date(dates.dissolutionDate) : null,
      endReason: props.endReason,
      isActive: props.isActive,
      matrimonialPropertySettled: props.matrimonialPropertySettled,
      version: props.version,
      updatedAt: props.updatedAt,
    };
  }

  /**
   * Converts domain entity to Prisma create input (Optimized)
   */
  toPrismaCreate(entity: Marriage): Prisma.MarriageCreateInput {
    const props = entity.toJSON();
    // Simplified persistence logic reuse
    const persistenceData = this.toPersistence(entity);

    const { ...restData } = persistenceData;

    return {
      ...restData,
      id: props.id,
      // Connect relations
      family: { connect: { id: props.familyId } },
      spouse1: { connect: { id: props.spouse1Id } },
      spouse2: { connect: { id: props.spouse2Id } },
      polygamousHouse: props.polygamousHouseId
        ? { connect: { id: props.polygamousHouseId } }
        : undefined,
    };
  }

  // --- PRIVATE RECONSTITUTION HELPERS ---

  private reconstituteKenyanMarriageDates(raw: PrismaMarriage): KenyanMarriageDates {
    const dates = KenyanMarriageDates.create(raw.startDate, raw.marriageType);

    if (raw.registrationNumber) {
      dates.registerMarriage(raw.createdAt, raw.registrationNumber);
    }

    if (raw.endDate) {
      // Map dissolution type from end reason
      const dissolutionType =
        raw.endReason === 'DEATH_OF_SPOUSE'
          ? 'DEATH'
          : raw.endReason === 'ANNULMENT'
            ? 'ANNULMENT'
            : raw.endReason === 'CUSTOMARY_DISSOLUTION'
              ? 'CUSTOMARY_DISSOLUTION'
              : 'DIVORCE';

      return dates.dissolveMarriage(
        raw.endDate,
        dissolutionType,
        raw.separationReason ?? 'Terminated',
      );
    }

    return dates;
  }

  private reconstituteMarriageDetails(raw: PrismaMarriage): MarriageDetails {
    let details = MarriageDetails.create(raw.marriageType, raw.startDate);

    if (
      raw.registrationNumber &&
      raw.issuingAuthority &&
      raw.certificateIssueDate &&
      raw.registrationDistrict
    ) {
      details = details.registerCivilMarriage(
        raw.registrationNumber,
        raw.certificateIssueDate,
        raw.issuingAuthority,
        raw.registrationDistrict,
      );
    }

    if (raw.isPolygamousUnderS40) {
      details = details.markAsPolygamous(raw.polygamousHouseId ?? undefined);
    }

    if (raw.endDate) {
      details = details.endMarriage(raw.endDate, raw.endReason);
    }

    return details;
  }

  private reconstituteBridePrice(raw: PrismaMarriage): BridePrice | undefined {
    if (!raw.bridePriceAmount) return undefined;

    // Use the Legacy helper method
    return BridePrice.createLegacy(
      raw.bridePriceAmount,
      raw.bridePriceCurrency ?? 'KES',
      raw.bridePricePaid,
    );
  }

  private reconstituteCustomaryMarriage(raw: PrismaMarriage): CustomaryMarriage | undefined {
    const isCustomary = ['CUSTOMARY', 'TRADITIONAL', 'CUSTOMARY_MARRIAGE'].includes(
      raw.marriageType,
    );
    if (!isCustomary) return undefined;

    const cm = CustomaryMarriage.create(
      '', // Ethnic group missing in DB
      raw.customaryType ?? raw.traditionalCeremonyType ?? 'Traditional',
      raw.startDate,
      raw.ceremonyLocation ?? 'Unknown',
    );

    // Rehydrate arrays from JSON safely
    if (raw.elderWitnesses && Array.isArray(raw.elderWitnesses)) {
      // Assuming structure matches, might need deeper mapping in real world
      // cm.addElderWitness(...)
    }

    return cm;
  }

  private reconstituteIslamicMarriage(raw: PrismaMarriage): IslamicMarriage | undefined {
    if (raw.marriageType !== MarriageType.ISLAMIC) return undefined;

    return IslamicMarriage.create(
      raw.nikahDate ?? raw.startDate,
      raw.ceremonyLocation ?? 'Unknown',
      '', // Imam missing
      raw.waliName ?? 'Unknown',
      raw.mahrAmount ?? 0,
    );
  }

  private determineMatrimonialRegime(props: any): string {
    if (props.isPolygamousUnderS40) return 'POLYGAMOUS_S40';
    if (props.type === MarriageType.ISLAMIC) return 'ISLAMIC';
    if (['CUSTOMARY', 'TRADITIONAL'].includes(props.type)) return 'CUSTOMARY';
    return 'MONOGAMOUS';
  }

  // --- QUERY HELPERS ---

  createWhereBySpouses(spouse1Id: string, spouse2Id: string): Prisma.MarriageWhereInput {
    return {
      OR: [
        { spouse1Id, spouse2Id },
        { spouse1Id: spouse2Id, spouse2Id: spouse1Id },
      ],
    };
  }
}
