// apps/family-service/src/application/services/family.service.ts
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RelationshipType } from '@prisma/client';

// 1. Correct Import for the interface (using 'import type' is good practice for interfaces)
import { IEventPublisher } from '@shamba/messaging';

import {
  FamilyCreatedEvent,
  FamilyMemberAddedEvent,
  FamilyMemberDeceasedEvent,
  PolygamyDetectedEvent,
} from '../../domain/events/family.events';
import { FamilyRepository } from '../../infrastructure/repositories/family.repository';
import { EVENT_PUBLISHER, FAMILY_REPOSITORY } from '../../injection.tokens';

// 2. Define the shape of a Suggestion Object to fix the 'never' array error
export interface SmartSuggestion {
  code: string;
  message: string;
  action: string;
  contextId?: string; // Optional, used for guardianship linking
}

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
    const existing = await this.familyRepository.findFamilyByCreatorId(userId);
    if (existing) {
      return existing;
    }

    const family = await this.familyRepository.createFamily({
      creator: { connect: { id: userId } },
      name,
      description,
      totalMembers: 1,
      members: {
        create: {
          user: { connect: { id: userId } },
          firstName: 'Me',
          lastName: '(Creator)',
          relationship: RelationshipType.SELF,
          isAlive: true,
          verificationStatus: 'VERIFIED',
        },
      },
    });

    // FIX 1: Pass only the event object
    const event = new FamilyCreatedEvent(family.id, userId, name, new Date());
    await this.eventPublisher.publish(event);

    return family;
  }

  async getMyFamily(userId: string) {
    const family = await this.familyRepository.findFamilyByCreatorId(userId);
    if (!family) {
      return this.createFamily(userId, 'My Family Tree');
    }
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

    const duplicate = await this.familyRepository.findFamilyMemberByName(
      familyId,
      dto.firstName,
      dto.lastName,
    );

    if (duplicate) {
      throw new BadRequestException({
        message: 'Potential duplicate detected',
        suggestion: `A person named "${duplicate.firstName} ${duplicate.lastName}" already exists.`,
        existingMemberId: duplicate.id,
      });
    }

    const age = dto.dateOfBirth ? this.calculateAge(new Date(dto.dateOfBirth)) : null;
    const isMinor = age !== null && age < 18;

    if (dto.relationship === RelationshipType.CHILD && dto.dateOfBirth) {
      await this.validateParentChildAge(familyId, new Date(dto.dateOfBirth));
    }

    const member = await this.familyRepository.createFamilyMember({
      family: { connect: { id: familyId } },
      firstName: dto.firstName,
      middleName: dto.middleName,
      lastName: dto.lastName,
      maidenName: dto.maidenName,
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

    await this.updateFamilyStats(familyId);
    await this.checkForPolygamy(familyId);

    if (dto.polygamousHouseId) {
      await this.familyRepository.updateHouseChildCount(dto.polygamousHouseId, 1);
    }

    // FIX 1: Pass only the event object
    const event = new FamilyMemberAddedEvent(
      familyId,
      member.id,
      `${member.firstName} ${member.lastName}`,
      dto.relationship,
      isMinor,
      new Date(),
    );
    await this.eventPublisher.publish(event);

    return {
      member,
      suggestions: await this.generateSmartSuggestions(familyId, member),
    };
  }

  // ==========================================================================
  // UPDATE FAMILY MEMBER
  // ==========================================================================

  async updateFamilyMember(memberId: string, dto: any) {
    const member = await this.familyRepository.findFamilyMemberById(memberId);
    if (!member) {
      throw new NotFoundException('Family member not found');
    }

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

    if (wasAlive && isNowDeceased) {
      // FIX 1: Pass only the event object
      const event = new FamilyMemberDeceasedEvent(
        member.familyId,
        member.id,
        `${updated.firstName} ${updated.lastName}`,
        updated.nationalId || undefined,
        updated.dateOfDeath || new Date(),
        updated.deathCertNo || undefined,
        updated.causeOfDeath || undefined,
      );
      await this.eventPublisher.publish(event);

      await this.updateFamilyStats(member.familyId);
    }

    return updated;
  }

  async removeFamilyMember(memberId: string) {
    const member = await this.familyRepository.findFamilyMemberById(memberId);
    if (!member) throw new NotFoundException('Member not found');

    if (member.relationship === RelationshipType.SELF) {
      throw new BadRequestException(
        'Cannot delete the root user (Self). Delete the family instead.',
      );
    }

    await this.familyRepository.deleteFamilyMember(memberId);
    await this.updateFamilyStats(member.familyId);

    return { message: 'Member removed successfully' };
  }

  // ==========================================================================
  // TREE VISUALIZATION
  // ==========================================================================

  async getFamilyTree(familyId: string) {
    const family = await this.familyRepository.findFamilyById(familyId);
    if (!family) throw new NotFoundException('Family not found');

    const rootMember = family.members.find((m) => m.relationship === RelationshipType.SELF);
    if (!rootMember) {
      return { warning: 'Root member missing', members: family.members };
    }

    const spouses = family.members.filter((m) => m.relationship === RelationshipType.SPOUSE);

    const children = family.members.filter(
      (m) =>
        m.relationship === RelationshipType.CHILD ||
        m.relationship === RelationshipType.ADOPTED_CHILD,
    );

    const parents = family.members.filter(
      (m) =>
        m.relationship === RelationshipType.FATHER || m.relationship === RelationshipType.MOTHER,
    );

    return {
      id: rootMember.id,
      name: `${rootMember.firstName} ${rootMember.lastName}`,
      role: 'Me',
      gender: rootMember.gender,
      isAlive: rootMember.isAlive,
      spouses: spouses.map((s) => ({
        id: s.id,
        name: `${s.firstName} ${s.lastName}`,
        houseName: s.polygamousHouseId
          ? family.houses.find((h) => h.id === s.polygamousHouseId)?.houseName
          : null,
      })),
      children: children.map((c) => ({
        id: c.id,
        name: `${c.firstName} ${c.lastName}`,
        isMinor: c.isMinor,
        houseId: c.polygamousHouseId,
      })),
      parents: parents.map((p) => ({
        id: p.id,
        name: `${p.firstName} ${p.lastName}`,
        role: p.relationship,
      })),
      stats: {
        totalMembers: family.totalMembers,
        isPolygamous: family.isPolygamous,
      },
    };
  }

  // ==========================================================================
  // HEIR CALCULATION
  // ==========================================================================

  async getPotentialHeirs(familyId: string) {
    const family = await this.familyRepository.findFamilyById(familyId);
    if (!family) throw new NotFoundException('Family not found');

    const heirs: any[] = [];
    const members = family.members;

    const spouses = members.filter((m) => m.relationship === RelationshipType.SPOUSE && m.isAlive);

    spouses.forEach((spouse) => {
      heirs.push({
        id: spouse.id,
        name: `${spouse.firstName} ${spouse.lastName}`,
        category: 'SPOUSE',
        priority: 1,
        legalBasis: 'Section 29(a) & Section 35(1) - Life Interest',
        description: 'Entitled to personal effects and life interest in remaining estate.',
      });
    });

    const children = members.filter(
      (m) =>
        (m.relationship === RelationshipType.CHILD ||
          m.relationship === RelationshipType.ADOPTED_CHILD) &&
        m.isAlive,
    );

    children.forEach((child) => {
      const houseName = child.polygamousHouseId
        ? family.houses.find((h) => h.id === child.polygamousHouseId)?.houseName
        : null;

      heirs.push({
        id: child.id,
        name: `${child.firstName} ${child.lastName}`,
        category: 'CHILD',
        priority: 1,
        isMinor: child.isMinor,
        legalBasis: child.isAdopted ? 'Section 29(a) (Adopted)' : 'Section 29(a)',
        house: houseName,
        description: 'Entitled to equal share of the estate (subject to spousal life interest).',
      });
    });

    if (spouses.length === 0 && children.length === 0) {
      const parents = members.filter(
        (m) =>
          (m.relationship === RelationshipType.FATHER ||
            m.relationship === RelationshipType.MOTHER) &&
          m.isAlive,
      );

      parents.forEach((parent) => {
        heirs.push({
          id: parent.id,
          name: `${parent.firstName} ${parent.lastName}`,
          category: 'PARENT',
          priority: 2,
          legalBasis: 'Section 39(1)(a) & (b)',
          description: 'Entitled to equal share if no surviving spouse or children.',
        });
      });
    }

    if (family.isPolygamous || spouses.length > 1) {
      heirs.unshift({
        id: 'INFO_POLYGAMY',
        category: 'WARNING',
        name: 'Polygamous Estate Detected',
        legalBasis: 'Section 40 - Distribution by Houses',
        description: `This estate will likely be distributed according to the number of children in each house. Detected ${family.houses.length} houses.`,
      });
    }

    return heirs;
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  private calculateAge(dob: Date): number {
    const diff = Date.now() - dob.getTime();
    const ageDt = new Date(diff);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
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
        const parentAgeAtChildBirth = childDob.getFullYear() - parent.dateOfBirth.getFullYear();
        if (parentAgeAtChildBirth < 12) {
          throw new BadRequestException(
            `Biologically unlikely: Parent ${parent.firstName} would have been ${parentAgeAtChildBirth} when child was born.`,
          );
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

  private async checkForPolygamy(familyId: string) {
    const members = await this.familyRepository.findFamilyMembers(familyId);
    const spouses = members.filter((m) => m.relationship === RelationshipType.SPOUSE && m.isAlive);

    if (spouses.length > 1) {
      const family = await this.familyRepository.findFamilyById(familyId);
      if (!family?.isPolygamous) {
        await this.familyRepository.updateFamilyStats(familyId, { isPolygamous: true });

        // FIX 1: Pass only the event object
        const event = new PolygamyDetectedEvent(
          familyId,
          spouses.length,
          family?.houses?.length || 0,
          new Date(),
        );
        await this.eventPublisher.publish(event);
      }
    }
  }

  private async generateSmartSuggestions(familyId: string, newMember: any) {
    // FIX 2: Explicitly type the array to avoid 'never' array type
    const suggestions: SmartSuggestion[] = [];

    if (newMember.relationship === RelationshipType.CHILD) {
      const members = await this.familyRepository.findFamilyMembers(familyId);
      const mother = members.find((m) => m.relationship === RelationshipType.MOTHER);

      if (!mother) {
        suggestions.push({
          code: 'MISSING_MOTHER',
          message:
            'You added a child but no mother is listed. For accurate succession planning, linking a mother is recommended.',
          action: 'ADD_MOTHER',
        });
      }
    }

    if (newMember.isMinor && newMember.isAlive) {
      suggestions.push({
        code: 'ASSIGN_GUARDIAN',
        message: `${newMember.firstName} is a minor (${newMember.age} yrs). A guardian should be appointed in your Will.`,
        action: 'OPEN_GUARDIANSHIP',
        contextId: newMember.id, // This matches the SmartSuggestion interface
      });
    }

    return suggestions;
  }
}
