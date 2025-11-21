import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { Inject, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CreateFamilyDto } from '../dto/request/create-family.dto';
import type { FamilyRepositoryInterface } from '../../domain/interfaces/family.repository.interface';
import type { FamilyMemberRepositoryInterface } from '../../domain/interfaces/family-member.repository.interface';
import { Family } from '../../domain/entities/family.entity';
import { FamilyMember } from '../../domain/entities/family-member.entity';
import { RelationshipType } from '@prisma/client';

export class CreateFamilyCommand {
  constructor(
    public readonly userId: string,
    public readonly userDetails: { firstName: string; lastName: string; email: string },
    public readonly dto: CreateFamilyDto,
  ) {}
}

@CommandHandler(CreateFamilyCommand)
export class CreateFamilyHandler implements ICommandHandler<CreateFamilyCommand> {
  constructor(
    @Inject('FamilyRepositoryInterface')
    private readonly familyRepository: FamilyRepositoryInterface,
    @Inject('FamilyMemberRepositoryInterface')
    private readonly memberRepository: FamilyMemberRepositoryInterface,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: CreateFamilyCommand): Promise<string> {
    const { userId, userDetails, dto } = command;

    // 1. Check limit (One tree per user for MVP)
    const existing = await this.familyRepository.findByOwnerId(userId);
    if (existing.length > 0) {
      throw new BadRequestException('You already have a family tree created.');
    }

    // 2. Create Family Aggregate
    const familyId = uuidv4();
    const family = Family.create(familyId, userId, dto.name, dto.description);

    // 3. Create Root Member (The User)
    const rootMemberId = uuidv4();
    const rootMember = FamilyMember.create(
      rootMemberId,
      familyId,
      userDetails.firstName,
      userDetails.lastName,
      'OTHER', // Role relative to self is N/A, or we use a specific flag
      userId, // AddedBy
      {
        userId: userId, // Link to system account
        contactInfo: { email: userDetails.email },
      },
    );

    // 4. Save Transactionally (Conceptually)
    // In a real app, we'd wrap this in a unit of work.
    // Here we save sequentially but handle errors if needed.

    const familyModel = this.publisher.mergeObjectContext(family);
    const memberModel = this.publisher.mergeObjectContext(rootMember);

    await this.familyRepository.save(familyModel);
    await this.memberRepository.save(memberModel);

    familyModel.commit();
    memberModel.commit();

    return familyId;
  }
}
