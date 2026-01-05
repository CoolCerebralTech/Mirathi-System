// apps/family-service/src/application/services/family.service.ts
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RelationshipType } from '@prisma/client';

import { IEventPublisher } from '@shamba/messaging';

import {
  FamilyCreatedEvent,
  FamilyMemberAddedEvent,
  FamilyMemberDeceasedEvent,
} from '../../domain/events/family.events';
import { FamilyRepository } from '../../infrastructure/repositories/family.repository';
import { EVENT_PUBLISHER, FAMILY_REPOSITORY } from '../../injection.tokens';

@Injectable()
export class FamilyService {
  constructor(
    @Inject(FAMILY_REPOSITORY)
    private readonly familyRepository: FamilyRepository,
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: IEventPublisher,
  ) {}

  // ==========================================================================
  // CREATE FAMILY
  // ==========================================================================

  async createFamily(userId: string, name: string, description?: string) {
    const family = await this.familyRepository.createFamily({
      creator: { connect: { id: userId } },
      name,
      description,
      totalMembers: 1,
      members: {
        create: {
          user: { connect: { id: userId } },
          firstName: 'You',
          lastName: 'Creator',
          relationship: RelationshipType.SELF,
          isAlive: true,
        },
      },
    });

    // Publish event
    const event = new FamilyCreatedEvent(family.id, userId, name, new Date());
    await this.eventPublisher.publish(event.eventType, event);

    return family;
  }

  // ==========================================================================
  // ADD FAMILY MEMBER
  // ==========================================================================

  async addFamilyMember(familyId: string, dto: any) {
    const family = await this.familyRepository.findFamilyById(familyId);
    if (!family) {
      throw new NotFoundException('Family not found');
    }

    // Duplicate detection
    const duplicate = await this.familyRepository.findFamilyMemberByName(
      familyId,
      dto.firstName,
      dto.lastName,
    );

    if (duplicate) {
      throw new BadRequestException({
        message: 'Potential duplicate detected',
        suggestion: `A person named "${duplicate.firstName} ${duplicate.lastName}" already exists. Is this the same person?`,
        existingMemberId: duplicate.id,
      });
    }

    // Calculate age
    const age = dto.dateOfBirth ? this.calculateAge(new Date(dto.dateOfBirth)) : null;
    const isMinor = age !== null && age < 18;

    // Validate parent-child age
    if (dto.relationship === RelationshipType.CHILD && dto.dateOfBirth) {
      await this.validateParentChildAge(familyId, new Date(dto.dateOfBirth));
    }

    // Create member
    const member = await this.familyRepository.createFamilyMember({
      family: { connect: { id: familyId } },
      firstName: dto.firstName,
      middleName: dto.middleName,
      lastName: dto.lastName,
      relationship: dto.relationship,
      gender: dto.gender,
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      nationalId: dto.nationalId,
      phoneNumber: dto.phoneNumber,
      email: dto.email,
      age,
      isMinor,
      isAdopted: dto.isAdopted || false,
      adoptionDate: dto.adoptionDate ? new Date(dto.adoptionDate) : undefined,
      polygamousHouse: dto.polygamousHouseId
        ? { connect: { id: dto.polygamousHouseId } }
        : undefined,
    });

    // Update family stats
    await this.updateFamilyStats(familyId);

    // Update house count if applicable
    if (dto.polygamousHouseId) {
      await this.familyRepository.updateHouseChildCount(dto.polygamousHouseId, 1);
    }

    // Publish event
    const event = new FamilyMemberAddedEvent(
      familyId,
      member.id,
      `${member.firstName} ${member.lastName}`,
      dto.relationship,
      isMinor,
      new Date(),
    );
    await this.eventPublisher.publish(event.eventType, event);

    // Generate smart suggestions
    const suggestions = await this.generateSmartSuggestions(familyId, member);

    return { member, suggestions };
  }

  // ==========================================================================
  // UPDATE FAMILY MEMBER
  // ==========================================================================

  async updateFamilyMember(memberId: string, dto: any) {
    const member = await this.familyRepository.findFamilyMemberById(memberId);
    if (!member) {
      throw new NotFoundException('Family member not found');
    }

    // Handle death
    const wasAlive = member.isAlive;
    const isNowDeceased = dto.isAlive === false;

    const age = dto.dateOfBirth ? this.calculateAge(new Date(dto.dateOfBirth)) : member.age;
    const isMinor = age !== null && age < 18;

    const updated = await this.familyRepository.updateFamilyMember(memberId, {
      ...dto,
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      dateOfDeath: dto.dateOfDeath ? new Date(dto.dateOfDeath) : undefined,
      age,
      isMinor,
    });

    // Publish death event (CRITICAL for Estate Service)
    if (wasAlive && isNowDeceased) {
      const event = new FamilyMemberDeceasedEvent(
        member.familyId,
        member.id,
        `${updated.firstName} ${updated.lastName}`,
        updated.nationalId || undefined,
        updated.dateOfDeath || new Date(),
        updated.deathCertNo || undefined,
        updated.causeOfDeath || undefined,
      );
      await this.eventPublisher.publish(event.eventType, event);

      // Update family stats
      await this.updateFamilyStats(member.familyId);
    }

    return updated;
  }

  // ==========================================================================
  // GET FAMILY TREE
  // ==========================================================================

  async getFamilyTree(familyId: string) {
    const family = await this.familyRepository.findFamilyById(familyId);
    if (!family) {
      throw new NotFoundException('Family not found');
    }

    // Find root (SELF)
    const root = family.members.find((m) => m.relationship === RelationshipType.SELF);
    if (!root) {
      throw new BadRequestException('Family tree has no root member');
    }

    return this.buildTreeNode(root, family.members);
  }

