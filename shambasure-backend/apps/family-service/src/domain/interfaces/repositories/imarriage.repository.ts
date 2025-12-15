// domain/interfaces/repositories/imarriage.repository.ts
import { Marriage } from '../../entities/marriage.entity';

export interface IMarriageRepository {
  save(marriage: Marriage): Promise<void>;

  findById(id: string): Promise<Marriage | null>;

  /**
   * Finds all marriages associated with a specific family.
   */
  findByFamilyId(familyId: string): Promise<Marriage[]>;

  /**
   * Finds active marriages for a specific person.
   * Used to prevent Bigamy (e.g., blocking a new Civil Marriage if one exists).
   */
  findActiveBySpouseId(spouseId: string): Promise<Marriage[]>;

  /**
   * Finds a marriage by its Registration Number.
   */
  findByRegistrationNumber(regNumber: string): Promise<Marriage | null>;

  /**
   * Finds S.40 polygamous unions linked to a specific certificate.
   */
  findByS40Certificate(certificateNumber: string): Promise<Marriage[]>;
}
