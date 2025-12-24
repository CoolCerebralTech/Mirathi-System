// src/family-service/src/infrastructure/mappers/family.mapper.ts
import {
  Prisma,
  AdoptionRecord as PrismaAdoptionRecord,
  AdoptionStatus as PrismaAdoptionStatus,
  AdoptionType as PrismaAdoptionType,
  CohabitationRecord as PrismaCohabitationRecord,
  CohabitationStability as PrismaCohabitationStability,
  CohabitationType as PrismaCohabitationType,
  ConflictResolutionStatus as PrismaConflictResolutionStatus,
  Gender as PrismaGender,
  PolygamousHouse as PrismaHouse,
  HouseDissolutionReason as PrismaHouseDissolutionReason,
  HouseEstablishmentType as PrismaHouseEstablishmentType,
  Marriage as PrismaMarriage,
  MarriageEndReason as PrismaMarriageEndReason,
  MarriageType as PrismaMarriageType,
  FamilyMember as PrismaMember,
  FamilyRelationship as PrismaRelationship,
  RelationshipType as PrismaRelationshipType,
  RelationshipVerificationLevel as PrismaRelationshipVerificationLevel,
  RelationshipVerificationMethod as PrismaRelationshipVerificationMethod,
  VerificationStatus as PrismaVerificationStatus,
} from '@prisma/client';

import { FamilyAggregate, FamilyProps } from '../../../domain/aggregates/family.aggregate';
import { UniqueEntityID } from '../../../domain/base/unique-entity-id';
import { AdoptionRecord } from '../../../domain/entities/adoption-record.entity';
import { CohabitationRecord } from '../../../domain/entities/cohabitation-record.entity';
import { FamilyMember } from '../../../domain/entities/family-member.entity';
import { FamilyRelationship } from '../../../domain/entities/family-relationship.entity';
import { Marriage } from '../../../domain/entities/marriage.entity';
import { PolygamousHouse } from '../../../domain/entities/polygamous-house.entity';
import {
  AdoptionType,
  AdoptionStatus as DomainAdoptionStatus,
  CohabitationStability as DomainCohabitationStability,
  CohabitationType as DomainCohabitationType,
  ConflictResolutionStatus as DomainConflictResolutionStatus,
  HouseDissolutionReason as DomainHouseDissolutionReason,
  HouseEstablishmentType as DomainHouseEstablishmentType,
  RelationshipType as DomainRelationshipType,
  RelationshipVerificationLevel as DomainVerificationLevel,
  RelationshipVerificationMethod as DomainVerificationMethod,
  VerificationStatus as DomainVerificationStatus,
  KenyanCounty,
  MarriageStatus,
} from '../../../domain/value-objects/family-enums.vo';
import { KenyanNationalId } from '../../../domain/value-objects/kenyan-identity.vo';
import { PersonName } from '../../../domain/value-objects/person-name.vo';

// -----------------------------------------------------------------------------
// Type Definitions for Prisma Includes
// -----------------------------------------------------------------------------

type FamilyWithRelations = Prisma.FamilyGetPayload<{
  include: {
    members: true;
    marriages: true;
    polygamousHouses: true;
    relationships: true;
    cohabitationRecords: true;
    adoptionRecords: true;
  };
}>;

// -----------------------------------------------------------------------------
// Helper Mappers for Complex Domain Properties
// -----------------------------------------------------------------------------

const RelationshipTypeMap: Record<DomainRelationshipType, PrismaRelationshipType> = {
  [DomainRelationshipType.SPOUSE]: PrismaRelationshipType.SPOUSE,
  [DomainRelationshipType.EX_SPOUSE]: PrismaRelationshipType.EX_SPOUSE,
  [DomainRelationshipType.CHILD]: PrismaRelationshipType.CHILD,
  [DomainRelationshipType.ADOPTED_CHILD]: PrismaRelationshipType.ADOPTED_CHILD,
  [DomainRelationshipType.STEPCHILD]: PrismaRelationshipType.STEPCHILD,
  [DomainRelationshipType.PARENT]: PrismaRelationshipType.PARENT,
  [DomainRelationshipType.SIBLING]: PrismaRelationshipType.SIBLING,
  [DomainRelationshipType.HALF_SIBLING]: PrismaRelationshipType.HALF_SIBLING,
  [DomainRelationshipType.GRANDCHILD]: PrismaRelationshipType.GRANDCHILD,
  [DomainRelationshipType.GRANDPARENT]: PrismaRelationshipType.GRANDPARENT,
  [DomainRelationshipType.NIECE_NEPHEW]: PrismaRelationshipType.NIECE_NEPHEW,
  [DomainRelationshipType.AUNT_UNCLE]: PrismaRelationshipType.AUNT_UNCLE,
  [DomainRelationshipType.COUSIN]: PrismaRelationshipType.COUSIN,
  [DomainRelationshipType.GUARDIAN]: PrismaRelationshipType.GUARDIAN,
  [DomainRelationshipType.OTHER]: PrismaRelationshipType.OTHER,
};

const ReverseRelationshipTypeMap: Record<PrismaRelationshipType, DomainRelationshipType> = {
  [PrismaRelationshipType.SPOUSE]: DomainRelationshipType.SPOUSE,
  [PrismaRelationshipType.EX_SPOUSE]: DomainRelationshipType.EX_SPOUSE,
  [PrismaRelationshipType.CHILD]: DomainRelationshipType.CHILD,
  [PrismaRelationshipType.ADOPTED_CHILD]: DomainRelationshipType.ADOPTED_CHILD,
  [PrismaRelationshipType.STEPCHILD]: DomainRelationshipType.STEPCHILD,
  [PrismaRelationshipType.PARENT]: DomainRelationshipType.PARENT,
  [PrismaRelationshipType.SIBLING]: DomainRelationshipType.SIBLING,
  [PrismaRelationshipType.HALF_SIBLING]: DomainRelationshipType.HALF_SIBLING,
  [PrismaRelationshipType.GRANDCHILD]: DomainRelationshipType.GRANDCHILD,
  [PrismaRelationshipType.GRANDPARENT]: DomainRelationshipType.GRANDPARENT,
  [PrismaRelationshipType.NIECE_NEPHEW]: DomainRelationshipType.NIECE_NEPHEW,
  [PrismaRelationshipType.AUNT_UNCLE]: DomainRelationshipType.AUNT_UNCLE,
  [PrismaRelationshipType.COUSIN]: DomainRelationshipType.COUSIN,
  [PrismaRelationshipType.GUARDIAN]: DomainRelationshipType.GUARDIAN,
  [PrismaRelationshipType.OTHER]: DomainRelationshipType.OTHER,
};

const HouseEstablishmentTypeMap: Record<
  PrismaHouseEstablishmentType,
  DomainHouseEstablishmentType
> = {
  [PrismaHouseEstablishmentType.CUSTOMARY]: DomainHouseEstablishmentType.CUSTOMARY,
  [PrismaHouseEstablishmentType.ISLAMIC]: DomainHouseEstablishmentType.ISLAMIC,
  [PrismaHouseEstablishmentType.TRADITIONAL]: DomainHouseEstablishmentType.TRADITIONAL,
  [PrismaHouseEstablishmentType.COURT_RECOGNIZED]: DomainHouseEstablishmentType.COURT_RECOGNIZED,
};

const ReverseHouseEstablishmentTypeMap: Record<
  DomainHouseEstablishmentType,
  PrismaHouseEstablishmentType
> = {
  [DomainHouseEstablishmentType.CUSTOMARY]: PrismaHouseEstablishmentType.CUSTOMARY,
  [DomainHouseEstablishmentType.ISLAMIC]: PrismaHouseEstablishmentType.ISLAMIC,
  [DomainHouseEstablishmentType.TRADITIONAL]: PrismaHouseEstablishmentType.TRADITIONAL,
  [DomainHouseEstablishmentType.COURT_RECOGNIZED]: PrismaHouseEstablishmentType.COURT_RECOGNIZED,
};

