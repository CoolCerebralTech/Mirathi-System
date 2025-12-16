// marriage.mapper.ts
import { Injectable } from '@nestjs/common';
import {
  MarriageEndReason,
  MarriageStatus,
  MarriageType,
  Prisma,
  Marriage as PrismaMarriage,
} from '@prisma/client';

import {
  CreateMarriageProps,
  Marriage,
  MarriageProps,
} from '../../../domain/entities/marriage.entity';
import {
  BridePrice,
  BridePriceProps,
  BridePriceStatus,
} from '../../../domain/value-objects/financial/bride-price.vo';
import {
  CustomaryMarriage,
  CustomaryMarriageProps,
} from '../../../domain/value-objects/legal/customary-marriage.vo';
import {
  IslamicMarriage,
  IslamicMarriageProps,
} from '../../../domain/value-objects/legal/islamic-marriage.vo';
import {
  MarriageDetails,
  MarriageDetailsProps,
} from '../../../domain/value-objects/legal/marriage-details.vo';
import {
  KenyanMarriageDates,
  KenyanMarriageDatesProps,
} from '../../../domain/value-objects/temporal/kenyan-marriage-dates.vo';

@Injectable()
export class MarriageMapper {
  /**
   * Converts Prisma Marriage record to Domain Marriage entity
   * Handles complex Value Object reconstruction
   */
  toDomain(raw: PrismaMarriage | null): Marriage | null {
    if (!raw) return null;

    try {
      // 1. Reconstitute KenyanMarriageDates Value Object
      const dates = this.reconstituteKenyanMarriageDates(raw);

      // 2. Reconstitute MarriageDetails Value Object
      const details = this.reconstituteMarriageDetails(raw, dates);

      // 3. Reconstitute BridePrice Value Object if applicable
      const bridePrice = this.reconstituteBridePrice(raw);

      // 4. Reconstitute CustomaryMarriage Value Object if applicable
      const customaryMarriage = this.reconstituteCustomaryMarriage(raw);

      // 5. Reconstitute IslamicMarriage Value Object if applicable
      const islamicMarriage = this.reconstituteIslamicMarriage(raw);

      // 6. Assemble MarriageProps
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
        spouse1MaritalStatusAtMarriage: raw.spouse1MaritalStatusAtMarriage as MarriageStatus,
        spouse2MaritalStatusAtMarriage: raw.spouse2MaritalStatusAtMarriage as MarriageStatus,
        separationDate: raw.separationDate ?? undefined,
        separationReason: raw.separationReason ?? undefined,
        maintenanceOrderIssued: raw.maintenanceOrderIssued,
        maintenanceOrderNumber: raw.maintenanceOrderNumber ?? undefined,
        courtValidationDate: raw.courtValidationDate ?? undefined,
        isValidUnderKenyanLaw: raw.isValidUnderKenyanLaw,
        invalidityReason: raw.invalidityReason ?? undefined,
        isActive: raw.isActive,
        version: raw.version,
        createdAt: new Date(raw.createdAt),
        updatedAt: new Date(raw.updatedAt),
      };

      return Marriage.createFromProps(props);
    } catch (error) {
      console.error('Error reconstituting Marriage from persistence:', error);
      throw new Error(`Failed to reconstitute Marriage ${raw.id}: ${error.message}`);
    }
  }

  /**
   * Converts Domain Marriage entity to Prisma create/update input
   * Flattens complex Value Objects for persistence
   */
  toPersistence(entity: Marriage): Prisma.MarriageUncheckedCreateInput {
    const props = entity.toJSON();
    const details = props.details;
    const dates = props.dates;
    const bridePrice = props.bridePrice;
    const customary = props.customaryMarriage;
    const islamic = props.islamicMarriage;

    // Parse elder witnesses safely
    let elderWitnesses: Prisma.JsonValue = Prisma.JsonNull;
    if (customary?.witnesses && Array.isArray(customary.witnesses)) {
      elderWitnesses = customary.witnesses as Prisma.JsonValue;
    }

    // Parse elder council members safely
    let elderCouncilMembers: Prisma.JsonValue = Prisma.JsonNull;
    if (customary?.elderCouncilMembers && Array.isArray(customary.elderCouncilMembers)) {
      elderCouncilMembers = customary.elderCouncilMembers as Prisma.JsonValue;
    }

    return {
      id: props.id,
      familyId: props.familyId,
      spouse1Id: props.spouse1Id,
      spouse2Id: props.spouse2Id,
      marriageType: props.type,
      registrationNumber: details.registrationNumber,
      issuingAuthority: details.issuingAuthority,
      certificateIssueDate: details.certificateIssueDate,
      registrationDistrict: details.registrationDistrict,
      startDate: dates.marriageDate,
      endDate: dates.endDate,
      endReason: props.endReason,
      deceasedSpouseId: props.deceasedSpouseId,
      divorceDecreeNumber: props.divorceDecreeNumber,
      divorceCourt: props.divorceCourt,
      divorceDate: props.divorceDate,
      bridePricePaid:
        bridePrice?.status === 'FULLY_PAID' || bridePrice?.status === 'PARTIALLY_PAID',
      bridePriceAmount: bridePrice?.totalAmount,
      bridePriceCurrency: bridePrice?.currency,
      elderWitnesses,
      ceremonyLocation: customary?.location,
      traditionalCeremonyType: customary?.ceremonyType,
      clanApproval: customary?.isClanApproved ?? false,
      familyConsent: customary?.isFamilyConsented ?? false,
      polygamousHouseId: props.polygamousHouseId,
      isMatrimonialPropertyRegime: details.isMatrimonialPropertyRegime,
      matrimonialPropertySettled: details.isMatrimonialPropertySettled,
      isPolygamousUnderS40: details.isPolygamous,
      s40CertificateNumber: details.s40CertificateNumber,
      isIslamicUnion: props.type === 'ISLAMIC',
      nikahDate: islamic?.nikahDate,
      waliName: islamic?.waliName,
      mahrAmount: islamic?.mahrValue,
      mahrCurrency: islamic?.mahrCurrency || 'KES',
      talaqIssued: islamic?.isTalaqIssued ?? false,
      customaryType: customary?.ceremonyType,
      elderCouncilMembers,
      spouse1MaritalStatusAtMarriage: props.spouse1MaritalStatusAtMarriage,
      spouse2MaritalStatusAtMarriage: props.spouse2MaritalStatusAtMarriage,
      separationDate: props.separationDate,
      separationReason: props.separationReason,
      maintenanceOrderIssued: props.maintenanceOrderIssued,
      maintenanceOrderNumber: props.maintenanceOrderNumber,
      courtValidationDate: props.courtValidationDate,
      isValidUnderKenyanLaw: props.isValidUnderKenyanLaw,
      invalidityReason: props.invalidityReason,
      matrimonialRegime: this.determineMatrimonialRegime(props),
      isActive: props.isActive,
      version: props.version,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }

  /**
   * Creates a partial update DTO from domain changes
   */
  toPrismaUpdate(entity: Marriage): Prisma.MarriageUncheckedUpdateInput {
    const props = entity.toJSON();
    const details = props.details;
    const dates = props.dates;
    const bridePrice = props.bridePrice;
    const customary = props.customaryMarriage;
    const islamic = props.islamicMarriage;

    // Parse elder witnesses safely
    let elderWitnesses: Prisma.JsonValue = Prisma.JsonNull;
    if (customary?.witnesses && Array.isArray(customary.witnesses)) {
      elderWitnesses = customary.witnesses as Prisma.JsonValue;
    }

    // Parse elder council members safely
    let elderCouncilMembers: Prisma.JsonValue = Prisma.JsonNull;
    if (customary?.elderCouncilMembers && Array.isArray(customary.elderCouncilMembers)) {
      elderCouncilMembers = customary.elderCouncilMembers as Prisma.JsonValue;
    }

    return {
      marriageType: props.type,
      registrationNumber: details.registrationNumber,
      issuingAuthority: details.issuingAuthority,
      certificateIssueDate: details.certificateIssueDate,
      registrationDistrict: details.registrationDistrict,
      startDate: dates.marriageDate,
      endDate: dates.endDate,
      endReason: props.endReason,
      deceasedSpouseId: props.deceasedSpouseId,
      divorceDecreeNumber: props.divorceDecreeNumber,
      divorceCourt: props.divorceCourt,
      divorceDate: props.divorceDate,
      bridePricePaid:
        bridePrice?.status === 'FULLY_PAID' || bridePrice?.status === 'PARTIALLY_PAID',
      bridePriceAmount: bridePrice?.totalAmount,
      bridePriceCurrency: bridePrice?.currency,
      elderWitnesses,
      ceremonyLocation: customary?.location,
      traditionalCeremonyType: customary?.ceremonyType,
      clanApproval: customary?.isClanApproved ?? false,
      familyConsent: customary?.isFamilyConsented ?? false,
      polygamousHouseId: props.polygamousHouseId,
      isMatrimonialPropertyRegime: details.isMatrimonialPropertyRegime,
      matrimonialPropertySettled: details.isMatrimonialPropertySettled,
      isPolygamousUnderS40: details.isPolygamous,
      s40CertificateNumber: details.s40CertificateNumber,
      isIslamicUnion: props.type === 'ISLAMIC',
      nikahDate: islamic?.nikahDate,
      waliName: islamic?.waliName,
      mahrAmount: islamic?.mahrValue,
      mahrCurrency: islamic?.mahrCurrency || 'KES',
      talaqIssued: islamic?.isTalaqIssued ?? false,
      customaryType: customary?.ceremonyType,
      elderCouncilMembers,
      spouse1MaritalStatusAtMarriage: props.spouse1MaritalStatusAtMarriage,
      spouse2MaritalStatusAtMarriage: props.spouse2MaritalStatusAtMarriage,
      separationDate: props.separationDate,
      separationReason: props.separationReason,
      maintenanceOrderIssued: props.maintenanceOrderIssued,
      maintenanceOrderNumber: props.maintenanceOrderNumber,
      courtValidationDate: props.courtValidationDate,
      isValidUnderKenyanLaw: props.isValidUnderKenyanLaw,
      invalidityReason: props.invalidityReason,
      matrimonialRegime: this.determineMatrimonialRegime(props),
      isActive: props.isActive,
      version: props.version,
      updatedAt: props.updatedAt,
    };
  }

  /**
   * Converts domain entity to Prisma create input with relationships
   */
  toPrismaCreate(entity: Marriage): Prisma.MarriageCreateInput {
    const props = entity.toJSON();
    const details = props.details;
    const dates = props.dates;
    const bridePrice = props.bridePrice;
    const customary = props.customaryMarriage;
    const islamic = props.islamicMarriage;

    // Parse elder witnesses safely
    let elderWitnesses: Prisma.JsonValue = Prisma.JsonNull;
    if (customary?.witnesses && Array.isArray(customary.witnesses)) {
      elderWitnesses = customary.witnesses as Prisma.JsonValue;
    }

    // Parse elder council members safely
    let elderCouncilMembers: Prisma.JsonValue = Prisma.JsonNull;
    if (customary?.elderCouncilMembers && Array.isArray(customary.elderCouncilMembers)) {
      elderCouncilMembers = customary.elderCouncilMembers as Prisma.JsonValue;
    }

    return {
      id: props.id,
      family: { connect: { id: props.familyId } },
      spouse1: { connect: { id: props.spouse1Id } },
      spouse2: { connect: { id: props.spouse2Id } },
      marriageType: props.type,
      registrationNumber: details.registrationNumber,
      issuingAuthority: details.issuingAuthority,
      certificateIssueDate: details.certificateIssueDate,
      registrationDistrict: details.registrationDistrict,
      startDate: dates.marriageDate,
      endDate: dates.endDate,
      endReason: props.endReason,
      deceasedSpouseId: props.deceasedSpouseId,
      divorceDecreeNumber: props.divorceDecreeNumber,
      divorceCourt: props.divorceCourt,
      divorceDate: props.divorceDate,
      bridePricePaid:
        bridePrice?.status === 'FULLY_PAID' || bridePrice?.status === 'PARTIALLY_PAID',
      bridePriceAmount: bridePrice?.totalAmount,
      bridePriceCurrency: bridePrice?.currency,
      elderWitnesses,
      ceremonyLocation: customary?.location,
      traditionalCeremonyType: customary?.ceremonyType,
      clanApproval: customary?.isClanApproved ?? false,
      familyConsent: customary?.isFamilyConsented ?? false,
      polygamousHouse: props.polygamousHouseId
        ? { connect: { id: props.polygamousHouseId } }
        : undefined,
      isMatrimonialPropertyRegime: details.isMatrimonialPropertyRegime,
      matrimonialPropertySettled: details.isMatrimonialPropertySettled,
      isPolygamousUnderS40: details.isPolygamous,
      s40CertificateNumber: details.s40CertificateNumber,
      isIslamicUnion: props.type === 'ISLAMIC',
      nikahDate: islamic?.nikahDate,
      waliName: islamic?.waliName,
      mahrAmount: islamic?.mahrValue,
      mahrCurrency: islamic?.mahrCurrency || 'KES',
      talaqIssued: islamic?.isTalaqIssued ?? false,
      customaryType: customary?.ceremonyType,
      elderCouncilMembers,
      spouse1MaritalStatusAtMarriage: props.spouse1MaritalStatusAtMarriage,
      spouse2MaritalStatusAtMarriage: props.spouse2MaritalStatusAtMarriage,
      separationDate: props.separationDate,
      separationReason: props.separationReason,
      maintenanceOrderIssued: props.maintenanceOrderIssued,
      maintenanceOrderNumber: props.maintenanceOrderNumber,
      courtValidationDate: props.courtValidationDate,
      isValidUnderKenyanLaw: props.isValidUnderKenyanLaw,
      invalidityReason: props.invalidityReason,
      matrimonialRegime: this.determineMatrimonialRegime(props),
      isActive: props.isActive,
      version: props.version,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }

  // Private Helper Methods for Reconstitution

  private reconstituteKenyanMarriageDates(raw: PrismaMarriage): KenyanMarriageDates {
    const datesProps: KenyanMarriageDatesProps = {
      marriageDate: new Date(raw.startDate),
      marriageType: raw.marriageType,
      certificateIssueDate: raw.certificateIssueDate ?? undefined,
      registrationDate: raw.createdAt, // Use createdAt as registration date
      isRegistered: !!raw.registrationNumber,
      registrationNumber: raw.registrationNumber ?? undefined,
    };

    if (raw.endDate) {
      datesProps.endDate = new Date(raw.endDate);
      datesProps.dissolutionDate = new Date(raw.endDate);
      datesProps.dissolutionType =
        raw.endReason === 'DIVORCE'
          ? 'DIVORCE'
          : raw.endReason === 'ANNULMENT'
            ? 'ANNULMENT'
            : raw.endReason === 'DEATH_OF_SPOUSE'
              ? 'DEATH'
              : 'CUSTOMARY_DISSOLUTION';
      datesProps.dissolutionReason = raw.separationReason ?? raw.endReason;
    }

    if (raw.isPolygamousUnderS40) {
      datesProps.polygamousHouseEstablishedDate = raw.createdAt;
    }

    // Use factory method or create from props
    const dates = KenyanMarriageDates.create(datesProps.marriageDate, datesProps.marriageType);

    // Apply additional properties
    if (datesProps.certificateIssueDate) {
      (dates as any).certificateIssueDate = datesProps.certificateIssueDate;
    }
    if (datesProps.registrationNumber) {
      (dates as any).registrationNumber = datesProps.registrationNumber;
      (dates as any).isRegistered = true;
    }
    if (datesProps.endDate) {
      (dates as any).endDate = datesProps.endDate;
      (dates as any).dissolutionDate = datesProps.dissolutionDate;
      (dates as any).dissolutionType = datesProps.dissolutionType;
      (dates as any).dissolutionReason = datesProps.dissolutionReason;
    }

    return dates;
  }

  private reconstituteMarriageDetails(
    raw: PrismaMarriage,
    dates: KenyanMarriageDates,
  ): MarriageDetails {
    const detailsProps: MarriageDetailsProps = {
      marriageType: raw.marriageType,
      marriageDate: new Date(raw.startDate),
      isCivilRegistered: !!raw.registrationNumber,
      registrationNumber: raw.registrationNumber ?? undefined,
      issuingAuthority: raw.issuingAuthority ?? undefined,
      certificateIssueDate: raw.certificateIssueDate ?? undefined,
      registrationDistrict: raw.registrationDistrict ?? undefined,
      isMatrimonialPropertyRegime: raw.isMatrimonialPropertyRegime,
      isMatrimonialPropertySettled: raw.matrimonialPropertySettled,
      isPolygamous: raw.isPolygamousUnderS40,
      s40CertificateNumber: raw.s40CertificateNumber ?? undefined,
    };

    if (raw.endDate) {
      detailsProps.endDate = new Date(raw.endDate);
      detailsProps.endReason = raw.endReason;
    }

    // Create base details
    let details = MarriageDetails.create(detailsProps.marriageType, detailsProps.marriageDate);

    // Apply civil registration if applicable
    if (
      detailsProps.registrationNumber &&
      detailsProps.certificateIssueDate &&
      detailsProps.issuingAuthority &&
      detailsProps.registrationDistrict
    ) {
      details = details.registerCivilMarriage(
        detailsProps.registrationNumber,
        detailsProps.certificateIssueDate,
        detailsProps.issuingAuthority,
        detailsProps.registrationDistrict,
      );
    }

    // Apply polygamy status
    if (detailsProps.isPolygamous) {
      details = details.markAsPolygamous(raw.polygamousHouseId ?? undefined);
    }

    // Apply matrimonial property status
    if (detailsProps.isMatrimonialPropertyRegime) {
      (details as any).isMatrimonialPropertyRegime = true;
      (details as any).isMatrimonialPropertySettled = detailsProps.isMatrimonialPropertySettled;
    }

    // Apply S.40 certificate
    if (detailsProps.s40CertificateNumber) {
      (details as any).s40CertificateNumber = detailsProps.s40CertificateNumber;
    }

    // Apply end date if exists
    if (detailsProps.endDate) {
      details = details.endMarriage(detailsProps.endDate, detailsProps.endReason);
    }

    return details;
  }

  private reconstituteBridePrice(raw: PrismaMarriage): BridePrice | undefined {
    if (raw.bridePriceAmount === null) return undefined;

    const bridePriceProps: BridePriceProps = {
      totalAmount: raw.bridePriceAmount,
      currency: raw.bridePriceCurrency || 'KES',
      status: raw.bridePricePaid
        ? ('FULLY_PAID' as BridePriceStatus)
        : ('PENDING' as BridePriceStatus),
      payments: [], // Would need separate table to store payments
    };

    // Create bride price
    const bridePrice = BridePrice.create(bridePriceProps.totalAmount, bridePriceProps.currency);

    // Apply status
    if (bridePriceProps.status === 'FULLY_PAID') {
      // Add a dummy payment to mark as paid
      (bridePrice as any).addPayment({
        type: 'CASH',
        description: 'Database reconstitution payment',
        totalValue: bridePriceProps.totalAmount,
        date: new Date(raw.startDate),
        witnesses: [],
      });
    }

    return bridePrice;
  }

  private reconstituteCustomaryMarriage(raw: PrismaMarriage): CustomaryMarriage | undefined {
    const isCustomary =
      raw.marriageType === 'CUSTOMARY' ||
      raw.marriageType === 'TRADITIONAL' ||
      raw.marriageType === 'CUSTOMARY_MARRIAGE';

    if (!isCustomary) return undefined;

    const customaryProps: CustomaryMarriageProps = {
      ethnicGroup: '', // Not stored in Marriage table, would need to come from FamilyMember
      ceremonyType: raw.customaryType || raw.traditionalCeremonyType || '',
      ceremonyDate: new Date(raw.startDate),
      location: raw.ceremonyLocation || '',
      witnesses: (raw.elderWitnesses as any) || [],
      elderCouncilMembers: (raw.elderCouncilMembers as any) || [],
      isClanApproved: raw.clanApproval,
      clanApprovalDate: raw.clanApproval ? raw.createdAt : undefined,
      isFamilyConsented: raw.familyConsent,
      familyConsentDate: raw.familyConsent ? raw.createdAt : undefined,
    };

    // Create customary marriage
    const customaryMarriage = CustomaryMarriage.create(
      customaryProps.ethnicGroup,
      customaryProps.ceremonyType,
      customaryProps.ceremonyDate,
      customaryProps.location,
    );

    // Apply additional properties
    if (customaryProps.isClanApproved && customaryProps.clanApprovalDate) {
      (customaryMarriage as any).grantClanApproval(customaryProps.clanApprovalDate);
    }

    if (customaryProps.isFamilyConsented && customaryProps.familyConsentDate) {
      (customaryMarriage as any).grantFamilyConsent(customaryProps.familyConsentDate);
    }

    // Add witnesses
    if (Array.isArray(customaryProps.witnesses)) {
      customaryProps.witnesses.forEach((witness: any) => {
        if (witness.name) {
          (customaryMarriage as any).addElderWitness(
            witness.name,
            witness.age || 0,
            witness.relationship || '',
          );
        }
      });
    }

    // Add council members
    if (Array.isArray(customaryProps.elderCouncilMembers)) {
      customaryProps.elderCouncilMembers.forEach((member: any) => {
        (customaryMarriage as any).addCouncilMember(
          member.name,
          member.position || '',
          member.clan || '',
        );
      });
    }

    return customaryMarriage;
  }

  private reconstituteIslamicMarriage(raw: PrismaMarriage): IslamicMarriage | undefined {
    if (raw.marriageType !== 'ISLAMIC') return undefined;

    const islamicProps: IslamicMarriageProps = {
      nikahDate: raw.nikahDate || new Date(raw.startDate),
      nikahLocation: raw.ceremonyLocation || '',
      imamName: '', // Not stored in Marriage table
      waliName: raw.waliName || '',
      mahrValue: raw.mahrAmount || 0,
      mahrCurrency: raw.mahrCurrency || 'KES',
      isTalaqIssued: raw.talaqIssued,
      talaqType: raw.talaqIssued ? 'TALAQ_AL_BIDDAH' : undefined,
      talaqDate: raw.talaqIssued ? raw.endDate || undefined : undefined,
    };

    // Create Islamic marriage
    const islamicMarriage = IslamicMarriage.create(
      islamicProps.nikahDate,
      islamicProps.nikahLocation,
      islamicProps.imamName,
      islamicProps.waliName,
      islamicProps.mahrValue,
    );

    // Apply talaq if issued
    if (islamicProps.isTalaqIssued && islamicProps.talaqDate) {
      (islamicMarriage as any).issueTalaq(
        islamicProps.talaqType || 'TALAQ_AL_BIDDAH',
        islamicProps.talaqDate,
        3, // Default to 3 talaqs
      );
    }

    return islamicMarriage;
  }

  /**
   * Determine matrimonial regime based on marriage properties
   */
  private determineMatrimonialRegime(props: any): string {
    if (props.isPolygamousUnderS40) {
      return 'POLYGAMOUS_S40';
    }

    if (
      props.type === 'CUSTOMARY' ||
      props.type === 'TRADITIONAL' ||
      props.type === 'CUSTOMARY_MARRIAGE'
    ) {
      return 'CUSTOMARY';
    }

    if (props.type === 'ISLAMIC') {
      return 'ISLAMIC';
    }

    return 'MONOGAMOUS';
  }

  /**
   * Creates Prisma where clause for finding by ID
   */
  createWhereById(id: string): Prisma.MarriageWhereUniqueInput {
    return { id };
  }

  /**
   * Creates Prisma where clause for finding by spouses
   */
  createWhereBySpouses(spouse1Id: string, spouse2Id: string): Prisma.MarriageWhereInput {
    return {
      OR: [
        { spouse1Id, spouse2Id },
        { spouse1Id: spouse2Id, spouse2Id: spouse1Id },
      ],
    };
  }

  /**
   * Creates Prisma where clause for finding active marriages
   */
  createWhereActive(): Prisma.MarriageWhereInput {
    return { isActive: true, endDate: null };
  }

  /**
   * Creates Prisma where clause for finding polygamous marriages under S.40
   */
  createWherePolygamousUnderS40(): Prisma.MarriageWhereInput {
    return { isPolygamousUnderS40: true };
  }

  /**
   * Creates Prisma where clause for finding marriages by type
   */
  createWhereByType(type: MarriageType): Prisma.MarriageWhereInput {
    return { marriageType: type };
  }

  /**
   * Creates Prisma include clause for eager loading relationships
   */
  createIncludeClause(): Prisma.MarriageInclude {
    return {
      family: true,
      spouse1: true,
      spouse2: true,
      polygamousHouse: true,
    };
  }

  /**
   * Validates mapping consistency between domain and persistence
   */
  validateMapping(entity: Marriage, raw: PrismaMarriage): boolean {
    const errors: string[] = [];

    // Basic ID validation
    if (entity.id !== raw.id) {
      errors.push(`ID mismatch: Domain=${entity.id}, Persistence=${raw.id}`);
    }

    // Version validation for optimistic concurrency
    if (entity.version !== raw.version) {
      errors.push(`Version mismatch: Domain=${entity.version}, Persistence=${raw.version}`);
    }

    // Validate marriage type
    if (entity.type !== raw.marriageType) {
      errors.push(`Marriage type mismatch: Domain=${entity.type}, Persistence=${raw.marriageType}`);
    }

    // Validate active status
    if (entity.isActive !== raw.isActive) {
      errors.push(`Active status mismatch: Domain=${entity.isActive}, Persistence=${raw.isActive}`);
    }

    // Validate dates
    const rawStartDate = new Date(raw.startDate);
    if (entity.dates.marriageDate.getTime() !== rawStartDate.getTime()) {
      errors.push(
        `Start date mismatch: Domain=${entity.dates.marriageDate}, Persistence=${rawStartDate}`,
      );
    }

    // Validate S.40 compliance
    if (entity.isPolygamous !== raw.isPolygamousUnderS40) {
      errors.push(
        `S.40 polygamy status mismatch: Domain=${entity.isPolygamous}, Persistence=${raw.isPolygamousUnderS40}`,
      );
    }

    if (errors.length > 0) {
      console.warn('Marriage mapping validation errors:', errors);
      return false;
    }

    return true;
  }

  /**
   * Extracts relationship IDs from Prisma result with includes
   */
  extractRelationships(
    prismaMarriage: PrismaMarriage & {
      family?: { id: string };
      spouse1?: { id: string };
      spouse2?: { id: string };
      polygamousHouse?: { id: string };
    },
  ) {
    return {
      familyId: prismaMarriage.family?.id || prismaMarriage.familyId,
      spouse1Id: prismaMarriage.spouse1?.id || prismaMarriage.spouse1Id,
      spouse2Id: prismaMarriage.spouse2?.id || prismaMarriage.spouse2Id,
      polygamousHouseId: prismaMarriage.polygamousHouse?.id || prismaMarriage.polygamousHouseId,
    };
  }

  /**
   * Creates a batch mapper for multiple marriages
   */
  toDomainBatch(rawList: PrismaMarriage[]): Marriage[] {
    return rawList.map((raw) => this.toDomain(raw)).filter(Boolean) as Marriage[];
  }

  /**
   * Creates batch persistence data
   */
  toPersistenceBatch(entityList: Marriage[]): Prisma.MarriageUncheckedCreateInput[] {
    return entityList.map((entity) => this.toPersistence(entity));
  }

  /**
   * Checks if marriage is active based on persistence data
   */
  isActiveInPersistence(raw: PrismaMarriage): boolean {
    return raw.isActive && !raw.endDate;
  }

  /**
   * Creates filter for marriages by date range
   */
  createDateRangeFilter(startDate?: Date, endDate?: Date): Prisma.MarriageWhereInput {
    const filter: any = {};

    if (startDate) {
      filter.startDate = { gte: startDate };
    }

    if (endDate) {
      filter.endDate = { lte: endDate };
    }

    return filter;
  }

  /**
   * Creates sort order for marriages
   */
  createSortOrder(
    sortBy: 'startDate' | 'endDate' | 'createdAt' = 'startDate',
    order: 'asc' | 'desc' = 'desc',
  ): Prisma.MarriageOrderByWithRelationInput {
    return { [sortBy]: order };
  }

  /**
   * Helper to extract marriage statistics from persistence data
   */
  extractStatistics(rawList: PrismaMarriage[]): {
    total: number;
    active: number;
    byType: Record<MarriageType, number>;
    byYear: Record<number, number>;
    polygamous: number;
    dissolved: number;
  } {
    const stats = {
      total: rawList.length,
      active: 0,
      byType: {} as Record<MarriageType, number>,
      byYear: {} as Record<number, number>,
      polygamous: 0,
      dissolved: 0,
    };

    rawList.forEach((raw) => {
      // Count active
      if (raw.isActive && !raw.endDate) {
        stats.active++;
      }

      // Count by type
      stats.byType[raw.marriageType] = (stats.byType[raw.marriageType] || 0) + 1;

      // Count by year
      const year = new Date(raw.startDate).getFullYear();
      stats.byYear[year] = (stats.byYear[year] || 0) + 1;

      // Count polygamous
      if (raw.isPolygamousUnderS40) {
        stats.polygamous++;
      }

      // Count dissolved
      if (raw.endDate) {
        stats.dissolved++;
      }
    });

    return stats;
  }

  /**
   * Creates filter for marriages affecting inheritance
   */
  createInheritanceFilter(): Prisma.MarriageWhereInput {
    return {
      OR: [
        {
          // Active marriages create spousal inheritance rights
          isActive: true,
          endDate: null,
        },
        {
          // Recent dissolutions might still have claims
          endDate: {
            gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // Within 1 year
          },
        },
      ],
    };
  }

  /**
   * Helper to convert CreateMarriageProps to Prisma create input
   */
  createPropsToPrisma(props: CreateMarriageProps): Prisma.MarriageCreateInput {
    const marriage = Marriage.create(props);
    return this.toPrismaCreate(marriage);
  }
}

/**
 * Factory for creating MarriageMapper with dependency injection support
 */
export class MarriageMapperFactory {
  static create(): MarriageMapper {
    return new MarriageMapper();
  }
}

/**
 * Type guard for Prisma Marriage with relationships
 */
export function isPrismaMarriageWithRelationships(marriage: any): marriage is PrismaMarriage & {
  family?: { id: string };
  spouse1?: { id: string };
  spouse2?: { id: string };
  polygamousHouse?: { id: string };
} {
  return marriage && typeof marriage === 'object' && 'id' in marriage && 'familyId' in marriage;
}

/**
 * Helper to validate marriage type compatibility with Kenyan law
 */
export function validateMarriageTypeCompatibility(
  type: MarriageType,
  isPolygamous: boolean,
): boolean {
  if (isPolygamous) {
    return (
      type === 'CUSTOMARY' ||
      type === 'ISLAMIC' ||
      type === 'TRADITIONAL' ||
      type === 'CUSTOMARY_MARRIAGE'
    );
  }
  return true; // All types can be monogamous
}

/**
 * Helper to determine if marriage requires S.40 certificate
 */
export function requiresS40Certificate(type: MarriageType, isPolygamous: boolean): boolean {
  return (
    isPolygamous &&
    (type === 'CUSTOMARY' || type === 'TRADITIONAL' || type === 'CUSTOMARY_MARRIAGE')
  );
}
