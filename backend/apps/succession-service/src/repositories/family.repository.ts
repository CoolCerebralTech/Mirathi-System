import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@shamba/database';
import { FamilyEntity, FamilyMemberEntity } from '../entities/will.entity';
import { CreateFamilyDto, AddFamilyMemberDto, RelationshipType } from '@shamba/common';

@Injectable()
export class FamilyRepository {
  constructor(private prisma: PrismaService) {}

  async create(createFamilyDto: CreateFamilyDto, creatorId: string): Promise<FamilyEntity> {
    const family = await this.prisma.family.create({
      data: {
        name: createFamilyDto.name,
        members: {
          create: {
            userId: creatorId,
            role: RelationshipType.PARENT, // Creator becomes parent
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return new FamilyEntity(family);
  }

  async findById(id: string): Promise<FamilyEntity> {
    const family = await this.prisma.family.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!family) {
      throw new NotFoundException(`Family with ID ${id} not found`);
    }

    return new FamilyEntity(family);
  }

  async findByMemberId(userId: string): Promise<FamilyEntity[]> {
    const families = await this.prisma.family.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return families.map(family => new FamilyEntity(family));
  }

  async addMember(familyId: string, addMemberDto: AddFamilyMemberDto): Promise<FamilyMemberEntity> {
    await this.findById(familyId); // Verify family exists

    // Check if user is already a member
    const existingMember = await this.prisma.familyMember.findUnique({
      where: {
        userId_familyId: {
          userId: addMemberDto.userId,
          familyId,
        },
      },
    });

    if (existingMember) {
      throw new ConflictException('User is already a member of this family');
    }

    const member = await this.prisma.familyMember.create({
      data: {
        familyId,
        userId: addMemberDto.userId,
        role: addMemberDto.role,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        family: true,
      },
    });

    return new FamilyMemberEntity(member);
  }

  async removeMember(familyId: string, userId: string): Promise<void> {
    const family = await this.findById(familyId);
    
    // Check if user is a member
    if (!family.hasMember(userId)) {
      throw new NotFoundException('User is not a member of this family');
    }

    // Prevent removing the last parent
    const parents = family.members?.filter(m => m.role === RelationshipType.PARENT) || [];
    if (parents.length === 1 && parents[0].userId === userId) {
      throw new ConflictException('Cannot remove the last parent from the family');
    }

    await this.prisma.familyMember.delete({
      where: {
        userId_familyId: {
          userId,
          familyId,
        },
      },
    });
  }

  async updateMemberRole(familyId: string, userId: string, newRole: RelationshipType): Promise<FamilyMemberEntity> {
    const member = await this.prisma.familyMember.findUnique({
      where: {
        userId_familyId: {
          userId,
          familyId,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Family member not found');
    }

    const updatedMember = await this.prisma.familyMember.update({
      where: {
        userId_familyId: {
          userId,
          familyId,
        },
      },
      data: { role: newRole },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        family: true,
      },
    });

    return new FamilyMemberEntity(updatedMember);
  }

  async getFamilyTree(familyId: string): Promise<any> {
    const family = await this.findById(familyId);
    
    // Build family tree structure
    const tree = {
      family: {
        id: family.id,
        name: family.name,
      },
      members: family.members?.map(member => ({
        id: member.userId,
        firstName: member.user?.firstName,
        lastName: member.user?.lastName,
        email: member.user?.email,
        role: member.role,
        relationship: member.role,
      })) || [],
    };

    return tree;
  }

  async getFamilyStats(familyId: string): Promise<{
    totalMembers: number;
    membersByRole: Record<string, number>;
    averageAge?: number;
    hasWills: number;
    totalAssets: number;
  }> {
    const family = await this.findById(familyId);
    
    const totalMembers = family.getFamilySize();
    
    const membersByRole: Record<string, number> = {};
    family.members?.forEach(member => {
      membersByRole[member.role] = (membersByRole[member.role] || 0) + 1;
    });

    // These would require additional data and calculations
    const hasWills = 0; // Would query wills for family members
    const totalAssets = 0; // Would query assets for family members

    return {
      totalMembers,
      membersByRole,
      hasWills,
      totalAssets,
    };
  }
}