// succession-service/src/succession-process/domain/events/duty-assigned.event.ts

import { ExecutorDutyType } from '../../../common/types/kenyan-law.types';

export class DutyAssignedEvent {
  constructor(
    public readonly dutyId: string,
    public readonly estateId: string,
    public readonly executorId: string, // The person responsible
    public readonly type: ExecutorDutyType,
    public readonly deadline: Date,
    public readonly timestamp: Date = new Date(),
  ) {}
}
