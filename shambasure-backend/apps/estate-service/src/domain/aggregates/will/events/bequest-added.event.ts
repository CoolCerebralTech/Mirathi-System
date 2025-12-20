import { DomainEvent } from '../../../shared/base/domain-event.base';
import { Will } from '../aggregates/will.aggregate';
import { Bequest } from '../entities/bequest.entity';

export class BequestAddedEvent implements DomainEvent {
  public dateTimeOccurred: Date;
  public will: Will;
  public bequest: Bequest;

  constructor(will: Will, bequest: Bequest) {
    this.will = will;
    this.bequest = bequest;
    this.dateTimeOccurred = new Date();
  }

  public getAggregateId(): string {
    return this.will.id.toString();
  }
}