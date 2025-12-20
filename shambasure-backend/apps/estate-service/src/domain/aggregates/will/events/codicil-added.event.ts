import { DomainEvent } from '../../../shared/base/domain-event.base';
import { Will } from '../aggregates/will.aggregate';
import { Codicil } from '../entities/codicil.entity';

export class CodicilAddedEvent implements DomainEvent {
  public dateTimeOccurred: Date;
  public will: Will;
  public codicil: Codicil;

  constructor(will: Will, codicil: Codicil) {
    this.will = will;
    this.codicil = codicil;
    this.dateTimeOccurred = new Date();
  }

  public getAggregateId(): string {
    return this.will.id.toString();
  }
}