const CohabitationTypeMap: Record<PrismaCohabitationType, DomainCohabitationType> = {
  [PrismaCohabitationType.COME_WE_STAY]: DomainCohabitationType.COME_WE_STAY,
  [PrismaCohabitationType.LONG_TERM_PARTNERSHIP]: DomainCohabitationType.LONG_TERM_PARTNERSHIP,
  [PrismaCohabitationType.DATING]: DomainCohabitationType.DATING,
  [PrismaCohabitationType.ENGAGED]: DomainCohabitationType.ENGAGED,
};

const ReverseCohabitationTypeMap: Record<DomainCohabitationType, PrismaCohabitationType> = {
  [DomainCohabitationType.COME_WE_STAY]: PrismaCohabitationType.COME_WE_STAY,
  [DomainCohabitationType.LONG_TERM_PARTNERSHIP]: PrismaCohabitationType.LONG_TERM_PARTNERSHIP,
  [DomainCohabitationType.DATING]: PrismaCohabitationType.DATING,
  [DomainCohabitationType.ENGAGED]: PrismaCohabitationType.ENGAGED,
};

const CohabitationStabilityMap: Record<PrismaCohabitationStability, DomainCohabitationStability> = {
  [PrismaCohabitationStability.STABLE]: DomainCohabitationStability.STABLE,
  [PrismaCohabitationStability.VOLATILE]: DomainCohabitationStability.VOLATILE,
  [PrismaCohabitationStability.ON_OFF]: DomainCohabitationStability.ON_OFF,
  [PrismaCohabitationStability.UNKNOWN]: DomainCohabitationStability.UNKNOWN,
};

const ReverseCohabitationStabilityMap: Record<
  DomainCohabitationStability,
  PrismaCohabitationStability
> = {
  [DomainCohabitationStability.STABLE]: PrismaCohabitationStability.STABLE,
  [DomainCohabitationStability.VOLATILE]: PrismaCohabitationStability.VOLATILE,
  [DomainCohabitationStability.ON_OFF]: PrismaCohabitationStability.ON_OFF,
  [DomainCohabitationStability.UNKNOWN]: PrismaCohabitationStability.UNKNOWN,
};

const AdoptionTypeMap: Record<PrismaAdoptionType, AdoptionType> = {
  [PrismaAdoptionType.STATUTORY]: AdoptionType.STATUTORY,
  [PrismaAdoptionType.CUSTOMARY]: AdoptionType.CUSTOMARY,
  [PrismaAdoptionType.INTERNATIONAL]: AdoptionType.INTERNATIONAL,
  [PrismaAdoptionType.KINSHIP]: AdoptionType.KINSHIP,
  [PrismaAdoptionType.FOSTER_TO_ADOPT]: AdoptionType.FOSTER_TO_ADOPT,
  [PrismaAdoptionType.STEP_PARENT]: AdoptionType.STEP_PARENT,
  [PrismaAdoptionType.RELATIVE]: AdoptionType.RELATIVE,
};

const ReverseAdoptionTypeMap: Record<AdoptionType, PrismaAdoptionType> = {
  [AdoptionType.STATUTORY]: PrismaAdoptionType.STATUTORY,
  [AdoptionType.CUSTOMARY]: PrismaAdoptionType.CUSTOMARY,
  [AdoptionType.INTERNATIONAL]: PrismaAdoptionType.INTERNATIONAL,
  [AdoptionType.KINSHIP]: PrismaAdoptionType.KINSHIP,
  [AdoptionType.FOSTER_TO_ADOPT]: PrismaAdoptionType.FOSTER_TO_ADOPT,
  [AdoptionType.STEP_PARENT]: PrismaAdoptionType.STEP_PARENT,
  [AdoptionType.RELATIVE]: PrismaAdoptionType.RELATIVE,
};

const AdoptionStatusMap: Record<PrismaAdoptionStatus, DomainAdoptionStatus> = {
  [PrismaAdoptionStatus.PENDING]: DomainAdoptionStatus.PENDING,
  [PrismaAdoptionStatus.IN_PROGRESS]: DomainAdoptionStatus.IN_PROGRESS,
  [PrismaAdoptionStatus.FINALIZED]: DomainAdoptionStatus.FINALIZED,
  [PrismaAdoptionStatus.REVOKED]: DomainAdoptionStatus.REVOKED,
  [PrismaAdoptionStatus.ANNULED]: DomainAdoptionStatus.ANNULED,
  [PrismaAdoptionStatus.APPEALED]: DomainAdoptionStatus.APPEALED,
};

const ReverseAdoptionStatusMap: Record<DomainAdoptionStatus, PrismaAdoptionStatus> = {
  [DomainAdoptionStatus.PENDING]: PrismaAdoptionStatus.PENDING,
  [DomainAdoptionStatus.IN_PROGRESS]: PrismaAdoptionStatus.IN_PROGRESS,
  [DomainAdoptionStatus.FINALIZED]: PrismaAdoptionStatus.FINALIZED,
  [DomainAdoptionStatus.REVOKED]: PrismaAdoptionStatus.REVOKED,
  [DomainAdoptionStatus.ANNULED]: PrismaAdoptionStatus.ANNULED,
  [DomainAdoptionStatus.APPEALED]: PrismaAdoptionStatus.APPEALED,
};

const VerificationStatusMap: Record<PrismaVerificationStatus, DomainVerificationStatus> = {
  [PrismaVerificationStatus.UNVERIFIED]: DomainVerificationStatus.UNVERIFIED,
  [PrismaVerificationStatus.PENDING_VERIFICATION]: DomainVerificationStatus.PENDING_VERIFICATION,
  [PrismaVerificationStatus.VERIFIED]: DomainVerificationStatus.VERIFIED,
  [PrismaVerificationStatus.REJECTED]: DomainVerificationStatus.REJECTED,
  [PrismaVerificationStatus.DISPUTED]: DomainVerificationStatus.DISPUTED,
};

const ReverseVerificationStatusMap: Record<DomainVerificationStatus, PrismaVerificationStatus> = {
  [DomainVerificationStatus.UNVERIFIED]: PrismaVerificationStatus.UNVERIFIED,
  [DomainVerificationStatus.PENDING_VERIFICATION]: PrismaVerificationStatus.PENDING_VERIFICATION,
  [DomainVerificationStatus.VERIFIED]: PrismaVerificationStatus.VERIFIED,
  [DomainVerificationStatus.REJECTED]: PrismaVerificationStatus.REJECTED,
  [DomainVerificationStatus.DISPUTED]: PrismaVerificationStatus.DISPUTED,
};

const VerificationLevelMap: Record<PrismaRelationshipVerificationLevel, DomainVerificationLevel> = {
  [PrismaRelationshipVerificationLevel.UNVERIFIED]: DomainVerificationLevel.UNVERIFIED,
  [PrismaRelationshipVerificationLevel.PARTIALLY_VERIFIED]:
    DomainVerificationLevel.PARTIALLY_VERIFIED,
  [PrismaRelationshipVerificationLevel.FULLY_VERIFIED]: DomainVerificationLevel.FULLY_VERIFIED,
  [PrismaRelationshipVerificationLevel.DISPUTED]: DomainVerificationLevel.DISPUTED,
};

const ReverseVerificationLevelMap: Record<
  DomainVerificationLevel,
  PrismaRelationshipVerificationLevel
> = {
  [DomainVerificationLevel.UNVERIFIED]: PrismaRelationshipVerificationLevel.UNVERIFIED,
  [DomainVerificationLevel.PARTIALLY_VERIFIED]:
    PrismaRelationshipVerificationLevel.PARTIALLY_VERIFIED,
  [DomainVerificationLevel.FULLY_VERIFIED]: PrismaRelationshipVerificationLevel.FULLY_VERIFIED,
  [DomainVerificationLevel.DISPUTED]: PrismaRelationshipVerificationLevel.DISPUTED,
};

