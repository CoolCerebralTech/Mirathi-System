// will.service.ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { LegalCapacityStatus, RevocationMethod, WillStatus, WillType } from '@prisma/client';

import { ActivateWillDto } from '../dto/requests/activate-will.dto';
import { AddWitnessDto } from '../dto/requests/add-witness.dto';
import { AssessLegalCapacityDto } from '../dto/requests/assess-legal-capacity.dto';
import { ContestWillDto } from '../dto/requests/contest-will.dto';
// DTOs
import { CreateWillDto } from '../dto/requests/create-will.dto';
import { EnableWillEncryptionDto } from '../dto/requests/enable-will-encryption.dto';
import { IssueGrantProbateDto } from '../dto/requests/issue-grant-probate.dto';
import { MarkWillExecutedDto } from '../dto/requests/mark-will-executed.dto';
import { MarkWillWitnessedDto } from '../dto/requests/mark-will-witnessed.dto';
import { RecordTestatorSignatureDto } from '../dto/requests/record-testator-signature.dto';
import { RecordWitnessSignaturesDto } from '../dto/requests/record-witness-signatures.dto';
import { RevokeWillDto } from '../dto/requests/revoke-will.dto';
import { SetWillStorageDto } from '../dto/requests/set-will-storage.dto';
import { SupersedeWillDto } from '../dto/requests/supersede-will.dto';
import { UpdateWillDto } from '../dto/requests/update-will.dto';
import { WillSummaryResponseDto } from '../dto/responses/will-summary.response.dto';
// Responses
import { WillResponseDto } from '../dto/responses/will.response.dto';
import { ActivateWillCommand } from './commands/activate-will.command';
import { AddDependantProvisionCommand } from './commands/add-dependant-provision.command';
import { AddWillWitnessCommand } from './commands/add-will-witness.command';
import { AssessWillLegalCapacityCommand } from './commands/assess-will-legal-capacity.command';
import { ContestWillCommand } from './commands/contest-will.command';
// Commands
import { CreateWillCommand } from './commands/create-will.command';
import { EnableWillEncryptionCommand } from './commands/enable-will-encryption.command';
import { IssueGrantProbateCommand } from './commands/issue-grant-probate.command';
import { MarkWillExecutedCommand } from './commands/mark-will-executed.command';
import { MarkWillWitnessedCommand } from './commands/mark-will-witnessed.command';
import { ObtainCourtApprovalProvisionCommand } from './commands/obtain-court-approval-provision.command';
import { RecordTestatorSignatureCommand } from './commands/record-testator-signature.command';
import { RecordWitnessSignaturesCommand } from './commands/record-witness-signatures.command';
import { RemoveWillWitnessCommand } from './commands/remove-will-witness.command';
import { RevokeWillCommand } from './commands/revoke-will.command';
import { SetWillStorageCommand } from './commands/set-will-storage.command';
import { SupersedeWillCommand } from './commands/supersede-will.command';
import { UpdateWillCommand } from './commands/update-will.command';
import { GetActiveWillQuery } from './queries/get-active-will.query';
import { GetWillActivationReadinessQuery } from './queries/get-will-activation-readiness.query';
import { GetWillByStatusQuery } from './queries/get-will-by-status.query';
import { GetWillComplianceStatusQuery } from './queries/get-will-compliance-status.query';
import { GetWillStatisticsQuery } from './queries/get-will-statistics.query';
import { GetWillSummaryQuery } from './queries/get-will-summary.query';
// Queries
import { GetWillQuery } from './queries/get-will.query';
import { ListWillsQuery } from './queries/list-wills.query';
import { SearchWillsQuery } from './queries/search-wills.query';

