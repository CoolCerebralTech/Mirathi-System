// issue-grant-probate.command.ts
import { ICommand } from '@nestjs/cqrs';

import { IssueGrantProbateDto } from '../../dto/requests/issue-grant-probate.dto';

export class IssueGrantProbateCommand implements ICommand {
  constructor(
    public readonly willId: string,
    public readonly testatorId: string,
    public readonly data: IssueGrantProbateDto,
  ) {}
}