const VerificationMethodMap: Record<
  PrismaRelationshipVerificationMethod,
  DomainVerificationMethod
> = {
  [PrismaRelationshipVerificationMethod.DNA]: DomainVerificationMethod.DNA,
  [PrismaRelationshipVerificationMethod.DOCUMENT]: DomainVerificationMethod.DOCUMENT,
  [PrismaRelationshipVerificationMethod.FAMILY_CONSENSUS]:
    DomainVerificationMethod.FAMILY_CONSENSUS,
  [PrismaRelationshipVerificationMethod.COURT_ORDER]: DomainVerificationMethod.COURT_ORDER,
  [PrismaRelationshipVerificationMethod.TRADITIONAL]: DomainVerificationMethod.TRADITIONAL,
};

const ReverseVerificationMethodMap: Record<
  DomainVerificationMethod,
  PrismaRelationshipVerificationMethod
> = {
  [DomainVerificationMethod.DNA]: PrismaRelationshipVerificationMethod.DNA,
  [DomainVerificationMethod.DOCUMENT]: PrismaRelationshipVerificationMethod.DOCUMENT,
  [DomainVerificationMethod.FAMILY_CONSENSUS]:
    PrismaRelationshipVerificationMethod.FAMILY_CONSENSUS,
  [DomainVerificationMethod.COURT_ORDER]: PrismaRelationshipVerificationMethod.COURT_ORDER,
  [DomainVerificationMethod.TRADITIONAL]: PrismaRelationshipVerificationMethod.TRADITIONAL,
};

const ConflictResolutionStatusMap: Record<
  PrismaConflictResolutionStatus,
  DomainConflictResolutionStatus
> = {
  [PrismaConflictResolutionStatus.RESOLVED]: DomainConflictResolutionStatus.RESOLVED,
  [PrismaConflictResolutionStatus.PENDING]: DomainConflictResolutionStatus.PENDING,
  [PrismaConflictResolutionStatus.MEDIATION]: DomainConflictResolutionStatus.MEDIATION,
  [PrismaConflictResolutionStatus.COURT]: DomainConflictResolutionStatus.COURT,
};

const ReverseConflictResolutionStatusMap: Record<
  DomainConflictResolutionStatus,
  PrismaConflictResolutionStatus
> = {
  [DomainConflictResolutionStatus.RESOLVED]: PrismaConflictResolutionStatus.RESOLVED,
  [DomainConflictResolutionStatus.PENDING]: PrismaConflictResolutionStatus.PENDING,
  [DomainConflictResolutionStatus.MEDIATION]: PrismaConflictResolutionStatus.MEDIATION,
  [DomainConflictResolutionStatus.COURT]: PrismaConflictResolutionStatus.COURT,
};

const HouseDissolutionReasonMap: Record<
  PrismaHouseDissolutionReason,
  DomainHouseDissolutionReason
> = {
  [PrismaHouseDissolutionReason.WIFE_DECEASED]: DomainHouseDissolutionReason.WIFE_DECEASED,
  [PrismaHouseDissolutionReason.WIFE_DIVORCED]: DomainHouseDissolutionReason.WIFE_DIVORCED,
  [PrismaHouseDissolutionReason.HOUSE_MERGED]: DomainHouseDissolutionReason.HOUSE_MERGED,
  [PrismaHouseDissolutionReason.COURT_ORDER]: DomainHouseDissolutionReason.COURT_ORDER,
};

const ReverseHouseDissolutionReasonMap: Record<
  DomainHouseDissolutionReason,
  PrismaHouseDissolutionReason
> = {
  [DomainHouseDissolutionReason.WIFE_DECEASED]: PrismaHouseDissolutionReason.WIFE_DECEASED,
  [DomainHouseDissolutionReason.WIFE_DIVORCED]: PrismaHouseDissolutionReason.WIFE_DIVORCED,
  [DomainHouseDissolutionReason.HOUSE_MERGED]: PrismaHouseDissolutionReason.HOUSE_MERGED,
  [DomainHouseDissolutionReason.COURT_ORDER]: PrismaHouseDissolutionReason.COURT_ORDER,
};

export class FamilyMapper {
  // ===========================================================================
  // 🔄 PERSISTENCE (DB) -> DOMAIN
  // ===========================================================================

  static toDomain(raw: FamilyWithRelations): FamilyAggregate {
    const id = new UniqueEntityID(raw.id);

    const members = raw.members.map((m) => FamilyMapper.toDomainMember(m));
    const marriages = raw.marriages.map((m) => FamilyMapper.toDomainMarriage(m));
    const houses = raw.polygamousHouses.map((h) => FamilyMapper.toDomainHouse(h));
    const relationships = raw.relationships.map((r) => FamilyMapper.toDomainRelationship(r));
    const cohabitations = raw.cohabitationRecords.map((c) => FamilyMapper.toDomainCohabitation(c));
    const adoptions = raw.adoptionRecords.map((a) => FamilyMapper.toDomainAdoption(a));

    const props: FamilyProps = {
      name: raw.name,
      description: raw.description || undefined,
      creatorId: new UniqueEntityID(raw.creatorId),

      clanName: raw.clanName || undefined,
      subClan: raw.subClan || undefined,
      ancestralHome: raw.ancestralHome || undefined,
      familyTotem: raw.familyTotem || undefined,
      homeCounty: raw.homeCounty as KenyanCounty,

      members,
      marriages,
      houses,
      relationships,
      cohabitations,
      adoptions,

      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };

    return FamilyAggregate.restore(props, id, raw.version);
  }

  // ===========================================================================
  // 🔄 DOMAIN -> PERSISTENCE (DB)
  // ===========================================================================

  static toPersistence(aggregate: FamilyAggregate): {
    family: Prisma.FamilyCreateInput;
    members: Prisma.FamilyMemberUncheckedCreateInput[];
    marriages: Prisma.MarriageUncheckedCreateInput[];
    houses: Prisma.PolygamousHouseUncheckedCreateInput[];
    relationships: Prisma.FamilyRelationshipUncheckedCreateInput[];
    cohabitations: Prisma.CohabitationRecordUncheckedCreateInput[];
    adoptions: Prisma.AdoptionRecordUncheckedCreateInput[];
  } {
    const familyId = aggregate.id.toString();
    const props = aggregate.toProps();

    return {
      family: {
        id: familyId,
        name: props.name,
        description: props.description,
        creatorId: props.creatorId.toString(),

        clanName: props.clanName,
        subClan: props.subClan,
        ancestralHome: props.ancestralHome,
        familyTotem: props.familyTotem,
        homeCounty: props.homeCounty as KenyanCounty,

        memberCount: aggregate.memberCount,
        isPolygamous: aggregate.isPolygamous(),
        version: aggregate.getVersion(),

        createdAt: props.createdAt,
        updatedAt: props.updatedAt,
      },
      members: props.members.map((member) => FamilyMapper.toPersistenceMember(member, familyId)),
      marriages: props.marriages.map((marriage) =>
        FamilyMapper.toPersistenceMarriage(marriage, familyId),
      ),
      houses: props.houses.map((house) => FamilyMapper.toPersistenceHouse(house, familyId)),
      relationships: props.relationships.map((relationship) =>
        FamilyMapper.toPersistenceRelationship(relationship, familyId),
      ),
      cohabitations: props.cohabitations.map((cohabitation) =>
        FamilyMapper.toPersistenceCohabitation(cohabitation, familyId),
      ),
      adoptions: props.adoptions.map((adoption) =>
        FamilyMapper.toPersistenceAdoption(adoption, familyId),
      ),
    };
  }

  // ===========================================================================
  // 👤 FAMILY MEMBER MAPPERS
  // ===========================================================================

