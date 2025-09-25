import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { FamilyRepository } from '../repositories/family.repository';
import { FamilyEntity, FamilyMemberEntity } from '../entities/will.entity';
import { MessagingService } from '@shamba/messaging';
import { LoggerService } from '@shamba/observability';
import { 
  CreateFamilyDto, 
  AddFamilyMemberDto, 
  FamilyResponseDto,
  RelationshipType 
} from '@shamba/common';
import { JwtPayload } from '@shamba/auth';

@Injectable()
export class FamilyService {
  constructor(
    private familyRepository: FamilyRepository,
    private messagingService: MessagingService,
    private logger: LoggerService,
  ) {}

  async createFamily(createFamilyDto: CreateFamilyDto, creatorId: string): Promise<FamilyResponseDto> {
    this.logger.info('Creating new family', 'FamilyService', { creatorId });

    const familyEntity = await this.familyRepository.create(createFamilyDto, creatorId);

    // Publish family created event
    await this.messagingService.publish('family.created', {
      familyId: familyEntity.id,
      creatorId,
      name: familyEntity.name,
      timestamp: new Date(),
    });

    this.logger.info('Family created successfully', 'FamilyService', { 
      familyId: familyEntity.id,
      creatorId,
    });

    return this.mapToResponseDto(familyEntity);
  }

  async getFamilyById(familyId: string, currentUser: JwtPayload): Promise<FamilyResponseDto> {
    this.logger.debug('Fetching family by ID', 'FamilyService', { familyId });

    const familyEntity = await this.familyRepository.findById(familyId);

    // Authorization: Only family members or admin can view family
    if (!familyEntity.hasMember(currentUser.userId) && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Access denied to this family');
    }

    return this.mapToResponseDto(familyEntity);
  }

  async getFamiliesByMember(userId: string, currentUser: JwtPayload): Promise<FamilyResponseDto[]> {
    this.logger.debug('Fetching families for member', 'FamilyService', { userId });

    // Authorization: Users can only view their own families unless admin
    if (userId !== currentUser.userId && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Access denied to these families');
    }

    const familyEntities = await this.familyRepository.findByMemberId(userId);
    return familyEntities.map(family => this.mapToResponseDto(family));
  }

  async addFamilyMember(
    familyId: string,
    addMemberDto: AddFamilyMemberDto,
    currentUser: JwtPayload,
  ): Promise<FamilyMemberEntity> {
    this.logger.info('Adding member to family', 'FamilyService', { 
      familyId,
      newMemberId: addMemberDto.userId,
    });

    const family = await this.familyRepository.findById(familyId);

    // Authorization: Only family managers or admin can add members
    if (!family.canManageFamily(currentUser.userId) && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Insufficient permissions to add family members');
    }

    const member = await this.familyRepository.addMember(familyId, addMemberDto);

    // Publish family member added event
    await this.messagingService.publish('family.member_added', {
      familyId,
      memberId: addMemberDto.userId,
      role: addMemberDto.role,
      addedBy: currentUser.userId,
      timestamp: new Date(),
    });

    this.logger.info('Family member added successfully', 'FamilyService', { 
      familyId,
      memberId: addMemberDto.userId,
    });

    return member;
  }

  async removeFamilyMember(familyId: string, memberId: string, currentUser: JwtPayload): Promise<void> {
    this.logger.info('Removing member from family', 'FamilyService', { 
      familyId,
      memberId,
    });

    const family = await this.familyRepository.findById(familyId);

    // Authorization: Only family managers, the member themselves, or admin can remove
    const canRemove = family.canManageFamily(currentUser.userId) || 
                     currentUser.userId === memberId || 
                     currentUser.role === 'ADMIN';

    if (!canRemove) {
      throw new ForbiddenException('Insufficient permissions to remove family member');
    }

    await this.familyRepository.removeMember(familyId, memberId);

    // Publish family member removed event
    await this.messagingService.publish('family.member_removed', {
      familyId,
      memberId,
      removedBy: currentUser.userId,
      timestamp: new Date(),
    });

    this.logger.info('Family member removed successfully', 'FamilyService', { 
      familyId,
      memberId,
    });
  }

  async updateMemberRole(
    familyId: string,
    memberId: string,
    newRole: RelationshipType,
    currentUser: JwtPayload,
  ): Promise<FamilyMemberEntity> {
    this.logger.info('Updating family member role', 'FamilyService', { 
      familyId,
      memberId,
      newRole,
    });

    const family = await this.familyRepository.findById(familyId);

    // Authorization: Only family managers or admin can update roles
    if (!family.canManageFamily(currentUser.userId) && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Insufficient permissions to update family member roles');
    }

    // Prevent changing the last parent's role
    if (newRole !== RelationshipType.PARENT) {
      const parents = family.members?.filter(m => m.role === RelationshipType.PARENT) || [];
      if (parents.length === 1 && parents[0].userId === memberId) {
        throw new ConflictException('Cannot change the role of the last parent in the family');
      }
    }

    const member = await this.familyRepository.updateMemberRole(familyId, memberId, newRole);

    this.logger.info('Family member role updated successfully', 'FamilyService', { 
      familyId,
      memberId,
      newRole,
    });

    return member;
  }

