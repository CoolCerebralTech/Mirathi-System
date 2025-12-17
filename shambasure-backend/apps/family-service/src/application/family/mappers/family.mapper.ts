// application/family/mappers/family.mapper.ts
import { Injectable } from '@nestjs/common';
import { KenyanCounty as PrismaKenyanCounty } from '@prisma/client';

import { Family } from '../../../domain/aggregates/family.aggregate';
import { CreateFamilyRequest } from '../dto/request/create-family.request';
import { UpdateFamilyRequest } from '../dto/request/update-family.request';
import { FamilyResponse } from '../dto/response/family.response';
import { BaseMapper } from './base.mapper';

@Injectable()
export class FamilyMapper extends BaseMapper<Family, FamilyResponse> {
  toCreateFamilyProps(request: CreateFamilyRequest) {
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

  toDomain(dto: any): Family {
    // For creating from props (usually from database)
    const props = {
      id: dto.id,
      name: dto.name,
      description: dto.description,
      creatorId: dto.creatorId,
      clanName: dto.clanName,
      subClan: dto.subClan,
      ancestralHome: dto.ancestralHome,
      familyTotem: dto.familyTotem,
      homeCounty: dto.homeCounty as PrismaKenyanCounty,
      memberCount: dto.memberCount || 0,
      livingMemberCount: dto.livingMemberCount || 0,
      deceasedMemberCount: dto.deceasedMemberCount || 0,
      minorCount: dto.minorCount || 0,
      dependantCount: dto.dependantCount || 0,
      isPolygamous: dto.isPolygamous || false,
      polygamousHouseCount: dto.polygamousHouseCount || 0,
      version: dto.version || 1,
      lastEventId: dto.lastEventId,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : undefined,
      deletedBy: dto.deletedBy,
      deletionReason: dto.deletionReason,
      isArchived: dto.isArchived || false,
      memberIds: dto.memberIds || [],
      marriageIds: dto.marriageIds || [],
      polygamousHouseIds: dto.polygamousHouseIds || [],
    };

    return Family.createFromProps(props);
  }

  toDTO(family: Family): FamilyResponse {
    const familyJSON = family.toJSON();

    return {
      id: familyJSON.id,
      name: familyJSON.name,
      description: familyJSON.description,
      creatorId: familyJSON.creatorId,
      clanName: familyJSON.clanName,
      subClan: familyJSON.subClan,
      ancestralHome: familyJSON.ancestralHome,
      familyTotem: familyJSON.familyTotem,
      homeCounty: familyJSON.homeCounty,
      memberCount: familyJSON.memberCount,
      livingMemberCount: familyJSON.livingMemberCount,
      deceasedMemberCount: familyJSON.deceasedMemberCount,
      minorCount: familyJSON.minorCount,
      dependantCount: familyJSON.dependantCount,
      isPolygamous: familyJSON.isPolygamous,
      polygamousHouseCount: familyJSON.polygamousHouseCount,
      hasLivingMembers: familyJSON.hasLivingMembers,
      hasDeceasedMembers: familyJSON.hasDeceasedMembers,
      hasMinors: familyJSON.hasMinors,
      hasDependants: familyJSON.hasDependants,
      isActive: familyJSON.isActive,
      isS40Compliant: familyJSON.isS40Compliant,
      hasPotentialS29Claims: familyJSON.hasPotentialS29Claims,
      version: familyJSON.version,
      lastEventId: familyJSON.lastEventId,
      createdAt: familyJSON.createdAt,
      updatedAt: familyJSON.updatedAt,
      deletedAt: familyJSON.deletedAt,
      deletedBy: familyJSON.deletedBy,
      deletionReason: familyJSON.deletionReason,
      isArchived: familyJSON.isArchived,
      memberIds: familyJSON.memberIds,
      marriageIds: familyJSON.marriageIds,
      polygamousHouseIds: familyJSON.polygamousHouseIds,
    };
  }

  toDomainList(dtos: any[]): Family[] {
    return dtos.map((dto) => this.toDomain(dto));
  }

  toDTOList(families: Family[]): FamilyResponse[] {
    return families.map((family) => this.toDTO(family));
  }

  // For search results (lightweight mapping)
  toSearchResult(family: Family) {
    const familyJSON = family.toJSON();

    return {
      id: familyJSON.id,
      name: familyJSON.name,
      clanName: familyJSON.clanName,
      ancestralHome: familyJSON.ancestralHome,
      homeCounty: familyJSON.homeCounty,
      memberCount: familyJSON.memberCount,
      isPolygamous: familyJSON.isPolygamous,
      isActive: familyJSON.isActive,
      createdAt: familyJSON.createdAt,
      updatedAt: familyJSON.updatedAt,
    };
  }

  // For summary views (dashboard, lists)
  toSummaryDTO(family: Family) {
    const familyJSON = family.toJSON();

    return {
      id: familyJSON.id,
      name: familyJSON.name,
      clanName: familyJSON.clanName,
      homeCounty: familyJSON.homeCounty,
      memberCount: familyJSON.memberCount,
      livingMemberCount: familyJSON.livingMemberCount,
      isPolygamous: familyJSON.isPolygamous,
      polygamousHouseCount: familyJSON.polygamousHouseCount,
      isActive: familyJSON.isActive,
      isArchived: familyJSON.isArchived,
      createdAt: familyJSON.createdAt,
      lastUpdated: familyJSON.updatedAt,
    };
  }
}