  static toDomainMember(raw: PrismaMember): FamilyMember {
    const name = new PersonName({
      firstName: raw.firstName,
      middleName: raw.middleName || undefined,
      lastName: raw.lastName,
      maidenName: raw.maidenName || undefined,
    });

    let nationalId;
    if (raw.nationalId) {
      nationalId = new KenyanNationalId(raw.nationalId);
    }

    const memberProps: any = {
      name,
      userId: raw.userId ? new UniqueEntityID(raw.userId) : undefined,

      identification: {
        nationalId,
        nationalIdVerified: raw.nationalIdVerified,
        kraPin: raw.kraPin,
        passportNumber: raw.passportNumber,
        birthCertNumber: raw.birthCertNumber,
        hudumaNumber: raw.hudumaNumber,
      },

      demographics: {
        dateOfBirth: raw.dateOfBirth,
        dateOfBirthEstimated: raw.dateOfBirthEstimated,
        gender: raw.gender as PrismaGender,
        placeOfBirth: raw.placeOfBirth,
        religion: raw.religion,
        tribe: raw.tribe,
        languages: raw.languages,
      },

      lifeStatus: {
        isAlive: raw.isAlive,
        dateOfDeath: raw.dateOfDeath,
        deathCertificateNumber: raw.deathCertNo,
        causeOfDeath: raw.causeOfDeath,
        burialLocation: raw.burialLocation,
        isMissing: raw.isMissing,
        missingSince: raw.missingSince,
      },

      healthStatus: {
        hasDisability: raw.hasDisability,
        disabilityType: raw.disabilityType,
        disabilityPercentage: raw.disabilityPercentage,
        isMentallyIncapacitated: raw.isMentallyIncapacitated,
        medicalConditions: raw.medicalConditions,
        lastMedicalCheck: raw.lastMedicalCheck,
      },

      professionalInfo: {
        educationLevel: raw.educationLevel,
        occupation: raw.occupation,
        employer: raw.employer,
      },

      contactInfo: {
        phoneNumber: raw.phoneNumber,
        email: raw.email,
        currentResidence: raw.currentResidence,
      },

      culturalContext: {
        initiationRitesCompleted: raw.initiationRitesCompleted,
        clanRole: raw.clanRole,
        traditionalTitles: raw.traditionalTitles,
      },

      digitalIdentity: {
        profilePictureUrl: raw.profilePictureUrl,
        biometricData: raw.biometricData as any,
      },

      verification: {
        verificationStatus: VerificationStatusMap[raw.verificationStatus],
        verificationNotes: raw.verificationNotes,
        lastVerifiedAt: raw.lastVerifiedAt,
      },

      // Defaults
      isHeadOfFamily: false,
      isMarried: false,
      hasChildren: false,
      isArchived: raw.isArchived,
      archivedReason: raw.archivedReason,
      createdBy: raw.createdBy ? new UniqueEntityID(raw.createdBy) : undefined,
      lastUpdatedBy: raw.lastUpdatedBy ? new UniqueEntityID(raw.lastUpdatedBy) : undefined,
    };

    return FamilyMember.restore(memberProps, new UniqueEntityID(raw.id), raw.createdAt);
  }

  static toPersistenceMember(
    member: FamilyMember,
    familyId: string,
  ): Prisma.FamilyMemberUncheckedCreateInput {
    const json = member.toJSON();

    return {
      id: member.id.toString(),
      familyId,
      userId: json.userId,

      firstName: json.firstName,
      middleName: json.middleName,
      lastName: json.lastName,
      maidenName: json.maidenName,

      nationalId: json.identification?.nationalId?.value,
      nationalIdVerified: json.identification?.nationalIdVerified || false,
      kraPin: json.identification?.kraPin,
      passportNumber: json.identification?.passportNumber,
      birthCertNumber: json.identification?.birthCertNumber,
      hudumaNumber: json.identification?.hudumaNumber,

      dateOfBirth: json.demographics?.dateOfBirth,
      dateOfBirthEstimated: json.demographics?.dateOfBirthEstimated || false,
      gender: json.demographics?.gender as PrismaGender,
      placeOfBirth: json.demographics?.placeOfBirth,
      religion: json.demographics?.religion,
      tribe: json.demographics?.tribe,
      languages: json.demographics?.languages || [],

      isAlive: json.lifeStatus?.isAlive ?? true,
      dateOfDeath: json.lifeStatus?.dateOfDeath,
      deathCertNo: json.lifeStatus?.deathCertificateNumber,
      causeOfDeath: json.lifeStatus?.causeOfDeath,
      burialLocation: json.lifeStatus?.burialLocation,
      isMissing: json.lifeStatus?.isMissing ?? false,
      missingSince: json.lifeStatus?.missingSince,

      hasDisability: json.healthStatus?.hasDisability || false,
      disabilityType: json.healthStatus?.disabilityType,
      disabilityPercentage: json.healthStatus?.disabilityPercentage,
      isMentallyIncapacitated: json.healthStatus?.isMentallyIncapacitated || false,
      medicalConditions: json.healthStatus?.medicalConditions || [],
      lastMedicalCheck: json.healthStatus?.lastMedicalCheck,

      educationLevel: json.professionalInfo?.educationLevel,
      occupation: json.professionalInfo?.occupation,
      employer: json.professionalInfo?.employer,

      phoneNumber: json.contactInfo?.phoneNumber,
      email: json.contactInfo?.email,
      currentResidence: json.contactInfo?.currentResidence,

      initiationRitesCompleted: json.culturalContext?.initiationRitesCompleted || false,
      clanRole: json.culturalContext?.clanRole,
      traditionalTitles: json.culturalContext?.traditionalTitles || [],

      profilePictureUrl: json.digitalIdentity?.profilePictureUrl,
      biometricData: json.digitalIdentity?.biometricData,

      verificationStatus:
        ReverseVerificationStatusMap[
          json.verification?.verificationStatus || DomainVerificationStatus.UNVERIFIED
        ],
      verificationNotes: json.verification?.verificationNotes,
      lastVerifiedAt: json.verification?.lastVerifiedAt,

      polygamousHouseId: null,

      createdBy: json.createdBy,
      lastUpdatedBy: json.lastUpdatedBy,
      isArchived: json.isArchived || false,
      archivedReason: json.archivedReason,

      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
    };
  }

  // ===========================================================================
  // 💍 MARRIAGE MAPPERS
  // ===========================================================================

