import { ExecutorDutyType } from '../../../common/types/kenyan-law.types';

export class DutyAssignedEvent {
  constructor(
    public readonly dutyId: string,
    public readonly estateId: string,
    public readonly executorId: string,
    public readonly type: ExecutorDutyType,
    public readonly description: string,
    public readonly deadline: Date,
    public readonly stepOrder: number,
    public readonly legalBasis?: string,
  ) {}

  getEventType(): string {
    return 'DutyAssignedEvent';
  }

  getPayload() {
    return {
      dutyId: this.dutyId,
      estateId: this.estateId,
      executorId: this.executorId,
      type: this.type,
      description: this.description,
      deadline: this.deadline,
      stepOrder: this.stepOrder,
      legalBasis: this.legalBasis,
    };
  }
}
