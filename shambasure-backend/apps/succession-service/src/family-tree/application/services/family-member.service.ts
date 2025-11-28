import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

// Commands
import { AddFamilyMemberCommand } from '../commands/add-family-member.command';
import { UpdateFamilyMemberCommand } from '../commands/update-family-member.command';
import { RemoveFamilyMemberCommand } from '../commands/remove-family-member.command';

// Queries
import { GetFamilyMembersQuery } from '../queries/get-family-members.query';
import { GetFamilyMemberQuery } from '../queries/get-family-member.query';
import {
  FindPotentialHeirsQuery,
  PotentialHeirResponse,
} from '../queries/find-potential-heirs.query';

// DTOs
import { AddFamilyMemberDto } from '../dto/request/add-family-member.dto';
import { UpdateFamilyMemberDto } from '../dto/request/update-family-member.dto';
import { FamilyMemberResponseDto } from '../dto/response/family-member.response.dto';

@Injectable()
export class FamilyMemberService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // --------------------------------------------------------------------------
  // WRITE OPERATIONS
  // --------------------------------------------------------------------------

  /**
   * Adds a node to the tree and creates the edge (Relationship) to the Root User.
   */
  async addMember(familyId: string, userId: string, dto: AddFamilyMemberDto): Promise<string> {
    return this.commandBus.execute(new AddFamilyMemberCommand(familyId, userId, dto));
  }

  /**
   * Updates member details (Vital stats, contact info).
   * Triggers 'MarkDeceased' events if vital status changes.
   */
  async updateMember(
    familyId: string,
    userId: string,
    memberId: string,
    dto: UpdateFamilyMemberDto,
  ): Promise<void> {
    return this.commandBus.execute(new UpdateFamilyMemberCommand(familyId, userId, memberId, dto));
  }

  /**
   * Removes a node from the tree.
   * Strict validation ensures no orphaned edges remain.
   */
  async removeMember(familyId: string, userId: string, memberId: string): Promise<void> {
    return this.commandBus.execute(new RemoveFamilyMemberCommand(familyId, userId, memberId));
  }

  // --------------------------------------------------------------------------
  // READ OPERATIONS
  // --------------------------------------------------------------------------

  /**
   * Returns a flat list of all members in the tree.
   * Useful for dropdowns like "Select Guardian" or "Select Beneficiary".
   */
  async getMembers(familyId: string, userId: string): Promise<FamilyMemberResponseDto[]> {
    return this.queryBus.execute(new GetFamilyMembersQuery(familyId, userId));
  }

  /**
   * Gets detailed profile of a specific member.
   */
  async getMember(memberId: string, userId: string): Promise<FamilyMemberResponseDto> {
    return this.queryBus.execute(new GetFamilyMemberQuery(memberId, userId));
  }

  /**
   * CRITICAL: Runs the Section 29 Law of Succession analysis on the tree.
   * Returns a prioritized list of people who must be provided for in the Will.
   */
  async getPotentialHeirs(familyId: string, userId: string): Promise<PotentialHeirResponse[]> {
    return this.queryBus.execute(new FindPotentialHeirsQuery(familyId, userId));
  }
}