  static toDomainMarriage(raw: PrismaMarriage): Marriage {
    const marriageStatusMap: Record<PrismaMarriageEndReason, MarriageStatus> = {
      [PrismaMarriageEndReason.DEATH_OF_SPOUSE]: MarriageStatus.WIDOWED,
      [PrismaMarriageEndReason.DIVORCE]: MarriageStatus.DIVORCED,
      [PrismaMarriageEndReason.ANNULMENT]: MarriageStatus.DIVORCED,
      [PrismaMarriageEndReason.CUSTOMARY_DISSOLUTION]: MarriageStatus.DIVORCED,
      [PrismaMarriageEndReason.STILL_ACTIVE]: MarriageStatus.MARRIED,
    };

    // We explicitly type this to ensure we satisfy the Interface
    const marriageProps: any = {
      // Using any momentarily to construct, but validation happens in .restore
      spouse1Id: new UniqueEntityID(raw.spouse1Id),
      spouse2Id: new UniqueEntityID(raw.spouse2Id),
      marriageType: raw.marriageType,
      marriageStatus: marriageStatusMap[raw.endReason] || MarriageStatus.MARRIED,
      startDate: raw.startDate,
      endDate: raw.endDate,

      // Registration
      certificateNumber: raw.registrationNumber, // Mapped from registrationNumber
      registrationDistrict: raw.registrationDistrict,
      registeredBy: raw.registeredBy,

      // Ceremony
      ceremonyLocation: raw.ceremonyLocation,
      ceremonyCounty: raw.ceremonyCounty as KenyanCounty,
      witnesses: raw.witnesses,

      // Customary
      bridePricePaid: raw.bridePricePaid,
      bridePriceAmount: raw.bridePriceAmount,
      bridePaidInFull: raw.bridePaidInFull,
      customaryDetails: raw.customaryDetails as any, // Cast JSON

      // Polygamy
      isPolygamous: raw.isPolygamous,
      polygamousHouseId: raw.polygamousHouseId
        ? new UniqueEntityID(raw.polygamousHouseId)
        : undefined,
      marriageOrder: raw.marriageOrder,

      // Children
      numberOfChildren: raw.numberOfChildren,
      // ⚠️ FIX: Prisma Marriage doesn't have the list of children IDs joined here.
      // We initialize as empty array. If logic requires them, they must be loaded separately.
      childrenIds: [],

      // Documents
      marriageCertificateId: raw.marriageCertificateId,
      cohabitationAffidavitId: raw.cohabitationAffidavitId,
      divorceDecreeId: raw.divorceDecreeId,

      // Financial
      prenuptialAgreement: raw.prenuptialAgreement,
      jointProperty: raw.jointProperty,

      // Dissolution
      isMarriageDissolved: raw.isMarriageDissolved,
      dissolutionDate: raw.dissolutionDate,
      dissolutionReason: raw.dissolutionReason,
      waitingPeriodCompleted: raw.waitingPeriodCompleted,

      // Metadata
      verificationStatus: VerificationStatusMap[raw.verificationStatus],
      verifiedBy: raw.verifiedBy ? new UniqueEntityID(raw.verifiedBy) : undefined,
      verificationNotes: raw.verificationNotes,
      createdBy: new UniqueEntityID(raw.createdBy),
      lastUpdatedBy: new UniqueEntityID(raw.lastUpdatedBy),
      isArchived: raw.isArchived,
    };

    return Marriage.restore(marriageProps, new UniqueEntityID(raw.id), raw.createdAt);
  }

  static toPersistenceMarriage(
    marriage: Marriage,
    familyId: string,
  ): Prisma.MarriageUncheckedCreateInput {
    // ⚠️ FIX: Ensure you added getProps() to your Marriage entity class (Step 1)
    const props = marriage.getProps();

    const endReasonMap: Record<MarriageStatus, PrismaMarriageEndReason> = {
      [MarriageStatus.WIDOWED]: PrismaMarriageEndReason.DEATH_OF_SPOUSE,
      [MarriageStatus.DIVORCED]: PrismaMarriageEndReason.DIVORCE,
      [MarriageStatus.SEPARATED]: PrismaMarriageEndReason.DIVORCE,
      [MarriageStatus.MARRIED]: PrismaMarriageEndReason.STILL_ACTIVE,
      [MarriageStatus.SINGLE]: PrismaMarriageEndReason.DIVORCE,
    };

    return {
      id: marriage.id.toString(),
      familyId,
      spouse1Id: props.spouse1Id.toString(),
      spouse2Id: props.spouse2Id.toString(),

      marriageType: props.marriageType as PrismaMarriageType,
      marriageStatus: props.marriageStatus,
      startDate: props.startDate,
      endDate: props.endDate,
      // Map Domain Status back to Prisma EndReason
      endReason:
        props.endReason ||
        endReasonMap[props.marriageStatus] ||
        PrismaMarriageEndReason.STILL_ACTIVE,

      // Note: Map 'certificateNumber' (Domain) to 'registrationNumber' (DB)
      registrationNumber: props.registrationNumber,
      registrationDistrict: props.registrationDistrict,
      registeredBy: props.registeredBy,

      ceremonyLocation: props.ceremonyLocation,
      ceremonyCounty: props.ceremonyCounty as KenyanCounty,
      witnesses: props.witnesses || [],

      bridePricePaid: props.bridePricePaid || false,
      bridePriceAmount: props.bridePriceAmount,
      bridePaidInFull: props.bridePaidInFull || false,
      customaryDetails: props.customaryDetails || Prisma.DbNull,

      isPolygamous: props.isPolygamous || false,
      polygamousHouseId: props.polygamousHouseId ? props.polygamousHouseId.toString() : null,
      marriageOrder: props.marriageOrder,
      numberOfChildren: props.numberOfChildren || 0,

      marriageCertificateId: props.marriageCertificateId, // Fixed field name
      cohabitationAffidavitId: props.cohabitationAffidavitId, // Fixed field name
      divorceDecreeId: props.divorceDecreeId, // Fixed field name

      prenuptialAgreement: props.prenuptialAgreement || false,
      jointProperty: props.jointProperty || false,

      isMarriageDissolved: props.isMarriageDissolved || false,
      dissolutionDate: props.dissolutionDate,
      dissolutionReason: props.dissolutionReason,
      waitingPeriodCompleted: props.waitingPeriodCompleted || false,

      verificationStatus:
        ReverseVerificationStatusMap[
          props.verificationStatus || DomainVerificationStatus.UNVERIFIED
        ],
      verifiedBy: props.verifiedBy?.toString(),
      verificationNotes: props.verificationNotes,

      createdBy: props.createdBy?.toString(),
      lastUpdatedBy: props.lastUpdatedBy?.toString(),
      isArchived: props.isArchived || false,

      createdAt: marriage.createdAt,
      updatedAt: marriage.updatedAt,
    };
  }

  // ===========================================================================
  // 🏠 POLYGAMOUS HOUSE MAPPERS
  // ===========================================================================

  static toDomainHouse(raw: PrismaHouse): PolygamousHouse {
    // ⚠️ FIX: Ensure strict validation against PolygamousHouseProps interface
    // We use 'any' briefly to construct the object, but restore() will validate it.
    const houseProps: any = {
      familyId: new UniqueEntityID(raw.familyId),
      houseName: raw.houseName,
      houseCode: raw.houseCode,
      houseOrder: raw.houseOrder,

      // Leadership
      matriarchId: raw.houseHeadId ? new UniqueEntityID(raw.houseHeadId) : undefined, // Alias for houseHeadId
      houseHeadId: raw.houseHeadId ? new UniqueEntityID(raw.houseHeadId) : undefined, // Direct mapping
      originalWifeId: new UniqueEntityID(raw.originalWifeId),
      currentWifeId: raw.currentWifeId ? new UniqueEntityID(raw.currentWifeId) : undefined,

      // Establishment
      establishedDate: raw.establishedDate,
      establishmentType: HouseEstablishmentTypeMap[raw.establishmentType],
      // ⚠️ Missing in DB: Initialize as empty array or default
      establishmentWitnesses: [],

      // Legal
      courtRecognized: raw.courtRecognized,
      recognitionDocumentId: raw.recognitionDocumentId,

      // Members
      memberCount: raw.memberCount,
      // ⚠️ Missing in DB: Initialize as empty arrays.
      // Logic: These should be hydrated by a separate query or join if needed for business logic.
      wifeIds: [],
      childrenIds: [],

      // Assets
      houseAssets: (raw.houseAssets as any) || [], // Ensure array if null

      // Distribution
      distributionWeight: raw.distributionWeight,
      specialAllocation: raw.specialAllocation as any,

      // Status
      isActive: raw.isActive,
      dissolutionDate: raw.dissolutionDate,
      dissolutionReason: raw.dissolutionReason
        ? HouseDissolutionReasonMap[raw.dissolutionReason]
        : undefined,

      // Cultural
      houseColor: raw.houseColor,
      houseSymbol: raw.houseSymbol,
      primaryResidence: raw.primaryResidence,
      // ⚠️ Missing in DB: Default to false unless you add a column
      hasSeparateHomestead: false,

      // Financial
      // ⚠️ Missing in DB: Default to 0
      financialDependents: 0,

      // Verification
      verificationStatus: VerificationStatusMap[raw.verificationStatus],
      verificationNotes: raw.verificationNotes,

      // Audit
      createdBy: new UniqueEntityID(raw.createdBy),
      lastUpdatedBy: new UniqueEntityID(raw.lastUpdatedBy),
      isArchived: raw.isArchived,
    };

    return PolygamousHouse.restore(houseProps, new UniqueEntityID(raw.id), raw.createdAt);
  }

