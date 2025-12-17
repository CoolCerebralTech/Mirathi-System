// application/family/commands/base.command.ts
import { ICommand } from '../../common/interfaces/use-case.interface';

export abstract class BaseCommand implements ICommand {
  abstract readonly commandId: string;
  abstract readonly timestamp: Date;
  abstract readonly correlationId?: string;
  abstract readonly userId: string;
}
