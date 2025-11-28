import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

// Commands
import { AssignBeneficiaryCommand } from '../commands/assign-beneficiary.command';
import { RemoveBeneficiaryCommand } from '../commands/remove-beneficiary.command';
import { UpdateBeneficiaryCommand } from '../commands/update-beneficiary.command';
// DTOs
import { AssignBeneficiaryDto } from '../dto/request/assign-beneficiary.dto';
import { BeneficiaryResponseDto } from '../dto/response/beneficiary.response.dto';
import {
  AssetDistributionSummaryResponse,
  GetAssetDistributionQuery,
} from '../queries/get-asset-distribution.query';
// Queries
import { GetBeneficiariesQuery } from '../queries/get-beneficiaries.query';
import { GetBeneficiaryQuery } from '../queries/get-beneficiary.query';

@Injectable()
export class BeneficiaryService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // --------------------------------------------------------------------------
  // WRITE OPERATIONS (Commands)
  // --------------------------------------------------------------------------

  /**
   * Assigns a beneficiary to an asset within a Will.
   * Enforces Aggregate logic (e.g., total percentage cannot exceed 100%).
   * @returns The ID of the new assignment.
   */
  async assignBeneficiary(
    willId: string,
    userId: string,
    dto: AssignBeneficiaryDto,
  ): Promise<string> {
    return this.commandBus.execute(new AssignBeneficiaryCommand(willId, userId, dto));
  }

  /**
   * Updates a specific bequest (e.g., changing share from 50% to 60%).
   * Triggers re-validation of the Asset's total allocation.
   */
  async updateBeneficiary(
    willId: string,
    userId: string,
    assignmentId: string,
    dto: Partial<AssignBeneficiaryDto>,
  ): Promise<void> {
    return this.commandBus.execute(new UpdateBeneficiaryCommand(willId, userId, assignmentId, dto));
  }

  /**
   * Removes a beneficiary assignment from the Will.
   */
  async removeBeneficiary(willId: string, userId: string, assignmentId: string): Promise<void> {
    return this.commandBus.execute(new RemoveBeneficiaryCommand(willId, userId, assignmentId));
  }

  // --------------------------------------------------------------------------
  // READ OPERATIONS (Queries)
  // --------------------------------------------------------------------------

  /**
   * Lists all beneficiaries for a specific Will.
   * Restricted to the Testator.
   */
  async getBeneficiaries(willId: string, userId: string): Promise<BeneficiaryResponseDto[]> {
    return this.queryBus.execute(new GetBeneficiariesQuery(willId, userId));
  }

  /**
   * Retrieves details of a single assignment.
   */
  async getBeneficiary(assignmentId: string, userId: string): Promise<BeneficiaryResponseDto> {
    return this.queryBus.execute(new GetBeneficiaryQuery(assignmentId, userId));
  }

  /**
   * Returns statistical data about how a specific Asset is distributed.
   * Used for frontend visualizations (e.g., Pie Chart of Land Share).
   */
  async getAssetDistribution(
    assetId: string,
    userId: string,
  ): Promise<AssetDistributionSummaryResponse> {
    return this.queryBus.execute(new GetAssetDistributionQuery(assetId, userId));
  }
}
