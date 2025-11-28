// succession-service/src/succession-process/domain/services/intestate-calculator.service.ts
import { Inject, Injectable } from '@nestjs/common';

import { EstateAggregate } from '../../../estate-planning/domain/aggregates/estate.aggregate';
import { WillRepositoryInterface } from '../../../estate-planning/domain/interfaces/will.repository.interface';
import { FamilyMemberService } from '../../../family-tree/application/services/family-member.service';
import {
  DistributionResult,
  FamilyUnit,
  IntestateSuccessionPolicy,
} from '../policies/intestate-succession.policy';

// To check partial intestacy

@Injectable()
export class IntestateCalculatorService {
  constructor(
    private readonly policy: IntestateSuccessionPolicy,
    // Injecting External Module Services (Family Tree)
    private readonly familyMemberService: FamilyMemberService,
    @Inject('WillRepositoryInterface')
    private readonly willRepository: WillRepositoryInterface,
  ) {}

  /**
   * Calculates the specific shares for an Intestate Estate.
   * @param estate The financial state of the estate (Assets - Debts)
   * @param familyId The ID of the family tree
   * @param deceasedId The User ID of the deceased
   */
  async calculateIntestateDistribution(
    estate: EstateAggregate,
    familyId: string,
    deceasedId: string,
  ): Promise<DistributionResult[]> {
    // 1. Get Net Value
    const financialSummary = estate.getEstateSummary('KES');
    const netValue = financialSummary.netValue.getAmount();

    if (netValue <= 0) {
      // Insolvent Estate: No distribution possible
      return [];
    }

    // 2. Fetch Family Structure
    // We need to build "Family Units" based on the Tree
    const members = await this.familyMemberService.getMembers(familyId, deceasedId);

    // 3. Identify Spouses and Children (Section 29 Priority)
    // Note: This logic relies on the graph structure mapped in FamilyMemberService
    // For calculation, we need to group them.
    const potentialHeirs = await this.familyMemberService.getPotentialHeirs(familyId, deceasedId);

    // Filter only Primary Dependants (Spouse/Children) for Intestacy First Tier
    const primaryHeirs = potentialHeirs.filter((h) =>
      ['SPOUSE', 'CHILD', 'ADOPTED_CHILD', 'CHILD_OUT_OF_WEDLOCK'].includes(h.relationship),
    );

    if (primaryHeirs.length === 0) {
      // Fallback to Section 39 (Parents, Siblings, etc.)
      // Logic would go here to fetch secondary heirs
      return [];
    }

    // 4. Construct Family Units (Houses)
    // Group children by their mother (Spouse) to handle Section 40 (Polygamy)
    // Since our flat list from 'getPotentialHeirs' might not show "Mother ID",
    // we assume a Monogamous unit for MVP or require richer graph traversal.
    // Strict implementation requires fetching Marriages from Family Module.

    // SIMPLIFIED LOGIC:
    const spouses = primaryHeirs.filter((h) => h.relationship === 'SPOUSE');
    const children = primaryHeirs.filter((h) => h.relationship !== 'SPOUSE');

    const units: FamilyUnit[] = [];

    if (spouses.length > 1) {
      // Polygamous: We need to know which child belongs to which spouse.
      // This would require a specific query to Family Module: "getChildren(spouseId)"
      // For now, we will group all under the first spouse to avoid crashing,
      // but flagging this as a todo for the full graph implementation.

      // Fallback: Treat as "Communal" if linkage unknown, or split equally per spouse.
      spouses.forEach((spouse) => {
        units.push({
          spouseId: spouse.id,
          childrenIds: [], // Needs graph lookup
          isHouse: true,
        });
      });
    } else {
      // Monogamous / Single House
      units.push({
        spouseId: spouses.length > 0 ? spouses[0].id : undefined,
        childrenIds: children.map((c) => c.id),
        isHouse: false,
      });
    }

    // 5. Calculate Shares via Policy
    return this.policy.calculateShares(units, netValue);
  }
}
