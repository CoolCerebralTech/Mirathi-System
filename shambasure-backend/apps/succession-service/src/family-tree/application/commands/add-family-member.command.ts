import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { AddFamilyMemberDto } from '../dto/request/add-family-member.dto';
import type { FamilyRepositoryInterface } from '../../domain/interfaces/family.repository.interface';
import type { FamilyMemberRepositoryInterface } from '../../domain/interfaces/family-member.repository.interface';
import type { RelationshipRepositoryInterface } from '../../domain/interfaces/relationship.repository.interface';
import { FamilyMember } from '../../domain/entities/family-member.entity';
import { Relationship } from '../../domain/entities/relationship.entity';
import { RelationshipIntegrityService } from '../../domain/services/relationship-integrity.service';

export class AddFamilyMemberCommand {
  constructor(
    public readonly familyId: string,
    public readonly userId: string, // Creator
    public readonly dto: AddFamilyMemberDto,
  ) {}
}

@CommandHandler(AddFamilyMemberCommand)
export class AddFamilyMemberHandler implements ICommandHandler<AddFamilyMemberCommand> {
  constructor(
    @Inject('FamilyRepositoryInterface')
    private readonly familyRepository: FamilyRepositoryInterface,
    @Inject('FamilyMemberRepositoryInterface')
    private readonly memberRepository: FamilyMemberRepositoryInterface,
    @Inject('RelationshipRepositoryInterface')
    private readonly relationshipRepository: RelationshipRepositoryInterface,
    private readonly integrityService: RelationshipIntegrityService,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: AddFamilyMemberCommand): Promise<string> {
    const { familyId, userId, dto } = command;

    // 1. Verify Family Ownership
    const family = await this.familyRepository.findById(familyId);
    if (!family) throw new NotFoundException(`Family ${familyId} not found.`);
    if (family.getOwnerId() !== userId) throw new BadRequestException('Access denied.');

    // 2. Find Root Member (The User)
    // We attach the new member relative to the User
    const rootMember = await this.memberRepository.findByUserId(userId);
    if (!rootMember || rootMember.getFamilyId() !== familyId) {
      throw new BadRequestException('Root family member not found for this user.');
    }

    // 3. Create New Member
    const newMemberId = uuidv4();
    const newMember = FamilyMember.create(
      newMemberId,
      familyId,
      dto.firstName,
      dto.lastName,
      dto.role, // Relationship to Creator
      userId,
      {
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        isDeceased: dto.isDeceased,
        contactInfo: {
          email: dto.email,
          phone: dto.phone,
          address: dto.address,
        },
      },
    );

    if (dto.isDeceased && dto.dateOfDeath) {
      newMember.markAsDeceased(new Date(dto.dateOfDeath), userId);
    }

    // 4. Determine Relationship Direction based on Role
    // e.g., If I add "FATHER", Relationship is NewMember -> PARENT -> Me
    // e.g., If I add "CHILD", Relationship is Me -> PARENT -> NewMember

    let fromId: string;
    let toId: string;
    let relType: any; // RelationshipType

    switch (dto.role) {
      case 'PARENT': // New Member is Parent of Root
        fromId = newMemberId;
        toId = rootMember.getId();
        relType = 'PARENT';
        break;
      case 'CHILD': // Root is Parent of New Member
        fromId = rootMember.getId();
        toId = newMemberId;
        relType = 'PARENT'; // Use PARENT type for the edge
        break;
      case 'SIBLING': // Root is Sibling of New Member
        fromId = rootMember.getId();
        toId = newMemberId;
        relType = 'SIBLING';
        break;
      case 'SPOUSE': // Not handled here, requires Marriage Command
        // We can create member, but Marriage Entity handles the link
        // For now, we allow creating the node, but warn about link
        relType = null;
        break;
      default:
        // For uncles/aunts etc, we ideally find the grandparent path.
        // MVP: Just create the node, link manually later or assume simple edge if schema supports 'AUNT_UNCLE' edge
        // Our schema RelationshipType has 'AUNT_UNCLE', so we can link directly for visual simplicity
        fromId = newMemberId;
        toId = rootMember.getId();
        relType = dto.role;
    }

    // 5. Persist Member
    const memberModel = this.publisher.mergeObjectContext(newMember);
    await this.memberRepository.save(memberModel);

    // 6. Persist Relationship (if inferred)
    if (relType) {
      // Use Integrity Service to validate this implicit link
      // Note: We save member first so Integrity Service can find it in DB check
      await this.integrityService.validateNewRelationship(familyId, fromId!, toId!, relType);

      const relationship = Relationship.create(uuidv4(), familyId, fromId!, toId!, relType);
      const relModel = this.publisher.mergeObjectContext(relationship);
      await this.relationshipRepository.save(relModel);
      relModel.commit();
    }

    memberModel.commit();
    return newMemberId;
  }
}
