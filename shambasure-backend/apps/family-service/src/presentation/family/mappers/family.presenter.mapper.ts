import { FamilyDashboardVM } from '../../../application/family/queries/read-models/family-dashboard.vm';
import { FamilyGraphVM } from '../../../application/family/queries/read-models/family-graph-node.vm';
import { FamilyMemberProfileVM } from '../../../application/family/queries/read-models/family-member-profile.vm';
import { PolygamyDistributionVM } from '../../../application/family/queries/read-models/polygamy-distribution.vm';
import { SuccessionReadinessVM } from '../../../application/family/queries/read-models/succession-readiness.vm';
import { FamilyDetailsDto } from '../dto/response/family-details.dto';
import { FamilyMemberDto } from '../dto/response/family-member.dto';
import { FamilyTreeDto } from '../dto/response/family-tree.dto';
import { PolygamyStatusDto } from '../dto/response/polygamy-status.dto';
import { SuccessionAnalysisDto } from '../dto/response/succession-analysis.dto';

export class FamilyPresenterMapper {
  /**
   * Maps the internal Dashboard VM to the API Response DTO
   */
  public static toFamilyDetailsDto(vm: FamilyDashboardVM): FamilyDetailsDto {
    return {
      familyId: vm.familyId,
      name: vm.name,
      description: vm.description,
      county: vm.county,
      clanName: vm.clanName,
      stats: {
        totalMembers: vm.stats.totalMembers,
        livingMembers: vm.stats.livingMembers,
        deceasedMembers: vm.stats.deceasedMembers,
        verifiedMembers: vm.stats.verifiedMembers,
        generationsCount: vm.stats.generationsCount,
      },
      structure: {
        type: vm.structure.type,
        houseCount: vm.structure.houseCount,
        isS40Compliant: vm.structure.isS40Compliant,
      },
      recentEvents: vm.recentEvents.map((event) => ({
        date: event.date,
        description: event.description,
        actorName: event.actorName,
        type: event.type,
      })),
      completenessScore: vm.completenessScore,
    };
  }

  /**
   * Maps the internal Graph VM to the API Tree DTO
   */
  public static toFamilyTreeDto(vm: FamilyGraphVM): FamilyTreeDto {
    return {
      familyId: vm.familyId,
      nodes: vm.nodes.map((node) => ({
        id: node.id,
        type: node.type,
        data: {
          fullName: node.data.fullName,
          gender: node.data.gender,
          dateOfBirth: node.data.dateOfBirth,
          isAlive: node.data.isAlive,
          isHeadOfFamily: node.data.isHeadOfFamily,
          isVerified: node.data.isVerified,
          hasMissingData: node.data.hasMissingData,
          photoUrl: node.data.photoUrl,
        },
      })),
      edges: vm.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
        data: {
          isBiological: edge.data.isBiological,
          isLegal: edge.data.isLegal,
          isVerified: edge.data.isVerified,
          label: edge.data.label,
        },
        style: edge.style
          ? {
              stroke: edge.style.stroke,
              strokeWidth: edge.style.strokeWidth,
            }
          : undefined,
      })),
    };
  }

  /**
   * Maps the internal Member Profile VM to the API Member DTO
   */
  public static toFamilyMemberDto(vm: FamilyMemberProfileVM): FamilyMemberDto {
    return {
      id: vm.id,
      fullName: vm.fullName,
      officialName: vm.officialName,
      gender: vm.gender,
      dateOfBirth: vm.dateOfBirth,
      age: vm.age,
      isAlive: vm.isAlive,
      deathDate: vm.deathDate,
      tribe: vm.tribe,
      clan: vm.clan,
      nationalId: vm.nationalId,
      isVerified: vm.isVerified,
      verificationMethod: vm.verificationMethod,
      parents: vm.parents.map((p) => ({ id: p.id, name: p.name })),
      spouses: vm.spouses.map((s) => ({
        id: s.id,
        name: s.name,
        status: s.status,
      })),
      children: vm.children.map((c) => ({ id: c.id, name: c.name })),
      siblings: vm.siblings.map((s) => ({ id: s.id, name: s.name })),
      legalStatus: {
        isMinor: vm.legalStatus.isMinor,
        hasGuardian: vm.legalStatus.hasGuardian,
        qualifiesForS29: vm.legalStatus.qualifiesForS29,
      },
    };
  }

  /**
   * Maps the internal Succession Readiness VM to the Analysis DTO
   */
  public static toSuccessionAnalysisDto(vm: SuccessionReadinessVM): SuccessionAnalysisDto {
    return {
      familyId: vm.familyId,
      generatedAt: vm.generatedAt,
      overallScore: vm.overallScore,
      readinessLevel: vm.readinessLevel,
      dependencyAnalysis: {
        status: vm.dependencyAnalysis.status,
        issues: vm.dependencyAnalysis.issues,
      },
      polygamyAnalysis: {
        isPolygamous: vm.polygamyAnalysis.isPolygamous,
        status: vm.polygamyAnalysis.status,
        definedHouses: vm.polygamyAnalysis.definedHouses,
        issues: vm.polygamyAnalysis.issues,
      },
      recommendations: vm.recommendations.map((rec) => ({
        priority: rec.priority,
        title: rec.title,
        description: rec.description,
        actionLink: rec.actionLink,
      })),
    };
  }

  /**
   * Maps the internal Polygamy Distribution VM to the Status DTO
   */
  public static toPolygamyStatusDto(vm: PolygamyDistributionVM): PolygamyStatusDto {
    return {
      familyId: vm.familyId,
      isPolygamous: vm.isPolygamous,
      houses: vm.houses.map((house) => ({
        houseId: house.houseId,
        houseName: house.houseName,
        order: house.order,
        memberCount: house.memberCount,
        headOfHouse: {
          memberId: house.headOfHouse.memberId,
          name: house.headOfHouse.name,
          isAlive: house.headOfHouse.isAlive,
          marriageStatus: house.headOfHouse.marriageStatus,
        },
        members: house.members.map((m) => ({
          memberId: m.memberId,
          name: m.name,
          relationshipToHead: m.relationshipToHead,
          age: m.age || 0,
          isMinor: m.isMinor,
        })),
      })),
      unassignedMembers: vm.unassignedMembers.map((m) => ({
        memberId: m.memberId,
        name: m.name,
        relationshipToHead: m.relationshipToHead,
        age: m.age || 0,
        isMinor: m.isMinor,
      })),
    };
  }
}
