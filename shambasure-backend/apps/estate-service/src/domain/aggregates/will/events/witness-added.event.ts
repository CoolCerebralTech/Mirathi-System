import { DomainEvent } from '../../../shared/base/domain-event.base';
import { Will } from '../aggregates/will.aggregate';
import { WillWitness } from '../entities/will-witness.entity';

export class WitnessAddedEvent implements DomainEvent {
  public dateTimeOccurred: Date;
  public will: Will;
  public witness: WillWitness;

  constructor(will: Will, witness: WillWitness) {
    this.will = will;
    this.witness = witness;
    this.dateTimeOccurred = new Date();
  }

  public getAggregateId(): string {
    return this.will.id.toString();
  }
}