import { DomainEvent } from '../../base/domain-event';

// domain/events/dependency-events/total-dependency-calculated.event.ts
export class TotalDependencyCalculatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    public readonly payload: {
      assessmentId: string;
      totalEstateValue: number;
      hotchpotTotal: number;
      totalGiftsValue: number;
      totalDependants: number;
      totalDependencyPercentage: number;
      calculations: any[];
    },
  ) {
    super(aggregateId, aggregateType, version);
  }

  protected getPayload(): Record<string, any> {
    return {
      assessmentId: this.payload.assessmentId,
      totalEstateValue: this.payload.totalEstateValue,
      hotchpotTotal: this.payload.hotchpotTotal,
      totalGiftsValue: this.payload.totalGiftsValue,
      totalDependants: this.payload.totalDependants,
      totalDependencyPercentage: this.payload.totalDependencyPercentage,
      calculations: this.payload.calculations,
    };
  }
}
