import { AggregateRoot } from '@nestjs/cqrs';
import { ExecutorDutyType } from '../../../common/types/kenyan-law.types';
import { DutyAssignedEvent } from '../events/duty-assigned.event';
import { DutyCompletedEvent } from '../events/duty-completed.event';
import { DutyOverdueEvent } from '../events/duty-overdue.event';

export type DutyStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'WAIVED';

export class ExecutorDuty extends AggregateRoot {
  private id: string;
  private estateId: string;
  private executorId: string; // The specific executor assigned (if split duties)

  // Task Details
  private type: ExecutorDutyType;
  private description: string;
  private stepOrder: number; // 1, 2, 3... sequence

  // Timing
  private deadline: Date;
  private completedAt: Date | null;

  // State
  private status: DutyStatus;
  private notes: string | null;

  private createdAt: Date;
  private updatedAt: Date;

  private constructor(
    id: string,
    estateId: string,
    executorId: string,
    type: ExecutorDutyType,
    description: string,
    stepOrder: number,
    deadline: Date,
  ) {
    super();
    this.id = id;
    this.estateId = estateId;
    this.executorId = executorId;
    this.type = type;
    this.description = description;
    this.stepOrder = stepOrder;
    this.deadline = deadline;

    this.status = 'PENDING';
    this.completedAt = null;
    this.notes = null;

    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // FACTORY
  // --------------------------------------------------------------------------

  static assign(
    id: string,
    estateId: string,
    executorId: string,
    type: ExecutorDutyType,
    description: string,
    stepOrder: number,
    deadline: Date,
  ): ExecutorDuty {
    const duty = new ExecutorDuty(id, estateId, executorId, type, description, stepOrder, deadline);

    duty.apply(new DutyAssignedEvent(id, estateId, executorId, type, deadline));

    return duty;
  }

  static reconstitute(props: any): ExecutorDuty {
    const duty = new ExecutorDuty(
      props.id,
      props.estateId,
      props.executorId || 'SYSTEM', // Fallback if generic
      props.stepType as ExecutorDutyType, // Mapping schema string to enum
      props.description,
      props.stepOrder,
      new Date(props.dueDate),
    );

    duty.status = props.status || (props.completed ? 'COMPLETED' : 'PENDING');
    duty.completedAt = props.completedAt ? new Date(props.completedAt) : null;
    duty.createdAt = new Date(props.createdAt);
    duty.updatedAt = new Date(props.updatedAt);

    // Check overdue on load? Usually done by a service/cron, but state can reflect it.
    if (duty.status === 'PENDING' && new Date() > duty.deadline) {
      duty.status = 'OVERDUE';
    }

    return duty;
  }

  // --------------------------------------------------------------------------
  // BUSINESS LOGIC
  // --------------------------------------------------------------------------

  /**
   * Mark the duty as done.
   */
  complete(date: Date = new Date(), notes?: string): void {
    if (this.status === 'COMPLETED') return;

    this.status = 'COMPLETED';
    this.completedAt = date;
    if (notes) this.notes = notes;
    this.updatedAt = new Date();

    this.apply(new DutyCompletedEvent(this.id, this.estateId, date));
  }

  /**
   * System check to flag overdue items.
   */
  checkOverdue(): boolean {
    if (this.status === 'COMPLETED' || this.status === 'WAIVED') return false;

    if (new Date() > this.deadline) {
      const wasPending = this.status === 'PENDING' || this.status === 'IN_PROGRESS';
      this.status = 'OVERDUE';
      this.updatedAt = new Date();

      if (wasPending) {
        const daysLate = Math.floor((Date.now() - this.deadline.getTime()) / (1000 * 60 * 60 * 24));
        this.apply(new DutyOverdueEvent(this.id, this.estateId, this.executorId, daysLate));
      }
      return true;
    }
    return false;
  }

  /**
   * Waive a duty (e.g., if court grants exception).
   */
  waive(reason: string): void {
    this.status = 'WAIVED';
    this.notes = `Waived: ${reason}`;
    this.updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // GETTERS
  // --------------------------------------------------------------------------

  getId() {
    return this.id;
  }
  getType() {
    return this.type;
  }
  getStatus() {
    return this.status;
  }
  getDeadline() {
    return this.deadline;
  }
  getStepOrder() {
    return this.stepOrder;
  }
}
