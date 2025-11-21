import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { UpdateFamilyMemberDto } from '../dto/request/update-family-member.dto';
import type { FamilyRepositoryInterface } from '../../domain/interfaces/family.repository.interface';
import type { FamilyMemberRepositoryInterface } from '../../domain/interfaces/family-member.repository.interface';

export class UpdateFamilyMemberCommand {
  constructor(
    public readonly familyId: string,
    public readonly userId: string,
    public readonly memberId: string,
    public readonly dto: UpdateFamilyMemberDto,
  ) {}
}

@CommandHandler(UpdateFamilyMemberCommand)
export class UpdateFamilyMemberHandler implements ICommandHandler<UpdateFamilyMemberCommand> {
  constructor(
    @Inject('FamilyRepositoryInterface')
    private readonly familyRepository: FamilyRepositoryInterface,
    @Inject('FamilyMemberRepositoryInterface')
    private readonly memberRepository: FamilyMemberRepositoryInterface,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: UpdateFamilyMemberCommand): Promise<void> {
    const { familyId, userId, memberId, dto } = command;

    // 1. Validation
    const family = await this.familyRepository.findById(familyId);
    if (!family || family.getOwnerId() !== userId) {
      throw new BadRequestException('Access denied.');
    }

    const member = await this.memberRepository.findById(memberId);
    if (!member || member.getFamilyId() !== familyId) {
      throw new NotFoundException(`Member ${memberId} not found.`);
    }

    // 2. Apply Updates
    const memberModel = this.publisher.mergeObjectContext(member);

    memberModel.updateDetails(
      dto.firstName,
      dto.lastName,
      {
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
      },
      dto.notes,
    );

    if (dto.dateOfBirth) {
      memberModel.setDateOfBirth(new Date(dto.dateOfBirth));
    }

    if (dto.isDeceased && dto.dateOfDeath) {
      memberModel.markAsDeceased(new Date(dto.dateOfDeath), userId);
    }

    // 3. Save
    await this.memberRepository.save(memberModel);
    memberModel.commit();
  }
}
