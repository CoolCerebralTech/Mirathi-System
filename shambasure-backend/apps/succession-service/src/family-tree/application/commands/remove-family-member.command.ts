import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import type { FamilyRepositoryInterface } from '../../domain/interfaces/family.repository.interface';
import type { FamilyMemberRepositoryInterface } from '../../domain/interfaces/family-member.repository.interface';
import type { RelationshipRepositoryInterface } from '../../domain/interfaces/relationship.repository.interface';

export class RemoveFamilyMemberCommand {
  constructor(
    public readonly familyId: string,
    public readonly userId: string,
    public readonly memberId: string,
  ) {}
}

@CommandHandler(RemoveFamilyMemberCommand)
export class RemoveFamilyMemberHandler implements ICommandHandler<RemoveFamilyMemberCommand> {
  constructor(
    @Inject('FamilyRepositoryInterface')
    private readonly familyRepository: FamilyRepositoryInterface,
    @Inject('FamilyMemberRepositoryInterface')
    private readonly memberRepository: FamilyMemberRepositoryInterface,
    @Inject('RelationshipRepositoryInterface')
    private readonly relationshipRepository: RelationshipRepositoryInterface,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: RemoveFamilyMemberCommand): Promise<void> {
    const { familyId, userId, memberId } = command;

    const family = await this.familyRepository.findById(familyId);
    if (!family || family.getOwnerId() !== userId) throw new BadRequestException('Access denied.');

    const member = await this.memberRepository.findById(memberId);
    if (!member) throw new NotFoundException('Member not found.');

    // Validate: Cannot delete Root User
    if (member.getUserId() === userId) {
      throw new BadRequestException('Cannot delete yourself. Archive the family tree instead.');
    }

    // Validate: Edges
    // We strictly enforce removing relationships first to avoid orphaned edges
    const outgoing = await this.relationshipRepository.findByFromMemberId(memberId);
    const incoming = await this.relationshipRepository.findByToMemberId(memberId);

    if (outgoing.length > 0 || incoming.length > 0) {
      throw new BadRequestException(
        'Cannot remove member. Please remove their relationships/links first.',
      );
    }

    const memberModel = this.publisher.mergeObjectContext(member);
    memberModel.remove('User requested deletion');

    await this.memberRepository.save(memberModel); // Saves soft delete state
    memberModel.commit();
  }
}
