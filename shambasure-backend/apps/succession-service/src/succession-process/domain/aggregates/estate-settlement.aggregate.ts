import { AggregateRoot } from '@nestjs/cqrs';
import { EstateInventory } from '../entities/estate-inventory.entity';
import { ExecutorDuty } from '../entities/executor-duties.entity';
// Assuming CreditorClaim entity exists or reusing Debt for logic.
// Using generic interface for Claim to be safe if entity missing.
import { CreditorClaim } from '@prisma/client';

export class EstateSettlementAggregate extends AggregateRoot {
  private estateId: string;

  // The "books" of the estate
  private inventory: Map<string, EstateInventory> = new Map();
  private claims: Map<string, CreditorClaim> = new Map();
  private duties: Map<string, ExecutorDuty> = new Map();

  private constructor(estateId: string) {
    super();
    this.estateId = estateId;
  }

  static create(estateId: string): EstateSettlementAggregate {
    return new EstateSettlementAggregate(estateId);
  }

  static reconstitute(
    estateId: string,
    inventory: EstateInventory[],
    claims: CreditorClaim[],
    duties: ExecutorDuty[],
  ): EstateSettlementAggregate {
    const agg = new EstateSettlementAggregate(estateId);
    inventory.forEach((i) => agg.inventory.set(i.getId(), i));
    claims.forEach((c) => agg.claims.set(c.id, c));
    duties.forEach((d) => agg.duties.set(d.getId(), d));
    return agg;
  }

  // --------------------------------------------------------------------------
  // INVENTORY MANAGEMENT (Form P&A 5)
  // --------------------------------------------------------------------------

  addInventoryItem(item: EstateInventory): void {
    if (this.inventory.has(item.getId())) {
      throw new Error('Inventory item already exists.');
    }
    this.inventory.set(item.getId(), item);
  }

  verifyInventoryItem(itemId: string, verifier: string): void {
    const item = this.inventory.get(itemId);
    if (!item) throw new Error('Item not found.');
    item.verify(verifier);
  }

  /**
   * Calculates Gross Estate Value (for Court Fees).
   * Note: Simple summation, assumes single currency or handled externally.
   */
  calculateGrossValue(): number {
    return Array.from(this.inventory.values()).reduce(
      (sum, item) => sum + item.getValue().getAmount(),
      0,
    );
  }

  // --------------------------------------------------------------------------
  // CLAIMS MANAGEMENT (Form 103)
  // --------------------------------------------------------------------------

  // Logic to add/approve claims would go here.
  // calculateTotalLiabilities() ...

  // --------------------------------------------------------------------------
  // DUTY TRACKING
  // --------------------------------------------------------------------------

  completeDuty(dutyId: string, notes?: string): void {
    const duty = this.duties.get(dutyId);
    if (!duty) throw new Error('Duty not found.');
    duty.complete(new Date(), notes);
  }

  /**
   * Checks if all mandatory pre-distribution duties are done.
   * (e.g., Pay Debts, Collect Assets).
   */
  isReadyForDistribution(): boolean {
    const mandatoryTypes = ['FILE_INVENTORY', 'PAY_DEBTS', 'GAZETTE_NOTICE'];

    const pendingMandatory = Array.from(this.duties.values()).filter(
      (d) => mandatoryTypes.includes(d.getType()) && d.getStatus() !== 'COMPLETED',
    );

    return pendingMandatory.length === 0;
  }

  // Accessors
  getInventory(): EstateInventory[] {
    return Array.from(this.inventory.values());
  }
  getDuties(): ExecutorDuty[] {
    return Array.from(this.duties.values());
  }
}
