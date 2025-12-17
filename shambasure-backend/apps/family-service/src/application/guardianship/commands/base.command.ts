// application/guardianship/commands/base.command.ts
export abstract class Command<T = any> {
  public readonly correlationId?: string;
  public readonly timestamp: Date;
  public readonly metadata?: Record<string, any>;

  constructor(
    props: T & {
      correlationId?: string;
      timestamp?: Date;
      metadata?: Record<string, any>;
    },
  ) {
    Object.assign(this, props);
    this.timestamp = props.timestamp || new Date();
  }

  abstract getCommandName(): string;
}
