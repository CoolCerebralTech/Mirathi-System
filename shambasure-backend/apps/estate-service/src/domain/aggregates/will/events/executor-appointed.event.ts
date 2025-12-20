import { DomainEvent } from '../../../shared/base/domain-event.base';
import { Will } from '../will.aggregate';
import { TestamentaryExecutor } from '../entities/testamentary-executor.entity';

export class ExecutorAppointedEvent implements DomainEvent {
  public dateTimeOccurred: Date;
  public will: Will;
  public executor: TestamentaryExecutor;

  constructor(will: Will, executor: TestamentaryExecutor) {
    this.will = will;
    this.executor = executor;
    this.dateTimeOccurred = new Date();
  }

  public getAggregateId(): string {
    return this.will.id.toString();
  }
}