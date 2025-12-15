// domain/interfaces/repositories/ipolygamous-house.repository.ts
import { PolygamousHouse } from '../../entities/polygamous-house.entity';

export interface IPolygamousHouseRepository {
  save(house: PolygamousHouse): Promise<void>;

  findById(id: string): Promise<PolygamousHouse | null>;

  /**
   * Finds all houses in a family, ordered by house number.
   */
  findByFamilyId(familyId: string): Promise<PolygamousHouse[]>;

  /**
   * Finds the house led by a specific wife (Head).
   */
  findByHeadId(houseHeadId: string): Promise<PolygamousHouse | null>;
}