@Injectable()
export class WillService {
  private readonly logger = new Logger(WillService.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // --------------------------------------------------------------------------
  // CREATE OPERATIONS
  // --------------------------------------------------------------------------

  /**
   * Creates a new will for a testator
   */
  async createWill(
    willId: string,
    testatorId: string,
    createWillDto: CreateWillDto,
  ): Promise<void> {
    this.logger.log(`Creating will ${willId} for testator ${testatorId}`);

    try {
      await this.commandBus.execute(new CreateWillCommand(willId, testatorId, createWillDto));
      this.logger.log(`Will ${willId} created successfully`);
    } catch (error) {
      this.logger.error(`Failed to create will ${willId}: ${error.message}`, error.stack);
      throw this.mapError(error);
    }
  }

  /**
   * Updates an existing will
   */
  async updateWill(
    willId: string,
    testatorId: string,
    updateWillDto: UpdateWillDto,
  ): Promise<void> {
    this.logger.log(`Updating will ${willId} for testator ${testatorId}`);

    try {
      await this.commandBus.execute(new UpdateWillCommand(willId, testatorId, updateWillDto));
      this.logger.log(`Will ${willId} updated successfully`);
    } catch (error) {
      this.logger.error(`Failed to update will ${willId}: ${error.message}`, error.stack);
      throw this.mapError(error);
    }
  }

  // --------------------------------------------------------------------------
  // LEGAL CAPACITY OPERATIONS
  // --------------------------------------------------------------------------

  /**
   * Assesses the legal capacity of the testator for a will
   */
  async assessLegalCapacity(
    willId: string,
    testatorId: string,
    assessLegalCapacityDto: AssessLegalCapacityDto,
  ): Promise<void> {
    this.logger.log(`Assessing legal capacity for will ${willId}`);

    try {
      await this.commandBus.execute(
        new AssessWillLegalCapacityCommand(willId, testatorId, assessLegalCapacityDto),
      );
      this.logger.log(`Legal capacity assessed for will ${willId}`);
    } catch (error) {
      this.logger.error(
        `Failed to assess legal capacity for will ${willId}: ${error.message}`,
        error.stack,
      );
      throw this.mapError(error);
    }
  }

  /**
   * Records the testator's signature on the will
   */
  async recordTestatorSignature(
    willId: string,
    testatorId: string,
    recordTestatorSignatureDto: RecordTestatorSignatureDto,
  ): Promise<void> {
    this.logger.log(`Recording testator signature for will ${willId}`);

    try {
      await this.commandBus.execute(
        new RecordTestatorSignatureCommand(willId, testatorId, recordTestatorSignatureDto),
      );
      this.logger.log(`Testator signature recorded for will ${willId}`);
    } catch (error) {
      this.logger.error(
        `Failed to record testator signature for will ${willId}: ${error.message}`,
        error.stack,
      );
      throw this.mapError(error);
    }
  }

  // --------------------------------------------------------------------------
  // WITNESS MANAGEMENT OPERATIONS
  // --------------------------------------------------------------------------

  /**
   * Adds a witness to a will
   */
  async addWitness(
    willId: string,
    testatorId: string,
    addWitnessDto: AddWitnessDto,
  ): Promise<void> {
    this.logger.log(`Adding witness to will ${willId}`);

    try {
      await this.commandBus.execute(new AddWillWitnessCommand(willId, testatorId, addWitnessDto));
      this.logger.log(`Witness added to will ${willId}`);
    } catch (error) {
      this.logger.error(`Failed to add witness to will ${willId}: ${error.message}`, error.stack);
      throw this.mapError(error);
    }
  }

  /**
   * Removes a witness from a will
   */
  async removeWitness(
    willId: string,
    testatorId: string,
    witnessId: string,
    reason?: string,
  ): Promise<void> {
    this.logger.log(`Removing witness ${witnessId} from will ${willId}`);

    try {
      await this.commandBus.execute(
        new RemoveWillWitnessCommand(willId, testatorId, witnessId, reason),
      );
      this.logger.log(`Witness ${witnessId} removed from will ${willId}`);
    } catch (error) {
      this.logger.error(
        `Failed to remove witness from will ${willId}: ${error.message}`,
        error.stack,
      );
      throw this.mapError(error);
    }
  }

  /**
   * Records witness signatures
   */
  async recordWitnessSignatures(
    willId: string,
    testatorId: string,
    recordWitnessSignaturesDto: RecordWitnessSignaturesDto,
  ): Promise<void> {
    this.logger.log(`Recording witness signatures for will ${willId}`);

    try {
      await this.commandBus.execute(
        new RecordWitnessSignaturesCommand(willId, testatorId, recordWitnessSignaturesDto),
      );
      this.logger.log(`Witness signatures recorded for will ${willId}`);
    } catch (error) {
      this.logger.error(
        `Failed to record witness signatures for will ${willId}: ${error.message}`,
        error.stack,
      );
      throw this.mapError(error);
    }
  }

  /**
   * Marks will as witnessed
   */
  async markAsWitnessed(
    willId: string,
    testatorId: string,
    markWillWitnessedDto: MarkWillWitnessedDto,
  ): Promise<void> {
    this.logger.log(`Marking will ${willId} as witnessed`);

    try {
      await this.commandBus.execute(
        new MarkWillWitnessedCommand(willId, testatorId, markWillWitnessedDto),
      );
      this.logger.log(`Will ${willId} marked as witnessed`);
    } catch (error) {
      this.logger.error(
        `Failed to mark will as witnessed ${willId}: ${error.message}`,
        error.stack,
      );
      throw this.mapError(error);
    }
  }

  // --------------------------------------------------------------------------
  // WILL LIFECYCLE OPERATIONS
  // --------------------------------------------------------------------------

  /**
   * Activates a will (makes it the current valid will)
   */
  async activateWill(
    willId: string,
    testatorId: string,
    activateWillDto: ActivateWillDto,
  ): Promise<void> {
    this.logger.log(`Activating will ${willId}`);

    try {
      await this.commandBus.execute(new ActivateWillCommand(willId, testatorId, activateWillDto));
      this.logger.log(`Will ${willId} activated successfully`);
    } catch (error) {
      this.logger.error(`Failed to activate will ${willId}: ${error.message}`, error.stack);
      throw this.mapError(error);
    }
  }

  /**
   * Revokes a will
   */
  async revokeWill(
    willId: string,
    testatorId: string,
    revokeWillDto: RevokeWillDto,
  ): Promise<void> {
    this.logger.log(`Revoking will ${willId}`);

    try {
      await this.commandBus.execute(new RevokeWillCommand(willId, testatorId, revokeWillDto));
      this.logger.log(`Will ${willId} revoked successfully`);
    } catch (error) {
      this.logger.error(`Failed to revoke will ${willId}: ${error.message}`, error.stack);
      throw this.mapError(error);
    }
  }

  /**
   * Supersedes a will with a new one
   */
  async supersedeWill(
    willId: string,
    testatorId: string,
    supersedeWillDto: SupersedeWillDto,
  ): Promise<void> {
    this.logger.log(`Superseding will ${willId} with ${supersedeWillDto.newWillId}`);

    try {
      await this.commandBus.execute(new SupersedeWillCommand(willId, testatorId, supersedeWillDto));
      this.logger.log(`Will ${willId} superseded by ${supersedeWillDto.newWillId}`);
    } catch (error) {
      this.logger.error(`Failed to supersede will ${willId}: ${error.message}`, error.stack);
      throw this.mapError(error);
    }
  }

  /**
   * Contests a will (marks as disputed)
   */
  async contestWill(
    willId: string,
    testatorId: string,
    contestWillDto: ContestWillDto,
  ): Promise<void> {
    this.logger.log(`Contesting will ${willId} with dispute ${contestWillDto.disputeId}`);

    try {
      await this.commandBus.execute(new ContestWillCommand(willId, testatorId, contestWillDto));
      this.logger.log(`Will ${willId} contested with dispute ${contestWillDto.disputeId}`);
    } catch (error) {
      this.logger.error(`Failed to contest will ${willId}: ${error.message}`, error.stack);
      throw this.mapError(error);
    }
  }

  /**
   * Marks will as executed (post-death)
   */
  async markWillExecuted(
    willId: string,
    testatorId: string,
    markWillExecutedDto: MarkWillExecutedDto,
  ): Promise<void> {
    this.logger.log(`Marking will ${willId} as executed`);

    try {
      await this.commandBus.execute(
        new MarkWillExecutedCommand(willId, testatorId, markWillExecutedDto),
      );
      this.logger.log(`Will ${willId} marked as executed`);
    } catch (error) {
      this.logger.error(`Failed to mark will as executed ${willId}: ${error.message}`, error.stack);
      throw this.mapError(error);
    }
  }

  /**
   * Issues grant of probate for a will
   */
  async issueGrantOfProbate(
    willId: string,
    testatorId: string,
    issueGrantProbateDto: IssueGrantProbateDto,
  ): Promise<void> {
    this.logger.log(`Issuing grant of probate for will ${willId}`);

    try {
      await this.commandBus.execute(
        new IssueGrantProbateCommand(willId, testatorId, issueGrantProbateDto),
      );
      this.logger.log(`Grant of probate issued for will ${willId}`);
    } catch (error) {
      this.logger.error(
        `Failed to issue grant of probate for will ${willId}: ${error.message}`,
        error.stack,
      );
      throw this.mapError(error);
    }
  }

  // --------------------------------------------------------------------------
  // DEPENDANT PROVISION OPERATIONS
  // --------------------------------------------------------------------------

  /**
   * Adds dependant provision to a will
   */
  async addDependantProvision(
    willId: string,
    testatorId: string,
    provisionDetails: string,
  ): Promise<void> {
    this.logger.log(`Adding dependant provision to will ${willId}`);

    try {
      await this.commandBus.execute(
        new AddDependantProvisionCommand(willId, testatorId, provisionDetails),
      );
      this.logger.log(`Dependant provision added to will ${willId}`);
    } catch (error) {
      this.logger.error(
        `Failed to add dependant provision to will ${willId}: ${error.message}`,
        error.stack,
      );
      throw this.mapError(error);
    }
  }

  /**
   * Obtains court approval for dependant provision
   */
  async obtainCourtApprovalForProvision(
    willId: string,
    testatorId: string,
    courtOrderNumber?: string,
  ): Promise<void> {
    this.logger.log(`Obtaining court approval for dependant provision in will ${willId}`);

    try {
      await this.commandBus.execute(
        new ObtainCourtApprovalProvisionCommand(willId, testatorId, courtOrderNumber),
      );
      this.logger.log(`Court approval obtained for dependant provision in will ${willId}`);
    } catch (error) {
      this.logger.error(
        `Failed to obtain court approval for dependant provision in will ${willId}: ${error.message}`,
        error.stack,
      );
      throw this.mapError(error);
    }
  }

  // --------------------------------------------------------------------------
  // STORAGE & SECURITY OPERATIONS
  // --------------------------------------------------------------------------

  /**
   * Sets storage location for a will
   */
  async setWillStorage(
    willId: string,
    testatorId: string,
    setWillStorageDto: SetWillStorageDto,
  ): Promise<void> {
    this.logger.log(`Setting storage location for will ${willId}`);

    try {
      await this.commandBus.execute(
        new SetWillStorageCommand(willId, testatorId, setWillStorageDto),
      );
      this.logger.log(`Storage location set for will ${willId}`);
    } catch (error) {
      this.logger.error(
        `Failed to set storage location for will ${willId}: ${error.message}`,
        error.stack,
      );
      throw this.mapError(error);
    }
  }

  /**
   * Enables encryption for a will
   */
  async enableWillEncryption(
    willId: string,
    testatorId: string,
    enableWillEncryptionDto: EnableWillEncryptionDto,
  ): Promise<void> {
    this.logger.log(`Enabling encryption for will ${willId}`);

    try {
      await this.commandBus.execute(
        new EnableWillEncryptionCommand(willId, testatorId, enableWillEncryptionDto),
      );
      this.logger.log(`Encryption enabled for will ${willId}`);
    } catch (error) {
      this.logger.error(
        `Failed to enable encryption for will ${willId}: ${error.message}`,
        error.stack,
      );
      throw this.mapError(error);
    }
  }

  // --------------------------------------------------------------------------
  // QUERY OPERATIONS
  // --------------------------------------------------------------------------

  /**
   * Gets a will by ID
   */
  async getWill(willId: string, testatorId: string): Promise<WillResponseDto> {
    this.logger.debug(`Getting will ${willId} for testator ${testatorId}`);

    try {
      const will = await this.queryBus.execute(new GetWillQuery(willId, testatorId));

      if (!will) {
        throw new NotFoundException(`Will ${willId} not found`);
      }

      return will;
    } catch (error) {
      this.logger.error(`Failed to get will ${willId}: ${error.message}`, error.stack);
      throw this.mapError(error);
    }
  }

  /**
   * Gets will summary
   */
  async getWillSummary(willId: string, testatorId: string): Promise<WillSummaryResponseDto> {
    this.logger.debug(`Getting will summary ${willId} for testator ${testatorId}`);

    try {
      const summary = await this.queryBus.execute(new GetWillSummaryQuery(willId, testatorId));

      if (!summary) {
        throw new NotFoundException(`Will ${willId} not found`);
      }

      return summary;
    } catch (error) {
      this.logger.error(`Failed to get will summary ${willId}: ${error.message}`, error.stack);
      throw this.mapError(error);
    }
  }

  /**
   * Lists wills for a testator
   */
  async listWills(
    testatorId: string,
    status?: WillStatus,
    type?: WillType,
    page: number = 1,
    limit: number = 20,
    includeRevoked: boolean = false,
  ): Promise<{
    wills: WillSummaryResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    this.logger.debug(`Listing wills for testator ${testatorId}, page ${page}, limit ${limit}`);

    try {
      const result = await this.queryBus.execute(
        new ListWillsQuery(testatorId, status, type, page, limit, includeRevoked),
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to list wills for testator ${testatorId}: ${error.message}`,
        error.stack,
      );
      throw this.mapError(error);
    }
  }

  /**
   * Gets active will for a testator
   */
  async getActiveWill(testatorId: string): Promise<WillResponseDto | null> {
    this.logger.debug(`Getting active will for testator ${testatorId}`);

    try {
      const activeWill = await this.queryBus.execute(new GetActiveWillQuery(testatorId));

      return activeWill;
    } catch (error) {
      this.logger.error(
        `Failed to get active will for testator ${testatorId}: ${error.message}`,
        error.stack,
      );
      throw this.mapError(error);
    }
  }

  /**
   * Gets wills by status
   */
  async getWillsByStatus(
    testatorId: string,
    status: WillStatus,
  ): Promise<WillSummaryResponseDto[]> {
    this.logger.debug(`Getting wills with status ${status} for testator ${testatorId}`);

    try {
      const wills = await this.queryBus.execute(new GetWillByStatusQuery(testatorId, status));

      return wills;
    } catch (error) {
      this.logger.error(
        `Failed to get wills by status for testator ${testatorId}: ${error.message}`,
        error.stack,
      );
      throw this.mapError(error);
    }
  }

  /**
   * Gets will compliance status
   */
  async getWillComplianceStatus(
    willId: string,
    testatorId: string,
  ): Promise<{
    willId: string;
    testatorId: string;
    isLegallyValid: boolean;
    meetsKenyanFormalities: boolean;
    legalCapacityAssessed: boolean;
    hasTestatorSignature: boolean;
    hasMinimumWitnesses: boolean;
    signatureWitnessed: boolean;
    isRevoked: boolean;
    missingRequirements: string[];
    complianceScore: number;
    status: 'COMPLIANT' | 'PARTIALLY_COMPLIANT' | 'NON_COMPLIANT';
  }> {
    this.logger.debug(`Getting compliance status for will ${willId}`);

    try {
      const complianceStatus = await this.queryBus.execute(
        new GetWillComplianceStatusQuery(willId, testatorId),
      );

      return complianceStatus;
    } catch (error) {
      this.logger.error(
        `Failed to get compliance status for will ${willId}: ${error.message}`,
        error.stack,
      );
      throw this.mapError(error);
    }
  }

  /**
   * Gets will activation readiness
   */
  async getWillActivationReadiness(
    willId: string,
    testatorId: string,
  ): Promise<{
    willId: string;
    testatorId: string;
    isReady: boolean;
    canBeActivated: boolean;
    currentStatus: string;
    requiredStatus: string;
    missingComponents: string[];
    validationIssues: string[];
    readinessScore: number;
    recommendations: string[];
  }> {
    this.logger.debug(`Getting activation readiness for will ${willId}`);

    try {
      const readiness = await this.queryBus.execute(
        new GetWillActivationReadinessQuery(willId, testatorId),
      );

      return readiness;
    } catch (error) {
      this.logger.error(
        `Failed to get activation readiness for will ${willId}: ${error.message}`,
        error.stack,
      );
      throw this.mapError(error);
    }
  }

  /**
   * Searches wills
   */
  async searchWills(
    testatorId: string,
    searchTerm?: string,
    statuses?: WillStatus[],
    types?: WillType[],
    startDate?: Date,
    endDate?: Date,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    wills: WillSummaryResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    this.logger.debug(`Searching wills for testator ${testatorId}, term: ${searchTerm}`);

    try {
      const result = await this.queryBus.execute(
        new SearchWillsQuery(
          testatorId,
          searchTerm,
          statuses,
          types,
          startDate,
          endDate,
          page,
          limit,
        ),
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to search wills for testator ${testatorId}: ${error.message}`,
        error.stack,
      );
      throw this.mapError(error);
    }
  }

  /**
   * Gets will statistics for a testator
   */
  async getWillStatistics(testatorId: string): Promise<{
    testatorId: string;
    totalWills: number;
    activeWills: number;
    draftWills: number;
    witnessedWills: number;
    revokedWills: number;
    completedWills: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    recentActivity: {
      lastCreated: Date | null;
      lastUpdated: Date | null;
      lastActivated: Date | null;
    };
    complianceStats: {
      withLegalCapacity: number;
      withTestatorSignature: number;
      withMinimumWitnesses: number;
      fullyCompliant: number;
    };
  }> {
    this.logger.debug(`Getting will statistics for testator ${testatorId}`);

    try {
      const statistics = await this.queryBus.execute(new GetWillStatisticsQuery(testatorId));

      return statistics;
    } catch (error) {
      this.logger.error(
        `Failed to get will statistics for testator ${testatorId}: ${error.message}`,
        error.stack,
      );
      throw this.mapError(error);
    }
  }

  // --------------------------------------------------------------------------
  // COMPLEX BUSINESS OPERATIONS
  // --------------------------------------------------------------------------

  /**
   * Creates and activates a will in one transaction-like operation
   * This is a complex operation that should be used carefully
   */
  async createAndActivateWill(
    willId: string,
    testatorId: string,
    createWillDto: CreateWillDto,
    activateWillDto: ActivateWillDto,
  ): Promise<void> {
    this.logger.log(`Creating and activating will ${willId} in single operation`);

    try {
      // Create the will
      await this.createWill(willId, testatorId, createWillDto);

      // Check activation readiness
      const readiness = await this.getWillActivationReadiness(willId, testatorId);

      if (!readiness.canBeActivated) {
        throw new BadRequestException(
          `Will cannot be activated: ${readiness.missingComponents.join(', ')}`,
        );
      }

      // Mark as witnessed (if not already)
      // Note: This assumes all witness requirements are met

      // Activate the will
      await this.activateWill(willId, testatorId, activateWillDto);

      this.logger.log(`Will ${willId} created and activated successfully`);
    } catch (error) {
      this.logger.error(
        `Failed to create and activate will ${willId}: ${error.message}`,
        error.stack,
      );
      throw this.mapError(error);
    }
  }

  /**
   * Validates will for Kenyan legal compliance
   */
  async validateWillForKenyanLaw(
    willId: string,
    testatorId: string,
  ): Promise<{
    isValid: boolean;
    issues: string[];
    recommendations: string[];
    legalRequirements: {
      section5: boolean; // Capacity
      section11: boolean; // Formalities
      section13: boolean; // Witnesses
      section26: boolean; // Dependant provision (if applicable)
      section16: boolean; // Not revoked
    };
  }> {
    this.logger.debug(`Validating will ${willId} for Kenyan law compliance`);

    try {
      const will = await this.getWill(willId, testatorId);
      const compliance = await this.getWillComplianceStatus(willId, testatorId);
      const readiness = await this.getWillActivationReadiness(willId, testatorId);

      const issues: string[] = [...readiness.missingComponents, ...readiness.validationIssues];
      const recommendations: string[] = [...readiness.recommendations];

      // Kenyan Law specific checks (Law of Succession Act)
      const legalRequirements = {
        section5: will.legalCapacity.isLegallyCompetent, // Capacity
        section11: will.formalities.meetsKenyanFormalities, // Formalities
        section13: will.witnesses.meetsWitnessRequirements, // Witnesses
        section26: will.dependant.hasDependantProvision
          ? will.dependant.courtApprovedProvision
          : true, // Dependant provision if applicable
        section16: !will.revocation.isRevoked, // Not revoked
      };

      // Add Kenyan law specific recommendations
      if (!legalRequirements.section5) {
        recommendations.push('Assess testator legal capacity (Section 5)');
      }
      if (!legalRequirements.section11) {
        recommendations.push('Ensure will meets formalities (Section 11)');
      }
      if (!legalRequirements.section13) {
        recommendations.push('Ensure sufficient eligible witnesses (Section 13)');
      }
      if (will.dependant.hasDependantProvision && !legalRequirements.section26) {
        recommendations.push('Obtain court approval for dependant provision (Section 26)');
      }

      const isValid =
        Object.values(legalRequirements).every((req) => req) && compliance.isLegallyValid;

      return {
        isValid,
        issues,
        recommendations,
        legalRequirements,
      };
    } catch (error) {
      this.logger.error(`Failed to validate will for Kenyan law: ${error.message}`, error.stack);
      throw this.mapError(error);
    }
  }

  /**
   * Creates a will from a template (simplified will creation)
   */
  async createWillFromTemplate(
    willId: string,
    testatorId: string,
    templateType: 'SIMPLE' | 'STANDARD' | 'COMPLEX',
    overrideDetails?: Partial<CreateWillDto>,
  ): Promise<void> {
    this.logger.log(`Creating will ${willId} from template ${templateType}`);

    try {
      // Base template
      const baseWill: CreateWillDto = {
        title: `${templateType} Will - ${new Date().toLocaleDateString()}`,
        type: WillType.STANDARD,
        requiresWitnesses: true,
      };

      // Apply template-specific defaults
      switch (templateType) {
        case 'SIMPLE':
          baseWill.funeralWishes = { burialLocation: 'Family plot' };
          baseWill.storageLocation = 'HOME_SAFE';
          break;
        case 'STANDARD':
          baseWill.funeralWishes = {
            burialLocation: 'Family plot',
            funeralType: 'Christian Burial',
            specificInstructions: 'Simple ceremony',
          };
          baseWill.storageLocation = 'BANK_VAULT';
          baseWill.hasDependantProvision = true;
          break;
        case 'COMPLEX':
          baseWill.funeralWishes = {
            burialLocation: 'Family cemetery',
            funeralType: 'Traditional Ceremony',
            specificInstructions: 'Full traditional rites',
            traditionalRites: ['Prayers', 'Eulogy', 'Burial rites'],
            clanInvolvement: 'Full clan participation',
          };
          baseWill.digitalAssetInstructions = {
            socialMediaHandling: 'Memorialize accounts',
            emailAccountHandling: 'Close after 1 year',
          };
          baseWill.storageLocation = 'LAWYER_OFFICE';
          baseWill.hasDependantProvision = true;
          break;
      }

      // Apply overrides
      const finalWillDto: CreateWillDto = {
        ...baseWill,
        ...overrideDetails,
      };

      await this.createWill(willId, testatorId, finalWillDto);

      this.logger.log(`Will ${willId} created from template ${templateType}`);
    } catch (error) {
      this.logger.error(`Failed to create will from template: ${error.message}`, error.stack);
      throw this.mapError(error);
    }
  }

  // --------------------------------------------------------------------------
  // HELPER METHODS
  // --------------------------------------------------------------------------

  /**
   * Maps domain errors to HTTP exceptions
   */
  private mapError(error: Error): Error {
    if (error.message.includes('not found') || error.message.includes('does not exist')) {
      return new NotFoundException(error.message);
    }

    if (error.message.includes('Unauthorized') || error.message.includes('does not own')) {
      return new NotFoundException('Will not found or access denied');
    }

    if (
      error.message.includes('cannot') ||
      error.message.includes('must') ||
      error.message.includes('required') ||
      error.message.includes('invalid')
    ) {
      return new BadRequestException(error.message);
    }

    if (
      error.message.includes('already exists') ||
      error.message.includes('already added') ||
      error.message.includes('duplicate')
    ) {
      return new ConflictException(error.message);
    }

    // Return original error if no mapping found
    return error;
  }

  /**
   * Generates a unique will ID based on testator and timestamp
   */
  generateWillId(testatorId: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `WILL-${testatorId.substring(0, 8)}-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Checks if a testator can create a new will
   */
  async canCreateWill(testatorId: string): Promise<{
    canCreate: boolean;
    reason?: string;
    existingWills: number;
    activeWillExists: boolean;
  }> {
    try {
      const statistics = await this.getWillStatistics(testatorId);
      const activeWill = await this.getActiveWill(testatorId);

      // Business rule: Maximum 10 wills per testator (including revoked)
      if (statistics.totalWills >= 10) {
        return {
          canCreate: false,
          reason: 'Maximum limit of 10 wills reached',
          existingWills: statistics.totalWills,
          activeWillExists: !!activeWill,
        };
      }

      // Business rule: Can only have one active will at a time
      // But creating a new will doesn't require deactivating the old one
      // The old one can be superseded or revoked separately

      return {
        canCreate: true,
        existingWills: statistics.totalWills,
        activeWillExists: !!activeWill,
      };
    } catch (error) {
      this.logger.error(`Failed to check will creation eligibility: ${error.message}`, error.stack);
      return {
        canCreate: false,
        reason: 'Unable to verify eligibility',
        existingWills: 0,
        activeWillExists: false,
      };
    }
  }
}
