import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { RelationshipType, MarriageStatus } from '@prisma/client';
import type { FamilyMemberRepositoryInterface } from '../interfaces/family-member.repository.interface';
import type { RelationshipRepositoryInterface } from '../interfaces/relationship.repository.interface';
import type { MarriageRepositoryInterface } from '../interfaces/marriage.repository.interface';
import { RelationshipValidationPolicy } from '../policies/relationship-validation.policy';
import { FamilyTreeIntegrityPolicy } from '../policies/family-tree-integrity.policy';
import { PolygamousFamilyPolicy } from '../policies/polygamous-family.policy';

@Injectable()
export class RelationshipIntegrityService {
  constructor(
    @Inject('FamilyMemberRepositoryInterface')
    private readonly memberRepo: FamilyMemberRepositoryInterface,
    @Inject('RelationshipRepositoryInterface')
    private readonly relationshipRepo: RelationshipRepositoryInterface,
    @Inject('MarriageRepositoryInterface')
    private readonly marriageRepo: MarriageRepositoryInterface,
    // Policies
    private readonly validationPolicy: RelationshipValidationPolicy,
    private readonly integrityPolicy: FamilyTreeIntegrityPolicy,
    private readonly polygamyPolicy: PolygamousFamilyPolicy,
  ) {}

  /**
   * Orchestrates all checks before creating a parent/child/sibling link.
   */
  async validateNewRelationship(
    familyId: string,
    fromMemberId: string,
    toMemberId: string,
    type: RelationshipType,
  ): Promise<void> {
    // 1. Load Entities
    const fromMember = await this.memberRepo.findById(fromMemberId);
    const toMember = await this.memberRepo.findById(toMemberId);

    if (!fromMember || !toMember) {
      throw new BadRequestException('One or both family members not found.');
    }

    if (fromMember.getFamilyId() !== familyId || toMember.getFamilyId() !== familyId) {
      throw new BadRequestException('Members belong to different family trees.');
    }

    // 2. Biological & Chronological Validation (Policy)
    const bioCheck = this.validationPolicy.validateRelationship(fromMember, toMember, type);
    if (!bioCheck.isValid) {
      throw new BadRequestException(`Relationship invalid: ${bioCheck.error}`);
    }

    // 3. Graph Integrity (Cycle Detection)
    // We need to fetch existing edges to walk the graph
    const existingRelationships = await this.relationshipRepo.findByFamilyId(familyId);

    const hasCycle = this.integrityPolicy.checkCycle(
      fromMemberId,
      toMemberId,
      type,
      existingRelationships,
    );

    if (hasCycle) {
      throw new BadRequestException(
        'Invalid Relationship: Adding this link would create a cycle in the family tree (e.g., making a child their own ancestor).',
      );
    }
  }

  /**
   * Orchestrates checks before registering a new Marriage.
   * Enforces Monogamy vs Polygamy rules.
   */
  async validateNewMarriage(
    spouse1Id: string,
    spouse2Id: string,
    marriageType: MarriageStatus,
  ): Promise<void> {
    // 1. Identity Check
    if (spouse1Id === spouse2Id) {
      throw new BadRequestException('Cannot marry oneself.');
    }

    // 2. Fetch Existing Marriages for both parties
    const marriages1 = await this.marriageRepo.findByMemberId(spouse1Id);
    const marriages2 = await this.marriageRepo.findByMemberId(spouse2Id);

    // 3. Policy Check: Spouse 1 Eligibility
    const check1 = this.polygamyPolicy.checkMarriageEligibility(
      spouse1Id,
      marriages1,
      marriageType,
    );
    if (!check1.isAllowed) {
      throw new BadRequestException(`Spouse 1 (ID: ${spouse1Id}) ineligible: ${check1.error}`);
    }

    // 4. Policy Check: Spouse 2 Eligibility
    const check2 = this.polygamyPolicy.checkMarriageEligibility(
      spouse2Id,
      marriages2,
      marriageType,
    );
    if (!check2.isAllowed) {
      throw new BadRequestException(`Spouse 2 (ID: ${spouse2Id}) ineligible: ${check2.error}`);
    }

    // 5. Incest Check (Consanguinity)
    // We use the graph search to see if they are close blood relatives
    // This reuses the Relationship Repo to find paths
    // Note: Implementation of deep path search for "Forbidden Degrees" is complex,
    // for now, we assume immediate family checks in the Policy or here.
    // Placeholder:
    // const areRelated = await this.areBloodRelatives(spouse1Id, spouse2Id);
    // if (areRelated) throw ...
  }
}
