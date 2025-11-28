import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

// Commands
import { AddDebtCommand } from '../commands/add-debt.command';
import { RecordDebtPaymentCommand } from '../commands/record-debt-payment.command';

// Queries
import { GetDebtsQuery } from '../queries/get-debts.query';
import { GetDebtQuery } from '../queries/get-debt.query';
import {
  GetLiabilitiesSummaryQuery,
  LiabilitiesSummaryResponse,
} from '../queries/get-liabilities-summary.query';

// DTOs
import { AddDebtDto } from '../dto/request/add-debt.dto';
import { RecordDebtPaymentDto } from '../dto/request/record-debt-payment.dto';
import { DebtResponseDto } from '../dto/response/debt.response.dto';

@Injectable()
export class DebtService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // --------------------------------------------------------------------------
  // WRITE OPERATIONS (Commands)
  // --------------------------------------------------------------------------

  /**
   * Records a new liability against the estate (e.g., Mortgage, Funeral Expense).
   * @returns The ID of the newly created debt record.
   */
  async addDebt(userId: string, dto: AddDebtDto): Promise<string> {
    return this.commandBus.execute(new AddDebtCommand(userId, dto));
  }

  /**
   * Records a payment towards a debt.
   * Automatically calculates remaining balance and updates status to PAID if cleared.
   * Enforces currency matching.
   */
  async recordPayment(debtId: string, userId: string, dto: RecordDebtPaymentDto): Promise<void> {
    return this.commandBus.execute(new RecordDebtPaymentCommand(debtId, userId, dto));
  }

  // --------------------------------------------------------------------------
  // READ OPERATIONS (Queries)
  // --------------------------------------------------------------------------

  /**
   * Retrieves a specific debt record.
   * Security: Restricted to the Owner (Testator) or Executor.
   */
  async getDebt(debtId: string, userId: string): Promise<DebtResponseDto> {
    return this.queryBus.execute(new GetDebtQuery(debtId, userId));
  }

  /**
   * Lists debts with optional filtering.
   * Filters:
   * - 'ALL': Everything history
   * - 'OUTSTANDING': Unpaid debts
   * - 'PRIORITY': Funeral & Taxes (Section 83 First Charge)
   */
  async getDebts(
    userId: string,
    filter: 'ALL' | 'OUTSTANDING' | 'PAID' | 'PRIORITY' = 'ALL',
  ): Promise<DebtResponseDto[]> {
    return this.queryBus.execute(new GetDebtsQuery(userId, filter));
  }

  /**
   * Returns a financial summary of total liabilities grouped by currency.
   * Critical for the "Net Estate Value" calculation on the dashboard.
   */
  async getLiabilitiesSummary(userId: string): Promise<LiabilitiesSummaryResponse> {
    return this.queryBus.execute(new GetLiabilitiesSummaryQuery(userId));
  }
}