  static toPersistenceHouse(
    house: PolygamousHouse,
    familyId: string,
  ): Prisma.PolygamousHouseUncheckedCreateInput {
    // ⚠️ FIX: Ensure getProps() exists on Entity (Check Entity Step below)
    const props = house.getProps();

    return {
      id: house.id.toString(),
      familyId,
      houseName: props.houseName,
      houseCode: props.houseCode,
      houseOrder: props.houseOrder,

      // Map houseHeadId (Domain) -> houseHeadId (DB)
      houseHeadId: props.houseHeadId?.toString(),

      originalWifeId: props.originalWifeId.toString(),
      currentWifeId: props.currentWifeId?.toString(),

      establishedDate: props.establishedDate,
      establishmentType: ReverseHouseEstablishmentTypeMap[props.establishmentType],

      courtRecognized: props.courtRecognized || false,
      recognitionDocumentId: props.recognitionDocumentId,

      memberCount: props.memberCount || 0,

      // Serialize Assets
      houseAssets: (props.houseAssets as any) || Prisma.DbNull,

      distributionWeight: props.distributionWeight || 1.0,
      specialAllocation: (props.specialAllocation as any) || Prisma.DbNull,

      isActive: props.isActive !== false,
      dissolutionDate: props.dissolutionDate,
      dissolutionReason: props.dissolutionReason
        ? ReverseHouseDissolutionReasonMap[props.dissolutionReason]
        : null,

      houseColor: props.houseColor,
      houseSymbol: props.houseSymbol,
      primaryResidence: props.primaryResidence,

      verificationStatus:
        ReverseVerificationStatusMap[
          props.verificationStatus || DomainVerificationStatus.UNVERIFIED
        ],
      verificationNotes: props.verificationNotes,

      createdBy: props.createdBy.toString(),
      lastUpdatedBy: props.lastUpdatedBy.toString(),
      isArchived: props.isArchived || false,

      createdAt: house.createdAt,
      updatedAt: house.updatedAt,
    };
  }

  // ===========================================================================
  // 🔗 RELATIONSHIP MAPPERS
  // ===========================================================================

  static toDomainRelationship(raw: PrismaRelationship): FamilyRelationship {
    // ⚠️ FIX: Ensure strict validation. Using 'any' briefly for construction.
    const relationshipProps: any = {
      familyId: new UniqueEntityID(raw.familyId),
      fromMemberId: new UniqueEntityID(raw.fromMemberId),
      toMemberId: new UniqueEntityID(raw.toMemberId),
      relationshipType: ReverseRelationshipTypeMap[raw.type],
      inverseRelationshipType: ReverseRelationshipTypeMap[raw.inverseType],

      // Dimensions
      isBiological: raw.isBiological,
      isLegal: raw.isLegal,
      isCustomary: raw.isCustomary,
      isSpiritual: raw.isSpiritual,

      // ⚠️ FIX: Convert null -> undefined for dates
      startDate: raw.startDate || undefined,
      endDate: raw.endDate || undefined,

      isActive: raw.isActive,

      // Verification
      verificationLevel: VerificationLevelMap[raw.verificationLevel],
      verificationMethod: raw.verificationMethod
        ? VerificationMethodMap[raw.verificationMethod]
        : undefined,
      verificationScore: raw.verificationScore,
      verifiedBy: raw.verifiedBy ? new UniqueEntityID(raw.verifiedBy) : undefined,
      lastVerifiedAt: raw.lastVerifiedAt || undefined, // Fix null -> undefined

      // Evidence
      legalDocuments: raw.legalDocuments,
      dnaTestId: raw.dnaTestId || undefined,
      dnaMatchPercentage: raw.dnaMatchPercentage || undefined,
      courtOrderId: raw.courtOrderId || undefined,
      adoptionOrderId: raw.adoptionOrderId || undefined,
      guardianshipOrderId: raw.guardianshipOrderId || undefined,

      // Customary
      customaryRecognition: raw.customaryRecognition,
      clanRecognized: raw.clanRecognized,
      elderWitnesses: raw.elderWitnesses,
      traditionalRite: raw.traditionalRite || undefined,

      // Strength
      relationshipStrength: raw.relationshipStrength,
      closenessIndex: raw.closenessIndex,
      // ⚠️ FIX: Missing enum map or cast. Assuming string compatibility or default
      contactFrequency: raw.contactFrequency || 'WEEKLY',

      // Dependency
      isFinancialDependent: raw.isFinancialDependent,
      isCareDependent: raw.isCareDependent,
      dependencyLevel: raw.dependencyLevel || undefined,
      supportProvided: raw.supportProvided as any,

      // Inheritance
      inheritanceRights: raw.inheritanceRights || 'PENDING', // Default if null
      inheritancePercentage: raw.inheritancePercentage || undefined,
      disinherited: raw.disinherited,
      disinheritanceReason: raw.disinheritanceReason || undefined,

      // Conflict
      hasConflict: raw.hasConflict,
      conflictResolutionStatus: raw.conflictResolutionStatus
        ? ConflictResolutionStatusMap[raw.conflictResolutionStatus]
        : undefined,

      // Metadata
      notes: raw.notes || undefined,
      createdBy: raw.createdBy ? new UniqueEntityID(raw.createdBy) : undefined,
      lastUpdatedBy: raw.lastUpdatedBy ? new UniqueEntityID(raw.lastUpdatedBy) : undefined,
      isArchived: raw.isArchived,
    };

    return FamilyRelationship.restore(relationshipProps, new UniqueEntityID(raw.id), raw.createdAt);
  }

  static toPersistenceRelationship(
    rel: FamilyRelationship,
    familyId: string,
  ): Prisma.FamilyRelationshipUncheckedCreateInput {
    // ⚠️ FIX: Ensure getProps() exists in FamilyRelationship Entity (See below)
    const props = rel.getProps();

    return {
      id: rel.id.toString(),
      familyId,
      fromMemberId: props.fromMemberId.toString(),
      toMemberId: props.toMemberId.toString(),
      type: RelationshipTypeMap[props.relationshipType],
      inverseType: RelationshipTypeMap[props.inverseRelationshipType],

      isBiological: props.isBiological,
      isLegal: props.isLegal,
      isCustomary: props.isCustomary,
      isSpiritual: props.isSpiritual,

      startDate: props.startDate || null, // Convert undefined -> null for Prisma
      endDate: props.endDate || null,
      isActive: props.isActive !== false,

      verificationLevel:
        ReverseVerificationLevelMap[props.verificationLevel || DomainVerificationLevel.UNVERIFIED],
      verificationMethod: props.verificationMethod
        ? ReverseVerificationMethodMap[props.verificationMethod]
        : null,
      verificationScore: props.verificationScore || 0,

      verifiedBy: props.verifiedBy?.toString(),
      lastVerifiedAt: props.lastVerifiedAt || null,

      legalDocuments: props.legalDocuments || [],
      dnaTestId: props.dnaTestId,
      dnaMatchPercentage: props.dnaMatchPercentage,
      courtOrderId: props.courtOrderId,
      adoptionOrderId: props.adoptionOrderId,
      guardianshipOrderId: props.guardianshipOrderId,

      customaryRecognition: props.customaryRecognition || false,
      clanRecognized: props.clanRecognized || false,
      elderWitnesses: props.elderWitnesses || [],
      traditionalRite: props.traditionalRite,

      relationshipStrength: props.relationshipStrength || 50,
      closenessIndex: props.closenessIndex || 50,
      contactFrequency: props.contactFrequency || 'WEEKLY', // Ensure default string

      isFinancialDependent: props.isFinancialDependent || false,
      isCareDependent: props.isCareDependent || false,
      dependencyLevel: props.dependencyLevel,
      supportProvided: (props.supportProvided as any) || Prisma.DbNull,

      inheritanceRights: props.inheritanceRights,
      inheritancePercentage: props.inheritancePercentage,
      disinherited: props.disinherited || false,
      disinheritanceReason: props.disinheritanceReason,

      hasConflict: props.hasConflict || false,
      conflictResolutionStatus: props.conflictResolutionStatus
        ? ReverseConflictResolutionStatusMap[props.conflictResolutionStatus]
        : null,

      notes: props.notes,

      createdBy: props.createdBy?.toString(),
      lastUpdatedBy: props.lastUpdatedBy?.toString(),
      isArchived: props.isArchived || false,

      createdAt: rel.createdAt,
      updatedAt: rel.updatedAt,
    };
  }

