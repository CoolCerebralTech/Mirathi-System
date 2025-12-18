import { Injectable } from '@nestjs/common';
import { CommandBus, CommandHandler, EventBus } from '@nestjs/cqrs';

import { Marriage } from '../../../../domain/entities/marriage.entity';
import type { IFamilyMemberRepository } from '../../../../domain/interfaces/repositories/ifamily-member.repository';
import type { IFamilyRepository } from '../../../../domain/interfaces/repositories/ifamily.repository';
import type { IMarriageRepository } from '../../../../domain/interfaces/repositories/imarriage.repository';
import { MarriageValidityPolicy } from '../../../../domain/policies/marriage-validity.policy';
import { Result } from '../../../common/base/result';
import { MarriageResponse } from '../../dto/response/marriage.response';
import { MarriageMapper } from '../../mappers/marriage.mapper';
import { RequestToDomainMapper } from '../../mappers/request-to-domain.mapper';
import { RegisterMarriageCommand } from '../impl/register-marriage.command';
import { BaseCommandHandler } from './base.command-handler';

@Injectable()
@CommandHandler(RegisterMarriageCommand)
export class RegisterMarriageHandler extends BaseCommandHandler<
  RegisterMarriageCommand,
  Result<MarriageResponse>
> {
  constructor(
    private readonly familyRepository: IFamilyRepository,
    private readonly memberRepository: IFamilyMemberRepository,
    private readonly marriageRepository: IMarriageRepository,
    private readonly marriageMapper: MarriageMapper,
    private readonly requestMapper: RequestToDomainMapper,
    commandBus: CommandBus,
    eventBus: EventBus,
  ) {
    super(commandBus, eventBus);
  }

  async execute(command: RegisterMarriageCommand): Promise<Result<MarriageResponse>> {
    try {
      const validation = this.validateCommand(command);
      if (validation.isFailure) return Result.fail(validation.error!);

      const requestErrors = this.requestMapper.validateRegisterMarriageRequest(command.data);
      if (requestErrors.length > 0) {
        return Result.fail(new Error(`Invalid request data: ${requestErrors.join(', ')}`));
      }

      // 1. Load Aggregates
      const family = await this.familyRepository.findById(command.familyId);
      if (!family) return Result.fail(new Error('Family not found'));

      const spouse1 = await this.memberRepository.findById(command.data.spouse1Id);
      const spouse2 = await this.memberRepository.findById(command.data.spouse2Id);
      if (!spouse1 || !spouse2) return Result.fail(new Error('One or both spouses not found'));

      // 2. Load History for Policy - FIXED: Using findAllBySpouseId instead of findBySpouseId
      const s1Marriages = await this.marriageRepository.findAllBySpouseId(spouse1.id);
      const s2Marriages = await this.marriageRepository.findAllBySpouseId(spouse2.id);

      // 3. EXECUTE POLICY
      const policyResult = MarriageValidityPolicy.validateNewUnion({
        spouse1,
        spouse2,
        spouse1ExistingMarriages: s1Marriages,
        spouse2ExistingMarriages: s2Marriages,
        proposedType: command.data.type,
      });

      if (!policyResult.isValid) {
        return Result.fail(new Error(`Marriage Illegal: ${policyResult.issues.join(', ')}`));
      }

      // 4. Create Marriage
      const createProps = this.requestMapper.toCreateMarriageProps(command.data);
      const marriage = Marriage.create(createProps);

      // 5. Update Family
      family.registerMarriage(marriage);

      // 6. Persist
      await this.marriageRepository.create(marriage);
      await this.familyRepository.update(family);

      // 7. Publish Events
      await this.publishDomainEvents(marriage);
      await this.publishDomainEvents(family);

      // 8. Response
      const responseDTO = this.marriageMapper.toDTO(marriage);
      const result = Result.ok(responseDTO);

      this.logSuccess(command, result, 'Marriage registered');
      return result;
    } catch (error) {
      this.handleError(error, command, 'RegisterMarriageHandler');
    }
  }
}
