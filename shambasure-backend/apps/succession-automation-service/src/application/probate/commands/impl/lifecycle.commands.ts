import { ICommand } from '@nestjs/cqrs';

import {
  AutoGenerateFromReadinessDto,
  CreateApplicationDto,
  WithdrawApplicationDto,
} from '../dtos/lifecycle.dtos';

/**
 * Command: Create Application (Manual)
 */
export class CreateApplicationCommand implements ICommand {
  constructor(public readonly dto: CreateApplicationDto) {}
}

/**
 * Command: Auto-Generate from Readiness Assessment
 */
export class AutoGenerateApplicationCommand implements ICommand {
  constructor(public readonly dto: AutoGenerateFromReadinessDto) {}
}

/**
 * Command: Withdraw Application
 */
export class WithdrawApplicationCommand implements ICommand {
  constructor(public readonly dto: WithdrawApplicationDto) {}
}
