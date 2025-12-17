// application/family/mappers/base.mapper.ts
import { ClassConstructor, plainToInstance } from 'class-transformer';

export abstract class BaseMapper<Domain, DTO> {
  abstract toDomain(dto: any): Domain;
  abstract toDTO(domain: Domain): DTO;
  abstract toDomainList(dtos: any[]): Domain[];
  abstract toDTOList(domains: Domain[]): DTO[];

  protected mapToClass<T>(cls: ClassConstructor<T>, plain: any): T {
    return plainToInstance(cls, plain, {
      excludeExtraneousValues: true,
      exposeDefaultValues: true,
    });
  }

  protected sanitizeObject(obj: any): any {
    if (!obj) return obj;

    // Remove undefined values but keep null for intentional nulls
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
}
