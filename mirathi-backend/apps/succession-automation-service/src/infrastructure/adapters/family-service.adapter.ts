import { Injectable } from '@nestjs/common';
import {
  GuardianshipStatus,
  MarriageType,
  RelationshipType,
  SuccessionReligion,
} from '@prisma/client';

import { PrismaService } from '@shamba/database';

export interface FamilyData {
  id: string;
  religion: SuccessionReligion;
  numberOfSpouses: number;
  numberOfChildren: number;
  numberOfMinors: number;
  isPolygamous: boolean;
  marriageType: MarriageType;
  hasGuardianForMinors: boolean;
  members: Array<{
    id: string;
    firstName: string;
    relationship: RelationshipType;
    isMinor: boolean;
    isAlive: boolean;
  }>;
}

@Injectable()
export class FamilyServiceAdapter {
  constructor(private readonly prisma: PrismaService) {}

  async getFamilyData(userId: string): Promise<FamilyData> {
    const family = await this.prisma.family.findFirst({
      where: { creatorId: userId },
      include: {
        members: true,
        marriages: true,
        guardianships: true,
      },
    });

    if (!family) {
      return this.getEmptyFamily();
    }

    const spouses = family.members.filter(
      (m) => m.relationship === RelationshipType.SPOUSE && m.isAlive,
    );

    const children = family.members.filter(
      (m) =>
        (m.relationship === RelationshipType.CHILD ||
          m.relationship === RelationshipType.ADOPTED_CHILD) &&
        m.isAlive,
    );

    const minors = children.filter((c) => c.isMinor);

    // Check for Active Guardianships
    const activeGuardianships = family.guardianships.filter(
      (g) => g.status === GuardianshipStatus.ACTIVE || g.status === GuardianshipStatus.ELIGIBLE,
    );

    return {
      id: family.id,
      religion: SuccessionReligion.STATUTORY, // Default, logic to infer from tribe/user profile can be added here
      numberOfSpouses: spouses.length,
      numberOfChildren: children.length,
      numberOfMinors: minors.length,
      isPolygamous: family.isPolygamous,
      marriageType: this.determineMarriageType(family.isPolygamous, spouses.length),

      // True if all minors are covered, or if we have at least one active guardianship setup
      hasGuardianForMinors: minors.length === 0 || activeGuardianships.length > 0,

      members: family.members.map((m) => ({
        id: m.id,
        firstName: m.firstName,
        relationship: m.relationship,
        isMinor: m.isMinor,
        isAlive: m.isAlive,
      })),
    };
  }

  private determineMarriageType(isPolygamous: boolean, spouseCount: number): MarriageType {
    if (isPolygamous) return MarriageType.POLYGAMOUS;
    if (spouseCount === 1) return MarriageType.MONOGAMOUS;
    if (spouseCount === 0) return MarriageType.SINGLE;
    return MarriageType.COHABITATION; // Fallback
  }

  private getEmptyFamily(): FamilyData {
    return {
      id: '',
      religion: SuccessionReligion.STATUTORY,
      numberOfSpouses: 0,
      numberOfChildren: 0,
      numberOfMinors: 0,
      isPolygamous: false,
      marriageType: MarriageType.SINGLE,
      hasGuardianForMinors: true, // No minors = requirement met
      members: [],
    };
  }
}