  // ==========================================================================
  // GET POTENTIAL HEIRS (Kenyan Law)
  // ==========================================================================

  async getPotentialHeirs(familyId: string) {
    const family = await this.familyRepository.findFamilyById(familyId);
    if (!family) {
      throw new NotFoundException('Family not found');
    }

    const heirs: any[] = [];

    // Surviving spouses (Section 35)
    const spouses = family.members.filter(
      (m) => m.relationship === RelationshipType.SPOUSE && m.isAlive,
    );

    for (const spouse of spouses) {
      heirs.push({
        id: spouse.id,
        name: `${spouse.firstName} ${spouse.lastName}`,
        relationship: 'Surviving Spouse',
        eligibilityReason: 'Married to deceased at time of death',
        legalReference: 'Section 35, Law of Succession Act (Cap 160)',
      });
    }

    // Children (Section 38)
    const children = family.members.filter(
      (m) =>
        (m.relationship === RelationshipType.CHILD ||
          m.relationship === RelationshipType.ADOPTED_CHILD) &&
        m.isAlive,
    );

    for (const child of children) {
      heirs.push({
        id: child.id,
        name: `${child.firstName} ${child.lastName}`,
        relationship: child.isAdopted ? 'Adopted Child' : 'Biological Child',
        eligibilityReason: child.isAdopted
          ? 'Legally adopted child with full inheritance rights'
          : 'Biological child of the deceased',
        legalReference: 'Section 38, Law of Succession Act (Cap 160)',
        house: child.polygamousHouseId
          ? family.houses.find((h) => h.id === child.polygamousHouseId)?.houseName
          : undefined,
      });
    }

    // Polygamous note
    if (family.isPolygamous && family.houses.length > 0) {
      heirs.push({
        id: 'info',
        name: 'IMPORTANT NOTE',
        relationship: 'Polygamous Family',
        eligibilityReason: `Estate will be distributed BY HOUSE. ${family.houses.length} houses detected.`,
        legalReference: 'Section 40, Law of Succession Act (Cap 160)',
      });
    }

    return heirs;
  }

  // ==========================================================================
  // PRIVATE HELPERS
  // ==========================================================================

  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }

    return age;
  }

  private async validateParentChildAge(familyId: string, childDob: Date) {
    const members = await this.familyRepository.findFamilyMembers(familyId);
    const parents = members.filter(
      (m) =>
        (m.relationship === RelationshipType.FATHER ||
          m.relationship === RelationshipType.MOTHER) &&
        m.dateOfBirth,
    );

    for (const parent of parents) {
      if (parent.dateOfBirth) {
        const parentAge = this.calculateAge(parent.dateOfBirth);
        const childAge = this.calculateAge(childDob);

        if (childAge >= parentAge - 12) {
          throw new BadRequestException({
            message: 'Invalid parent-child age relationship',
            detail: 'Child cannot be born when parent was younger than 12 years old',
          });
        }
      }
    }
  }

  private async updateFamilyStats(familyId: string) {
    const members = await this.familyRepository.findFamilyMembers(familyId);

    const totalMembers = members.length;
    const totalMinors = members.filter((m) => m.isMinor && m.isAlive).length;
    const totalSpouses = members.filter(
      (m) => m.relationship === RelationshipType.SPOUSE && m.isAlive,
    ).length;

    await this.familyRepository.updateFamilyStats(familyId, {
      totalMembers,
      totalMinors,
      totalSpouses,
      lastActivityAt: new Date(),
    });
  }

  private async generateSmartSuggestions(familyId: string, newMember: any) {
    const suggestions = [];

    // Suggest adding mother if child added
    if (newMember.relationship === RelationshipType.CHILD) {
      const members = await this.familyRepository.findFamilyMembers(familyId);
      const mother = members.find((m) => m.relationship === RelationshipType.MOTHER);

      if (!mother) {
        suggestions.push({
          type: 'MISSING_MOTHER',
          message: 'You added a child but no mother. Would you like to add the mother?',
          action: 'ADD_MOTHER',
        });
      }
    }

    // Suggest guardianship for minor
    if (newMember.isMinor && newMember.isAlive) {
      suggestions.push({
        type: 'MINOR_NEEDS_GUARDIAN',
        message: `${newMember.firstName} is a minor. Would you like to assign a guardian?`,
        action: 'ASSIGN_GUARDIAN',
        memberId: newMember.id,
      });
    }

    return suggestions;
  }

  private buildTreeNode(member: any, allMembers: any[]): any {
    const node: any = {
      id: member.id,
      name: `${member.firstName} ${member.lastName}`,
      relationship: member.relationship,
      isAlive: member.isAlive,
      age: member.age,
    };

    // Find children
    const children = allMembers.filter(
      (m) =>
        (m.relationship === RelationshipType.CHILD ||
          m.relationship === RelationshipType.ADOPTED_CHILD) &&
        m.deletedAt === null,
    );

    if (children.length > 0) {
      node.children = children.map((child) => this.buildTreeNode(child, allMembers));
    }

    // Find spouse
    const marriage = member.marriagesAsSpouse1?.[0];
    if (marriage) {
      node.spouse = {
        id: marriage.spouse2.id,
        name: `${marriage.spouse2.firstName} ${marriage.spouse2.lastName}`,
        relationship: RelationshipType.SPOUSE,
        isAlive: marriage.spouse2.isAlive,
        age: marriage.spouse2.age,
      };
    }

    return node;
  }
}
