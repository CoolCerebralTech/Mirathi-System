import { DomainEvent } from '../../../shared/base/domain-event.base';
import { Will } from '../aggregates/will.aggregate';

export class WillCreatedEvent implements DomainEvent {
  public dateTimeOccurred: Date;
  public will: Will;

  constructor(will: Will) {
    this.will = will;
    this.dateTimeOccurred = new Date();
  }

  public getAggregateId(): string {
    return this.will.id.toString();
  }
}