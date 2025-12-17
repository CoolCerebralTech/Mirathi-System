import { ClassConstructor, plainToInstance } from 'class-transformer';

export abstract class BaseMapper<Domain, DTO> {
  abstract toDomain(raw: any): Domain;
  abstract toDTO(domain: Domain): DTO;

  // Implemented generally to avoid repetition
  toDomainList(rawList: any[]): Domain[] {
    return rawList.map((item) => this.toDomain(item));
  }

  toDTOList(domains: Domain[]): DTO[] {
    return domains.map((domain) => this.toDTO(domain));
  }

  protected mapToClass<T>(cls: ClassConstructor<T>, plain: any): T {
    return plainToInstance(cls, plain, {
      // CRITICAL UPDATE: Set to false unless we add @Expose() to all DTOs
      excludeExtraneousValues: false,
      exposeDefaultValues: true,
      enableImplicitConversion: true,
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
