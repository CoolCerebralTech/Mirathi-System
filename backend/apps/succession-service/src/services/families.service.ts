import { Injectable, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { Family, FamilyMember, RelationshipType } from '@shamba/database';
import { CreateFamilyRequestDto, AddFamilyMemberRequestDto } from '@shamba/common';
import { JwtPayload } from '@shamba/auth';
import { FamiliesRepository } from '../repositories/families.repository';

@Injectable()
export class FamiliesService {
  constructor(private readonly familiesRepository: FamiliesRepository) {}

  async create(creatorId: string, data: CreateFamilyRequestDto): Promise<Family> {
    return this.familiesRepository.create({
      name: data.name,
      creator: { connect: { id: creatorId } },
      members: {
        create: { userId: creatorId, role: RelationshipType.PARENT }, // Creator is the first parent
      },
    });
  }

  async findOne(familyId: string, currentUser: JwtPayload): Promise<Family & { members: FamilyMember[] }> {
    const family = await this.familiesRepository.findOneOrFail({ id: familyId });
    const isMember = family.members.some(m => m.userId === currentUser.sub);

    if (!isMember && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Access denied to this family.');
    }
    return family;
  }
  
  async addMember(familyId: string, data: AddFamilyMemberRequestDto, currentUser: JwtPayload): Promise<FamilyMember> {
      const family = await this.findOne(familyId, currentUser); // Re-uses auth check
      
      const isManager = family.members.find(m => m.userId === currentUser.sub)?.role === RelationshipType.PARENT;
      if(!isManager && currentUser.role !== 'ADMIN') {
          throw new ForbiddenException('Only a parent can add new members.');
      }
      
      const isAlreadyMember = family.members.some(m => m.userId === data.userId);
      if(isAlreadyMember) {
          throw new ConflictException('User is already a member of this family.');
      }

      return this.familiesRepository.addMember({ familyId, ...data });
  }

  // ... other methods like removeMember, updateMemberRole would follow a similar pattern ...
}