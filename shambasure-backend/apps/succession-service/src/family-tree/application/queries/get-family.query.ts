import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { FamilyRepositoryInterface } from '../../domain/interfaces/family.repository.interface';
import { FamilyResponseDto } from '../dto/response/family.response.dto';

export class GetFamilyQuery {
  constructor(public readonly userId: string) {}
}

@QueryHandler(GetFamilyQuery)
export class GetFamilyHandler implements IQueryHandler<GetFamilyQuery> {
  constructor(
    @Inject('FamilyRepositoryInterface')
    private readonly familyRepository: FamilyRepositoryInterface,
  ) {}

  async execute(query: GetFamilyQuery): Promise<FamilyResponseDto> {
    const { userId } = query;

    // 1. Find Family by Owner
    // Assuming 1:1 relationship for MVP
    const families = await this.familyRepository.findByOwnerId(userId);

    if (families.length === 0) {
      throw new NotFoundException('No family tree found for this user.');
    }

    const family = families[0];

    // 2. Map to DTO
    return plainToInstance(FamilyResponseDto, family, {
      excludeExtraneousValues: true,
    });
  }
}
