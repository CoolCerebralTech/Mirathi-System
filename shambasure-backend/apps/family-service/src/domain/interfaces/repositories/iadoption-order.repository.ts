import { AdoptionOrder } from '../../entities/adoption-order.entity';

export interface IAdoptionOrderRepository {
  /**
   * Finds an AdoptionOrder by its unique ID.
   */
  findById(id: string): Promise<AdoptionOrder | null>;

  /**
   * Finds an AdoptionOrder by its unique court order number.
   * This is a key legal identifier.
   */
  findByCourtOrderNumber(orderNumber: string): Promise<AdoptionOrder | null>;

  /**
   * Finds all adoption orders within a specific family.
   */
  findAllByFamilyId(familyId: string): Promise<AdoptionOrder[]>;

  /**
   * Finds all adoption orders where a specific person is involved,
   * either as the adoptee or the adopter.
   */
  findAllByPersonId(personId: string): Promise<AdoptionOrder[]>;

  /**
   * Saves a new or updated AdoptionOrder entity. This method handles both
   * creation and updates (upsert).
   * @param order The AdoptionOrder entity to save.
   * @param tx An optional transaction client.
   */
  save(order: AdoptionOrder, tx?: any): Promise<AdoptionOrder>;

  /**
   * Deletes an AdoptionOrder from the repository.
   */
  delete(id: string, tx?: any): Promise<void>;
}