  // ===========================================================================
  // 🤝 COHABITATION MAPPERS
  // ===========================================================================

  static toDomainCohabitation(raw: PrismaCohabitationRecord): CohabitationRecord {
    // ⚠️ FIX: Ensure strict validation. Using 'any' briefly for construction.
    const cohabitationProps: any = {
      familyId: new UniqueEntityID(raw.familyId),
      partner1Id: new UniqueEntityID(raw.partner1Id),
      partner2Id: new UniqueEntityID(raw.partner2Id),
      relationshipType: CohabitationTypeMap[raw.relationshipType],
      isActive: raw.isActive,
      startDate: raw.startDate,
      endDate: raw.endDate || undefined, // Convert null -> undefined
      relationshipStability: CohabitationStabilityMap[raw.relationshipStability],
      durationDays: raw.durationDays,
      qualifiesForS29: raw.qualifiesForS29,
      minimumPeriodMet: raw.minimumPeriodMet,
      sharedResidence: raw.sharedResidence || '', // Default to empty string if null
      residenceCounty: raw.residenceCounty as KenyanCounty,
      isSeparateHousehold: raw.isSeparateHousehold,
      affidavitId: raw.affidavitId || undefined,
      witnesses: raw.witnesses,
      communityAcknowledged: raw.communityAcknowledged,
      familyAcknowledged: raw.familyAcknowledged,
      supportEvidence: (raw.supportEvidence as any) || [], // Ensure array
      jointFinancialAccounts: raw.jointFinancialAccounts,
      jointPropertyOwnership: raw.jointPropertyOwnership,
      financialSupportProvided: raw.financialSupportProvided,
      hasChildren: raw.hasChildren,
      childrenBornDuring: raw.childrenBornDuring,
      hasCourtRecognition: raw.hasCourtRecognition,
      courtCaseNumber: raw.courtCaseNumber || undefined,
      dependencyClaimFiled: raw.dependencyClaimFiled,
      dependencyClaimId: raw.dependencyClaimId || undefined,
      dependencyClaimStatus: raw.dependencyClaimStatus || undefined,
      customaryElements: raw.customaryElements,
      clanInvolved: raw.clanInvolved,

      // ⚠️ MISSING FIELDS (Defaults for Domain Compliance)
      hasJointUtilities: false, // Not in DB
      childrenIds: [], // Not in DB (requires join)
      childrenBornDuringCohabitation: raw.childrenBornDuring, // Map correctly
      knownAsCouple: false, // Not in DB
      socialMediaEvidence: [], // Not in DB
      separationAttempts: 0, // Not in DB
      reconciliationCount: 0, // Not in DB
      elderMediation: false, // Not in DB
      hasDomesticViolenceReports: false, // Not in DB
      safetyPlanInPlace: false, // Not in DB
      marriagePlanned: false, // Not in DB
      childrenPlanned: false, // Not in DB

      verificationStatus: VerificationStatusMap[raw.verificationStatus],
      verificationNotes: raw.verificationNotes || undefined,
      lastVerifiedAt: raw.lastVerifiedAt || undefined,
      createdBy: raw.createdBy ? new UniqueEntityID(raw.createdBy) : undefined,
      lastUpdatedBy: raw.lastUpdatedBy ? new UniqueEntityID(raw.lastUpdatedBy) : undefined,
      isArchived: raw.isArchived,
    };

    return CohabitationRecord.restore(cohabitationProps, new UniqueEntityID(raw.id), raw.createdAt);
  }

