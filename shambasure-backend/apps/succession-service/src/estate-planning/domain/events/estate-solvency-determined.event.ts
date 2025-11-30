import { IEvent } from '@nestjs/cqrs';

/**
 * Event emitted when estate solvency is determined.
 *
 * Legal Context:
 * - Sixth Schedule: Priority of debt payment
 * - Insolvent estates follow bankruptcy administration rules
 *
 * Triggers:
 * - If insolvent: Notify creditors of proportional distribution
 * - If solvent: Proceed with normal distribution
 * - Tax assessment
 * - Compliance reporting
 */
export class EstateSolvencyDeterminedEvent implements IEvent {
  constructor(
    public readonly estateId: string,
    public readonly isSolvent: boolean,
    public readonly totalAssets: number,
    public readonly totalLiabilities: number,
    public readonly netValue: number,
    public readonly shortfall: number, // 0 if solvent
  ) {}
}
