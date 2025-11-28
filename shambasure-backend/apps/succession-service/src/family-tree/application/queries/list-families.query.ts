import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { FamilyRepositoryInterface } from '../../domain/interfaces/family.repository.interface';
import { FamilyResponseDto } from '../dto/response/family.response.dto';

export class ListFamiliesQuery {
  constructor(public readonly userId: string) {}
}

@QueryHandler(ListFamiliesQuery)
export class ListFamiliesHandler implements IQueryHandler<ListFamiliesQuery> {
  constructor(
    @Inject('FamilyRepositoryInterface')
    private readonly familyRepository: FamilyRepositoryInterface,
  ) {}

  async execute(query: ListFamiliesQuery): Promise<FamilyResponseDto[]> {
    const { userId } = query;

    const families = await this.familyRepository.findByOwnerId(userId);

    return families.map((f) =>
      plainToInstance(FamilyResponseDto, f, { excludeExtraneousValues: true }),
    );
  }
}