  static toPersistenceCohabitation(
    record: CohabitationRecord,
    familyId: string,
  ): Prisma.CohabitationRecordUncheckedCreateInput {
    // ⚠️ FIX: Ensure getProps() exists in CohabitationRecord Entity
    const props = record.getProps();

    return {
      id: record.id.toString(),
      familyId,
      partner1Id: props.partner1Id.toString(),
      partner2Id: props.partner2Id.toString(),
      relationshipType: ReverseCohabitationTypeMap[props.relationshipType],
      isActive: props.isActive !== false,
      startDate: props.startDate,
      endDate: props.endDate || null,
      relationshipStability: ReverseCohabitationStabilityMap[props.relationshipStability],
      durationDays: props.durationDays || 0,
      qualifiesForS29: props.qualifiesForS29 || false,
      minimumPeriodMet: props.minimumPeriodMet || false,
      sharedResidence: props.sharedResidence,
      residenceCounty: props.residenceCounty,
      isSeparateHousehold: props.isSeparateHousehold || false,
      affidavitId: props.affidavitId || null,
      witnesses: props.witnesses || [],
      communityAcknowledged: props.communityAcknowledged || false,
      familyAcknowledged: props.familyAcknowledged || false,
      supportEvidence: (props.supportEvidence as any) || Prisma.DbNull,
      jointFinancialAccounts: props.jointFinancialAccounts || false,
      jointPropertyOwnership: props.jointPropertyOwnership || false,
      financialSupportProvided: props.financialSupportProvided || false,
      hasChildren: props.hasChildren || false,
      childrenBornDuring: props.childrenBornDuringCohabitation || false, // Correct mapping
      hasCourtRecognition: props.hasCourtRecognition || false,
      courtCaseNumber: props.courtCaseNumber || null,
      dependencyClaimFiled: props.dependencyClaimFiled || false,
      dependencyClaimId: props.dependencyClaimId || null,
      dependencyClaimStatus: props.dependencyClaimStatus || null,
      customaryElements: props.customaryElements || false,
      clanInvolved: props.clanInvolved || false,

      verificationStatus:
        ReverseVerificationStatusMap[
          props.verificationStatus || DomainVerificationStatus.UNVERIFIED
        ],
      verificationNotes: props.verificationNotes,
      lastVerifiedAt: props.lastVerifiedAt || null,

      createdBy: props.createdBy?.toString(),
      lastUpdatedBy: props.lastUpdatedBy?.toString(),
      isArchived: props.isArchived || false,

      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  // ===========================================================================
  // 👶 ADOPTION MAPPERS
  // ===========================================================================

  // ===========================================================================
  // 👶 ADOPTION MAPPERS
  // ===========================================================================

  static toDomainAdoption(raw: PrismaAdoptionRecord): AdoptionRecord {
    // ⚠️ FIX: Ensure strict validation. Using 'any' briefly for construction.
    const adoptionProps: any = {
      familyId: new UniqueEntityID(raw.familyId),
      adopteeId: new UniqueEntityID(raw.adopteeId),
      adoptiveParentId: new UniqueEntityID(raw.adoptiveParentId),
      adoptionType: AdoptionTypeMap[raw.adoptionType],
      adoptionStatus: AdoptionStatusMap[raw.adoptionStatus],
      applicationDate: raw.applicationDate,
      hearingDate: raw.hearingDate || undefined, // Convert null -> undefined
      finalizationDate: raw.finalizationDate || undefined,
      effectiveDate: raw.effectiveDate || undefined,

      legalBasis: (raw.legalBasis as any) || [], // Ensure array
      courtOrderNumber: raw.courtOrderNumber || undefined,
      courtStation: raw.courtStation || '', // Default to empty string if missing
      presidingJudge: raw.presidingJudge || undefined,

      // Consent
      // ⚠️ FIX: Ensure shape matches interface { mother: '...', father: '...' }
      parentalConsentStatus: (raw.parentalConsentStatus as any) || {
        mother: 'UNKNOWN',
        father: 'UNKNOWN',
      },
      consentDocuments: raw.consentDocuments,

      // Customary
      clanInvolved: raw.clanInvolved,
      clanElders: (raw.clanElders as any) || [],
      customaryRitesPerformed: raw.customaryRites || [], // Map correct field name
      bridePriceConsideration: raw.bridePriceConsideration,

      // Social & Agency
      socialWorkerInfo: (raw.socialWorkerInfo as any) || undefined,
      adoptionAgencyInfo: (raw.adoptionAgencyInfo as any) || undefined,
      adoptionExpenses: raw.adoptionExpenses || 0,

      // Monitoring
      postAdoptionMonitoring: raw.postAdoptionMonitoring,
      monitoringPeriodMonths: raw.monitoringPeriodMonths || 0,

      // ⚠️ MISSING FIELDS (Defaults for Domain Compliance)
      // International
      hagueConventionCompliant: false, // Not in DB
      receivingCountry: undefined,
      sendingCountry: undefined,
      immigrationDocumentId: undefined,

      // Financial
      governmentFeesPaid: false, // Not in DB
      legalFeesPaid: false, // Not in DB
      subsidyReceived: false, // Not in DB
      subsidyAmount: undefined,

      // Child Info
      childAgeAtAdoption: 0, // Not in DB (requires calculation)
      childSpecialNeeds: false, // Not in DB
      specialNeedsDescription: undefined,
      medicalHistoryProvided: false, // Not in DB

      // Siblings
      siblingGroupAdoption: false, // Not in DB
      siblingAdoptionRecordIds: [], // Not in DB

      // Previous Care
      previousCareArrangement: 'ORPHANAGE', // Default
      timeInPreviousCareMonths: 0, // Default

      // Post-Adoption
      openAdoption: false, // Not in DB
      contactAgreement: undefined,
      visitationSchedule: undefined,

      // Inheritance
      inheritanceRightsEstablished: false, // Not in DB
      inheritanceDocumentId: undefined,

      // Documents
      newBirthCertificateIssued: false, // Not in DB
      newBirthCertificateNumber: undefined,
      passportIssued: false, // Not in DB
      passportNumber: undefined,

      // Appeals
      appealFiled: false, // Not in DB
      appealCaseNumber: undefined,
      challengePeriodExpired: false, // Not in DB (requires calculation)

      // Verification
      verificationStatus: VerificationStatusMap[raw.verificationStatus],
      verificationNotes: raw.verificationNotes || undefined,
      verifiedBy: raw.verifiedBy ? new UniqueEntityID(raw.verifiedBy) : undefined,
      lastVerifiedAt: raw.lastVerifiedAt || undefined,

      // Audit
      createdBy: raw.createdBy ? new UniqueEntityID(raw.createdBy) : undefined,
      lastUpdatedBy: raw.lastUpdatedBy ? new UniqueEntityID(raw.lastUpdatedBy) : undefined,
      isArchived: raw.isArchived,
    };

    return AdoptionRecord.restore(adoptionProps, new UniqueEntityID(raw.id), raw.createdAt);
  }

  static toPersistenceAdoption(
    record: AdoptionRecord,
    familyId: string,
  ): Prisma.AdoptionRecordUncheckedCreateInput {
    // ⚠️ FIX: Ensure getProps() exists in AdoptionRecord Entity
    const props = record.getProps();

    return {
      id: record.id.toString(),
      familyId,
      adopteeId: props.adopteeId.toString(),
      adoptiveParentId: props.adoptiveParentId.toString(),
      adoptionType: ReverseAdoptionTypeMap[props.adoptionType],
      adoptionStatus: ReverseAdoptionStatusMap[props.adoptionStatus],
      applicationDate: props.applicationDate,
      hearingDate: props.hearingDate || null,
      finalizationDate: props.finalizationDate || null,
      effectiveDate: props.effectiveDate || null,

      legalBasis: (props.legalBasis as any) || Prisma.DbNull,
      courtOrderNumber: props.courtOrderNumber || null,
      courtStation: props.courtStation || null,
      presidingJudge: props.presidingJudge || null,

      parentalConsentStatus: (props.parentalConsentStatus as any) || Prisma.DbNull,
      consentDocuments: props.consentDocuments || [],

      clanInvolved: props.clanInvolved || false,
      clanElders: (props.clanElders as any) || Prisma.DbNull,
      customaryRites: props.customaryRitesPerformed || [], // Map correct field name
      bridePriceConsideration: props.bridePriceConsideration || false,

      socialWorkerInfo: props.socialWorkerId ? { id: props.socialWorkerId } : Prisma.DbNull, // Basic structure
      adoptionAgencyInfo: props.adoptionAgencyId ? { id: props.adoptionAgencyId } : Prisma.DbNull,

      adoptionExpenses: props.adoptionExpenses || 0,
      postAdoptionMonitoring: props.postAdoptionMonitoring || false,
      monitoringPeriodMonths: props.monitoringPeriodMonths || 0,

      verificationStatus:
        ReverseVerificationStatusMap[
          props.verificationStatus || DomainVerificationStatus.PENDING_VERIFICATION
        ],
      verificationNotes: props.verificationNotes,
      verifiedBy: props.verifiedBy?.toString(),
      lastVerifiedAt: props.lastVerifiedAt || null,

      createdBy: props.createdBy?.toString(),
      lastUpdatedBy: props.lastUpdatedBy?.toString(),
      isArchived: props.isArchived || false,

      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  // ===========================================================================
  // 🔧 HELPER METHODS
  // ===========================================================================

  private static getInverseRelationshipType(type: DomainRelationshipType): DomainRelationshipType {
    const inverseMap: Record<DomainRelationshipType, DomainRelationshipType> = {
      [DomainRelationshipType.SPOUSE]: DomainRelationshipType.SPOUSE,
      [DomainRelationshipType.EX_SPOUSE]: DomainRelationshipType.EX_SPOUSE,
      [DomainRelationshipType.CHILD]: DomainRelationshipType.PARENT,
      [DomainRelationshipType.ADOPTED_CHILD]: DomainRelationshipType.PARENT,
      [DomainRelationshipType.STEPCHILD]: DomainRelationshipType.PARENT,
      [DomainRelationshipType.PARENT]: DomainRelationshipType.CHILD,
      [DomainRelationshipType.SIBLING]: DomainRelationshipType.SIBLING,
      [DomainRelationshipType.HALF_SIBLING]: DomainRelationshipType.HALF_SIBLING,
      [DomainRelationshipType.GRANDCHILD]: DomainRelationshipType.GRANDPARENT,
      [DomainRelationshipType.GRANDPARENT]: DomainRelationshipType.GRANDCHILD,
      [DomainRelationshipType.NIECE_NEPHEW]: DomainRelationshipType.AUNT_UNCLE,
      [DomainRelationshipType.AUNT_UNCLE]: DomainRelationshipType.NIECE_NEPHEW,
      [DomainRelationshipType.COUSIN]: DomainRelationshipType.COUSIN,
      [DomainRelationshipType.GUARDIAN]: DomainRelationshipType.CHILD,
      [DomainRelationshipType.OTHER]: DomainRelationshipType.OTHER,
    };

    return inverseMap[type] || DomainRelationshipType.OTHER;
  }
}
