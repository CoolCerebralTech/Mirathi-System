
// ============================================================================
// families.service.ts - Family Management Business Logic
// ============================================================================

import { 
  Injectable as FamilyInjectable, 
  ForbiddenException as FamilyForbidden,
  ConflictException as FamilyConflict,
  BadRequestException as FamilyBadRequest,
  Logger as FamilyLogger,
} from '@nestjs/common';
import { 
  Family, 
  FamilyMember, 
  RelationshipType,
  UserRole as FamilyUserRole,
} from '@shamba/database';
import { 
  CreateFamilyRequestDto, 
  AddFamilyMemberRequestDto,
  UpdateFamilyMemberRequestDto,
} from '@shamba/common';
import { JwtPayload as FamilyJwtPayload } from '@shamba/auth';
import { FamiliesRepository } from '../repositories/families.repository';

/**
 * FamiliesService - Family/HeirLink™ management
 * 
 * BUSINESS RULES:
 * - Only family members can view family details
 * - Only family creator (PARENT) can add/remove members
 * - User can only be in one family (per creator)
 * - Cannot remove family creator
 */
@FamilyInjectable()
export class FamiliesService {
  private readonly logger = new FamilyLogger(FamiliesService.name);

  constructor(
    private readonly familiesRepository: FamiliesRepository,
  ) {}

  // ========================================================================
  // CREATE OPERATIONS
  // ========================================================================

  async create(
    creatorId: string, 
    data: CreateFamilyRequestDto
  ): Promise<Family & { members: FamilyMember[] }> {
    // Create family with creator as first PARENT member
    const family = await this.familiesRepository.create({
      name: data.name,
      creator: { connect: { id: creatorId } },
      members: {
        create: { 
          userId: creatorId, 
          role: RelationshipType.PARENT 
        },
      },
    });

    // Fetch with members included
    const familyWithMembers = await this.familiesRepository.findOneOrFail({ 
      id: family.id 
    });

    this.logger.log(`Family created: ${family.id} by creator ${creatorId}`);
    return familyWithMembers;
  }

  // ========================================================================
  // READ OPERATIONS
  // ========================================================================

  async findOne(
    familyId: string, 
    currentUser: FamilyJwtPayload
  ): Promise<Family & { members: FamilyMember[] }> {
    const family = await this.familiesRepository.findOneOrFail({ id: familyId });

    // Authorization: Only members can view family
    const isMember = family.members.some(m => m.userId === currentUser.sub);
    if (!isMember && currentUser.role !== FamilyUserRole.ADMIN) {
      throw new FamilyForbidden('You do not have permission to access this family');
    }

    return family;
  }

  async findForUser(userId: string): Promise<Family[]> {
    return this.familiesRepository.findByMember(userId);
  }

  async findCreatedByUser(userId: string): Promise<Family[]> {
    return this.familiesRepository.findByCreator(userId);
  }

  // ========================================================================
  // MEMBER MANAGEMENT
  // ========================================================================

  async addMember(
    familyId: string, 
    data: AddFamilyMemberRequestDto, 
    currentUser: FamilyJwtPayload
  ): Promise<FamilyMember> {
    const family = await this.findOne(familyId, currentUser);

    // Authorization: Only PARENT can add members
    const currentMember = family.members.find(m => m.userId === currentUser.sub);
    const isParent = currentMember?.role === RelationshipType.PARENT;
    
    if (!isParent && currentUser.role !== FamilyUserRole.ADMIN) {
      throw new FamilyForbidden('Only family parents can add new members');
    }

    // Business rule: Cannot add duplicate members
    const isAlreadyMember = family.members.some(m => m.userId === data.userId);
    if (isAlreadyMember) {
      throw new FamilyConflict('User is already a member of this family');
    }

    const member = await this.familiesRepository.addMember({ 
      familyId, 
      userId: data.userId,
      role: data.role,
    });

    this.logger.log(
      `Member added to family ${familyId}: ${data.userId} as ${data.role}`
    );

    return member;
  }

  async updateMember(
    familyId: string,
    userId: string,
    data: UpdateFamilyMemberRequestDto,
    currentUser: FamilyJwtPayload,
  ): Promise<FamilyMember> {
    const family = await this.findOne(familyId, currentUser);

    // Authorization: Only PARENT can update members
    const currentMember = family.members.find(m => m.userId === currentUser.sub);
    const isParent = currentMember?.role === RelationshipType.PARENT;
    
    if (!isParent && currentUser.role !== FamilyUserRole.ADMIN) {
      throw new FamilyForbidden('Only family parents can update members');
    }

    // Business rule: Cannot change creator's role
    if (userId === family.creatorId) {
      throw new FamilyBadRequest('Cannot change family creator role');
    }

    const updatedMember = await this.familiesRepository.updateMember(
      { userId_familyId: { userId, familyId } },
      { role: data.role },
    );

    this.logger.log(
      `Member updated in family ${familyId}: ${userId} to ${data.role}`
    );

    return updatedMember;
  }

  async removeMember(
    familyId: string,
    userId: string,
    currentUser: FamilyJwtPayload,
  ): Promise<void> {
    const family = await this.findOne(familyId, currentUser);

    // Authorization: Only PARENT can remove members
    const currentMember = family.members.find(m => m.userId === currentUser.sub);
    const isParent = currentMember?.role === RelationshipType.PARENT;
    
    if (!isParent && currentUser.role !== FamilyUserRole.ADMIN) {
      throw new FamilyForbidden('Only family parents can remove members');
    }

    // Business rule: Cannot remove family creator
    if (userId === family.creatorId) {
      throw new FamilyBadRequest('Cannot remove family creator');
    }

    await this.familiesRepository.removeMember({ 
      userId_familyId: { userId, familyId } 
    });

    this.logger.log(`Member removed from family ${familyId}: ${userId}`);
  }

  // ========================================================================
  // DELETE OPERATIONS
  // ========================================================================

  async delete(familyId: string, currentUser: FamilyJwtPayload): Promise<void> {
    const family = await this.findOne(familyId, currentUser);

    // Authorization: Only creator can delete family
    if (family.creatorId !== currentUser.sub && currentUser.role !== FamilyUserRole.ADMIN) {
      throw new FamilyForbidden('Only family creator can delete the family');
    }

    await this.familiesRepository.delete(familyId);

    this.logger.log(`Family deleted: ${familyId} by user ${currentUser.sub}`);
  }
}
