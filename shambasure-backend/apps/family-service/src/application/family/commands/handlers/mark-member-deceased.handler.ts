import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { IEventPublisher } from '../../../../common/interfaces/use-case.interface';
import { Family } from '../../../../domain/aggregates/family.aggregate';
import { FamilyMember } from '../../../../domain/entities/family-member.entity';
import { InvalidFamilyMemberException } from '../../../../domain/exceptions/family.exception';
import { IFamilyMemberRepositoryPort } from '../../ports/outbound/family-member-repository.port';
import { IFamilyRepositoryPort } from '../../ports/outbound/family-repository.port';
import {
  MarkMemberDeceasedCommand,
  MarkMemberDeceasedCommandResult,
} from '../impl/mark-member-deceased.command';

@Injectable()
@CommandHandler(MarkMemberDeceasedCommand)
export class MarkMemberDeceasedHandler implements ICommandHandler<
  MarkMemberDeceasedCommand,
  MarkMemberDeceasedCommandResult
> {
  constructor(
    private readonly familyRepository: IFamilyRepositoryPort,
    private readonly familyMemberRepository: IFamilyMemberRepositoryPort,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(command: MarkMemberDeceasedCommand): Promise<MarkMemberDeceasedCommandResult> {
    const warnings: string[] = [];

    try {
      // 1. Validate command
      command.validate();

      // 2. Get the family and member
      const family = await this.familyRepository.findById(command.familyId);
      if (!family) {
        throw new Error(`Family with ID ${command.familyId} not found`);
      }

      const member = await this.familyMemberRepository.findById(command.memberId);
      if (!member) {
        throw new Error(`Family member with ID ${command.memberId} not found`);
      }

      // 3. Verify member belongs to the family
      if (member.familyId !== command.familyId) {
        throw new Error(`Member ${command.memberId} does not belong to family ${command.familyId}`);
      }

      // 4. Check if member is already deceased
      if (member.isDeceased) {
        throw new Error(`Member ${command.memberId} is already marked as deceased`);
      }

      // 5. Check if member has verified identity (important for inheritance)
      if (!member.isIdentityVerified) {
        warnings.push(
          'Member marked deceased without verified identity. May affect inheritance claims.',
        );
      }

      // 6. Mark member as deceased
      member.markAsDeceased({
        dateOfDeath: command.dateOfDeath,
        placeOfDeath: command.placeOfDeath,
        deathCertificateNumber: command.deathCertificateNumber,
        causeOfDeath: command.causeOfDeath,
        issuingAuthority: command.issuingAuthority,
      });

      // 7. Update family counts
      family.recordMemberDeath(
        member.id,
        command.dateOfDeath,
        command.deathCertificateNumber,
        command.placeOfDeath,
      );

      // 8. Save changes
      const updatedMember = await this.familyMemberRepository.save(member);
      await this.familyRepository.save(family);

      // 9. Publish domain events
      const memberEvents = updatedMember.getDomainEvents();
      const familyEvents = family.getDomainEvents();
      const allEvents = [...memberEvents, ...familyEvents];

      if (allEvents.length > 0) {
        await this.eventPublisher.publishAll(allEvents);
        updatedMember.clearDomainEvents();
        family.clearDomainEvents();
      }

      // 10. Return result
      return new MarkMemberDeceasedCommandResult(
        updatedMember.id,
        family.id,
        command.dateOfDeath,
        command.deathCertificateNumber,
        updatedMember.currentAge,
        new Date(),
        command.recordedBy,
        warnings,
      );
    } catch (error) {
      if (error instanceof InvalidFamilyMemberException) {
        throw new Error(`Failed to mark member as deceased: ${error.message}`);
      }
      throw error;
    }
  }
}