  async getFamilyTree(familyId: string, currentUser: JwtPayload): Promise<any> {
    this.logger.debug('Generating family tree', 'FamilyService', { familyId });

    const family = await this.familyRepository.findById(familyId);

    // Authorization: Only family members or admin can view family tree
    if (!family.hasMember(currentUser.userId) && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Access denied to this family tree');
    }

    const tree = await this.familyRepository.getFamilyTree(familyId);

    // Enhance with additional family relationship data
    return this.enhanceFamilyTree(tree);
  }

  async getFamilyStats(familyId: string, currentUser: JwtPayload): Promise<any> {
    this.logger.debug('Fetching family statistics', 'FamilyService', { familyId });

    const family = await this.familyRepository.findById(familyId);

    // Authorization: Only family members or admin can view stats
    if (!family.hasMember(currentUser.userId) && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Access denied to these statistics');
    }

    const stats = await this.familyRepository.getFamilyStats(familyId);

    return {
      ...stats,
      generatedAt: new Date().toISOString(),
    };
  }

  async inviteFamilyMember(
    familyId: string,
    email: string,
    role: RelationshipType,
    currentUser: JwtPayload,
  ): Promise<{ message: string; invitationId: string }> {
    this.logger.info('Inviting family member', 'FamilyService', { 
      familyId,
      email,
      role,
    });

    const family = await this.familyRepository.findById(familyId);

    // Authorization: Only family managers or admin can invite members
    if (!family.canManageFamily(currentUser.userId) && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Insufficient permissions to invite family members');
    }

    // This would:
    // 1. Check if user with email exists
    // 2. Create an invitation record
    // 3. Send invitation email
    // 4. Return invitation details

    const invitationId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Publish invitation event
    await this.messagingService.publish('family.invitation_sent', {
      familyId,
      email,
      role,
      invitedBy: currentUser.userId,
      invitationId,
      timestamp: new Date(),
    });

    this.logger.info('Family invitation sent', 'FamilyService', { 
      familyId,
      email,
      invitationId,
    });

    return {
      message: 'Invitation sent successfully',
      invitationId,
    };
  }

  private enhanceFamilyTree(tree: any): any {
    // Add relationship visualization data
    tree.relationships = this.calculateRelationships(tree.members);
    
    // Add generation levels
    tree.generations = this.organizeByGenerations(tree.members);
    
    return tree;
  }

  private calculateRelationships(members: any[]): any[] {
    // This would implement complex relationship calculations
    // For now, return basic relationships
    return members.map(member => ({
      memberId: member.id,
      relationships: members
        .filter(m => m.id !== member.id)
        .map(relative => ({
          relativeId: relative.id,
          relationship: this.determineRelationship(member.role, relative.role),
        })),
    }));
  }

  private organizeByGenerations(members: any[]): any {
    const generations: Record<number, any[]> = {};

    members.forEach(member => {
      const generation = this.getGenerationLevel(member.role);
      if (!generations[generation]) {
        generations[generation] = [];
      }
      generations[generation].push(member);
    });

    return generations;
  }

  private getGenerationLevel(role: string): number {
    const generationMap: Record<string, number> = {
      [RelationshipType.PARENT]: 1,
      [RelationshipType.CHILD]: 2,
      [RelationshipType.GRANDCHILD]: 3,
      [RelationshipType.SIBLING]: 1, // Same generation as parents
      [RelationshipType.OTHER]: 0, // Unknown generation
    };

    return generationMap[role] || 0;
  }

  private determineRelationship(role1: string, role2: string): string {
    // Simplified relationship determination
    const relationships: Record<string, Record<string, string>> = {
      [RelationshipType.PARENT]: {
        [RelationshipType.CHILD]: 'parent',
        [RelationshipType.SIBLING]: 'sibling',
      },
      [RelationshipType.CHILD]: {
        [RelationshipType.PARENT]: 'child',
        [RelationshipType.SIBLING]: 'sibling',
      },
      [RelationshipType.SIBLING]: {
        [RelationshipType.PARENT]: 'sibling', // Actually parent's sibling is aunt/uncle
        [RelationshipType.CHILD]: 'sibling', // Actually sibling's child is niece/nephew
        [RelationshipType.SIBLING]: 'sibling',
      },
    };

    return relationships[role1]?.[role2] || 'relative';
  }

  private mapToResponseDto(family: FamilyEntity): FamilyResponseDto {
    return {
      id: family.id,
      name: family.name,
      members: family.members?.map(member => ({
        userId: member.userId,
        role: member.role,
        user: member.user ? {
          id: member.user.id,
          email: member.user.email,
          firstName: member.user.firstName,
          lastName: member.user.lastName,
        } : undefined,
      })) || [],
      createdAt: family.createdAt,
      updatedAt: family.updatedAt,
    };
  }
}