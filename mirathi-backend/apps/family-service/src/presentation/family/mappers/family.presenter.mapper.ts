import { FamilyDashboardVM } from '../../../application/family/queries/read-models/family-dashboard.vm';
import { FamilyGraphVM } from '../../../application/family/queries/read-models/family-graph-node.vm';
import { FamilyMemberProfileVM } from '../../../application/family/queries/read-models/family-member-profile.vm';
import { PolygamyDistributionVM } from '../../../application/family/queries/read-models/polygamy-distribution.vm';
import { SuccessionReadinessVM } from '../../../application/family/queries/read-models/succession-readiness.vm';
import { FamilyDetailsDto } from '../dto/response/family-details.dto';
import { FamilyMemberDto } from '../dto/response/family-member.dto';
import { FamilyTreeDto, GraphEdgeDto, GraphNodeDto } from '../dto/response/family-tree.dto';
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
      totem: vm.totem,

      stats: {
        totalMembers: vm.stats.totalMembers,
        livingMembers: vm.stats.livingMembers,
        deceasedMembers: vm.stats.deceasedMembers,
        verifiedMembers: vm.stats.verifiedMembers,
        generationsCount: vm.stats.generationsCount,
        potentialDependents: vm.stats.potentialDependents,
      },

      structure: {
        type: vm.structure.type,
        houseCount: vm.structure.houseCount,
        isS40Compliant: vm.structure.isS40Compliant,
        polygamyStatus: vm.structure.polygamyStatus,
      },

      recentEvents: vm.recentEvents.map((event) => ({
        eventId: event.eventId,
        date: event.date,
        description: event.description,
        actorName: event.actorName,
        type: event.type,
      })),

      completeness: {
        score: vm.completeness.score,
        missingFieldsCount: vm.completeness.missingFieldsCount,
        nextRecommendedAction: vm.completeness.nextRecommendedAction,
      },
    };
  }

  /**
   * Maps the internal Graph VM to the API Tree DTO
   */
  public static toFamilyTreeDto(vm: FamilyGraphVM): FamilyTreeDto {
    return {
      familyId: vm.familyId,
      stats: {
        nodesCount: vm.stats.nodesCount,
        edgesCount: vm.stats.edgesCount,
        generations: vm.stats.generations,
      },
      nodes: vm.nodes.map((node) => {
        const nodeDto: GraphNodeDto = {
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
            // S.40 Visualization mappings
            houseId: node.data.houseId,
            houseColor: node.data.houseColor,
          },
          generationLevel: node.generationLevel,
        };
        return nodeDto;
      }),
      edges: vm.edges.map((edge) => {
        const edgeDto: GraphEdgeDto = {
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
                strokeDasharray: edge.style.strokeDasharray,
                animated: edge.style.animated,
              }
            : undefined,
        };
        return edgeDto;
      }),
    };
  }

  /**
   * Maps the internal Member Profile VM to the API Member DTO
   * Note: Handles nested objects introduced in the upgrade
   */
  public static toFamilyMemberDto(vm: FamilyMemberProfileVM): FamilyMemberDto {
    return {
      id: vm.id,
      familyId: vm.familyId,

      identity: {
        fullName: vm.identity.fullName,
        officialName: vm.identity.officialName,
        first: vm.identity.first,
        last: vm.identity.last,
        gender: vm.identity.gender,
        dateOfBirth: vm.identity.dateOfBirth,
        age: vm.identity.age,
        nationalId: vm.identity.nationalId,
      },

      vitalStatus: {
        isAlive: vm.vitalStatus.isAlive,
        dateOfDeath: vm.vitalStatus.dateOfDeath,
        isMissing: vm.vitalStatus.isMissing,
      },

      context: {
        tribe: vm.context.tribe,
        clan: vm.context.clan,
        homeCounty: vm.context.homeCounty,
        placeOfBirth: vm.context.placeOfBirth,
      },

      verification: {
        isVerified: vm.verification.isVerified,
        status: vm.verification.status,
        method: vm.verification.method,
        confidenceScore: vm.verification.confidenceScore,
      },

      kinship: {
        parents: vm.kinship.parents.map((p) => ({
          id: p.id,
          name: p.name,
          relationshipType: p.relationshipType,
          isAlive: p.isAlive,
        })),
        spouses: vm.kinship.spouses.map((s) => ({
          id: s.id,
          name: s.name,
          marriageType: s.marriageType,
          status: s.status,
          dateOfMarriage: s.dateOfMarriage,
        })),
        children: vm.kinship.children.map((c) => ({
          id: c.id,
          name: c.name,
          gender: c.gender,
          age: c.age,
        })),
        siblings: vm.kinship.siblings.map((s) => ({
          id: s.id,
          name: s.name,
          type: s.type,
        })),
      },

      polygamyContext: {
        isPolygamousFamily: vm.polygamyContext.isPolygamousFamily,
        belongsToHouseId: vm.polygamyContext.belongsToHouseId,
        belongsToHouseName: vm.polygamyContext.belongsToHouseName,
        isHouseHead: vm.polygamyContext.isHouseHead,
      },

      legalStatus: {
        isMinor: vm.legalStatus.isMinor,
        isAdult: vm.legalStatus.isAdult,
        hasGuardian: vm.legalStatus.hasGuardian,
        qualifiesForS29: vm.legalStatus.qualifiesForS29,
        inheritanceEligibility: vm.legalStatus.inheritanceEligibility,
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
        potentialClaimantsCount: vm.dependencyAnalysis.potentialClaimantsCount,
        claimantNames: vm.dependencyAnalysis.claimantNames || [],
        issues: vm.dependencyAnalysis.issues,
      },

      polygamyAnalysis: {
        isPolygamous: vm.polygamyAnalysis.isPolygamous,
        status: vm.polygamyAnalysis.status,
        definedHouses: vm.polygamyAnalysis.definedHouses,
        issues: vm.polygamyAnalysis.issues,
      },

      dataIntegrity: {
        verifiedMembersPercentage: vm.dataIntegrity.verifiedMembersPercentage,
        missingCriticalDocuments: vm.dataIntegrity.missingCriticalDocuments,
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
      distributionMethod: vm.distributionMethod,
      totalHouses: vm.totalHouses,
      hasUnassignedRisks: vm.hasUnassignedRisks,

      houses: vm.houses.map((house) => ({
        houseId: house.houseId,
        houseName: house.houseName,
        order: house.order,
        theoreticalSharePercentage: house.theoreticalSharePercentage,
        memberCount: house.memberCount,
        minorCount: house.minorCount,
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
          isStudent: m.isStudent,
          hasDisability: m.hasDisability,
          isEligibleBeneficiary: m.isEligibleBeneficiary,
        })),
      })),

      unassignedMembers: vm.unassignedMembers.map((m) => ({
        memberId: m.memberId,
        name: m.name,
        relationshipToHead: m.relationshipToHead,
        age: m.age || 0,
        isMinor: m.isMinor,
        isStudent: m.isStudent,
        hasDisability: m.hasDisability,
        isEligibleBeneficiary: m.isEligibleBeneficiary,
      })),
    };
  }
}
