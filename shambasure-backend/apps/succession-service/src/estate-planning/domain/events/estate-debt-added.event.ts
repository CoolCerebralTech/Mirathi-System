// estate-debt-added.event.ts
import { IEvent } from '@nestjs/cqrs';
import { DebtType } from '@prisma/client';

import { AssetValue } from '../value-objects/asset-value.vo';

/**
 * Event emitted when a debt is added to an estate aggregate
 * Different from DebtAddedEvent which is for individual debt creation
 * @class EstateDebtAddedEvent
 * @implements {IEvent}
 */
export class EstateDebtAddedEvent implements IEvent {
  constructor(
    public readonly estateId: string,
    public readonly debtId: string,
    public readonly debtType: DebtType,
    public readonly outstandingBalance: AssetValue,
    public readonly addedAt: Date,
  ) {}
}
