import { BadRequestException, Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { v4 as uuidv4 } from 'uuid';

import { Guardianship } from '../../domain/entities/guardianship.entity';
import { FamilyMemberRepositoryInterface } from '../../domain/interfaces/family-member.repository.interface';
import { FamilyRepositoryInterface } from '../../domain/interfaces/family.repository.interface';
import { GuardianshipRepositoryInterface } from '../../domain/interfaces/guardianship.repository.interface';
import { GuardianEligibilityPolicy } from '../../domain/policies/guardian-eligibility.policy';
import { AssignGuardianDto } from '../dto/request/assign-guardian.dto';

export class AssignGuardianCommand {
  constructor(
    public readonly familyId: string,
    public readonly userId: string,
    public readonly dto: AssignGuardianDto,
  ) {}
}

@CommandHandler(AssignGuardianCommand)
export class AssignGuardianHandler implements ICommandHandler<AssignGuardianCommand> {
  constructor(
    @Inject('FamilyRepositoryInterface')
    private readonly familyRepository: FamilyRepositoryInterface,
    @Inject('FamilyMemberRepositoryInterface')
    private readonly memberRepository: FamilyMemberRepositoryInterface,
    @Inject('GuardianshipRepositoryInterface')
    private readonly guardianshipRepository: GuardianshipRepositoryInterface,
    private readonly eligibilityPolicy: GuardianEligibilityPolicy,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: AssignGuardianCommand): Promise<string> {
    const { familyId, userId, dto } = command;

    // 1. Access Control
    const family = await this.familyRepository.findById(familyId);
    if (!family || family.getOwnerId() !== userId) {
      throw new BadRequestException('Access denied.');
    }

    // 2. Load Participants
    const ward = await this.memberRepository.findById(dto.wardId);
    const guardian = await this.memberRepository.findById(dto.guardianId);

    if (!ward || !guardian) throw new NotFoundException('Ward or Guardian not found.');

    if (ward.getFamilyId() !== familyId || guardian.getFamilyId() !== familyId) {
      throw new BadRequestException('Members belong to different families.');
    }

    // 3. Policy Check (Age, Vital Status, Self-Guardianship)
    const policyResult = this.eligibilityPolicy.checkEligibility(guardian, ward);
    if (!policyResult.isEligible) {
      throw new BadRequestException(`Guardianship assignment failed: ${policyResult.error}`);
    }

    // 4. Ward DOB Validation (Required for expiry calculation)
    if (!ward.getDateOfBirth()) {
      throw new BadRequestException(
        'Ward must have a Date of Birth set to calculate legal guardianship expiry.',
      );
    }

    // 5. Create Entity
    const guardianshipId = uuidv4();
    const entity = Guardianship.create(
      guardianshipId,
      familyId,
      dto.guardianId,
      dto.wardId,
      dto.type,
      ward.getDateOfBirth()!, // Non-null assertion safe due to check above
      dto.appointedBy,
    );

    // 6. Persist
    const model = this.publisher.mergeObjectContext(entity);
    await this.guardianshipRepository.save(model);
    model.commit();

    return guardianshipId;
  }
}
