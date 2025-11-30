import { IEvent } from '@nestjs/cqrs';

/**
 * Event emitted when a user activates a will in their estate plan.
 *
 * Triggers:
 * - Deactivate previous active will
 * - Update estate planning summary
 * - Notify executors/beneficiaries (optional)
 * - Compliance logging
 */
export class EstatePlanningWillActivatedEvent implements IEvent {
  constructor(
    public readonly estatePlanningId: string,
    public readonly userId: string,
    public readonly willId: string,
    public readonly activatedAt: Date,
  ) {}
}
