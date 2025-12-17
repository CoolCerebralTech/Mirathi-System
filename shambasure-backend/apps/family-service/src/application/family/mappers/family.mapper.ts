import { Injectable } from '@nestjs/common';
import { KenyanCounty as PrismaKenyanCounty } from '@prisma/client';

import { CreateFamilyProps, Family } from '../../../domain/aggregates/family.aggregate';
import { CreateFamilyRequest } from '../dto/request/create-family.request';
import { UpdateFamilyRequest } from '../dto/request/update-family.request';
import { FamilyResponse } from '../dto/response/family.response';
import { BaseMapper } from './base.mapper';

@Injectable()
export class FamilyMapper extends BaseMapper<Family, FamilyResponse> {
  // Helper to convert Request DTO -> Aggregate Creation Props
  toCreateFamilyProps(request: CreateFamilyRequest): CreateFamilyProps {
    return {
      name: request.name,
      creatorId: request.creatorId,
      description: request.description,
      clanName: request.clanName,
      subClan: request.subClan,
      ancestralHome: request.ancestralHome,
      familyTotem: request.familyTotem,
      homeCounty: request.homeCounty as PrismaKenyanCounty,
      subCounty: request.subCounty,
      ward: request.ward,
      village: request.village,
      placeName: request.placeName,
    };
  }

  // Helper to convert Request DTO -> Update Props
  toUpdateFamilyProps(request: UpdateFamilyRequest) {
    return {
      name: request.name,
      description: request.description,
      clanName: request.clanName,
      subClan: request.subClan,
      ancestralHome: request.ancestralHome,
      familyTotem: request.familyTotem,
      homeCounty: request.homeCounty as PrismaKenyanCounty,
    };
  }

  // Used when loading from Database/Persistence
  toDomain(raw: any): Family {
    const props = {
      id: raw.id,
      name: raw.name,
      description: raw.description,
      creatorId: raw.creatorId,
      clanName: raw.clanName,
      subClan: raw.subClan,
      ancestralHome: raw.ancestralHome,
      familyTotem: raw.familyTotem,
      homeCounty: raw.homeCounty as PrismaKenyanCounty,

      // Counts
      memberCount: raw.memberCount ?? 0,
      livingMemberCount: raw.livingMemberCount ?? 0,
      deceasedMemberCount: raw.deceasedMemberCount ?? 0,
      minorCount: raw.minorCount ?? 0,
      dependantCount: raw.dependantCount ?? 0,

      // Polygamy
      isPolygamous: raw.isPolygamous ?? false,
      polygamousHouseCount: raw.polygamousHouseCount ?? 0,

      // System
      version: raw.version ?? 1,
      lastEventId: raw.lastEventId,
      createdAt: raw.createdAt ? new Date(raw.createdAt) : new Date(),
      updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : new Date(),
      deletedAt: raw.deletedAt ? new Date(raw.deletedAt) : undefined,
      deletedBy: raw.deletedBy,
      deletionReason: raw.deletionReason,
      isArchived: raw.isArchived ?? false,

      // Relations (Ids)
      memberIds: raw.memberIds || [],
      marriageIds: raw.marriageIds || [],
      polygamousHouseIds: raw.polygamousHouseIds || [],
    };

    return Family.createFromProps(props);
  }

  // Domain -> Response DTO
  toDTO(family: Family): FamilyResponse {
    const json = family.toJSON();

    // We instantiate the class to ensure Swagger decorators apply if used in serialization
    const response = new FamilyResponse();

    response.id = json.id;
    response.name = json.name;
    response.description = json.description;
    response.creatorId = json.creatorId;
    response.clanName = json.clanName;
    response.subClan = json.subClan;
    response.ancestralHome = json.ancestralHome;
    response.familyTotem = json.familyTotem;
    response.homeCounty = json.homeCounty;

    response.memberCount = json.memberCount;
    response.livingMemberCount = json.livingMemberCount;
    response.deceasedMemberCount = json.deceasedMemberCount;
    response.minorCount = json.minorCount;
    response.dependantCount = json.dependantCount;

    response.isPolygamous = json.isPolygamous;
    response.polygamousHouseCount = json.polygamousHouseCount;

    // Computed props
    response.hasLivingMembers = json.hasLivingMembers;
    response.hasDeceasedMembers = json.hasDeceasedMembers;
    response.hasMinors = json.hasMinors;
    response.hasDependants = json.hasDependants;
    response.isActive = json.isActive;
    response.isS40Compliant = json.isS40Compliant;
    response.hasPotentialS29Claims = json.hasPotentialS29Claims;

    // Audit
    response.version = json.version;
    response.lastEventId = json.lastEventId;
    response.createdAt = json.createdAt;
    response.updatedAt = json.updatedAt;
    response.deletedAt = json.deletedAt;
    response.deletedBy = json.deletedBy;
    response.deletionReason = json.deletionReason;
    response.isArchived = json.isArchived;

    // Arrays
    response.memberIds = json.memberIds;
    response.marriageIds = json.marriageIds;
    response.polygamousHouseIds = json.polygamousHouseIds;

    return response;
  }
}
