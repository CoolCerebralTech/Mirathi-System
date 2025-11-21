// estate-solvency-checked.event.ts
import { IEvent } from '@nestjs/cqrs';
import { AssetValue } from '../value-objects/asset-value.vo';

/**
 * Event emitted when estate solvency analysis is performed
 * @class EstateSolvencyCheckedEvent
 * @implements {IEvent}
 */
export class EstateSolvencyCheckedEvent implements IEvent {
  constructor(
    public readonly estateId: string,
    public readonly isSolvent: boolean,
    public readonly netValue: AssetValue,
    public readonly shortfall?: AssetValue,
    public readonly checkedAt: Date = new Date(),
  ) {}
}
