import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser, JwtAuthGuard, type JwtPayload } from '@shamba/auth';

import { Result } from '../../../application/common/result';
// --- Asset Commands ---
import {
  AddAssetCoOwnerCommand,
  AddAssetCommand,
  EncumberAssetCommand,
  UpdateAssetValueCommand,
} from '../../../application/estate/commands/impl/assets';
// Reusing App DTO if Request DTO mirrors it exactly, otherwise map. Assumption: Request DTO needed.
// *Correction*: I will use inline mapping or defined Request DTOs from previous step.

// --- Debt Commands ---
import {
  AddDebtCommand,
  DisputeDebtCommand,
  ExecuteS45WaterfallCommand,
  PayDebtCommand,
  ResolveDebtDisputeCommand,
  WriteOffDebtCommand,
} from '../../../application/estate/commands/impl/debt';
import {
  RejectDependantClaimCommand,
  SettleDependantClaimCommand,
  VerifyDependantClaimCommand,
} from '../../../application/estate/commands/impl/dependants/adjudicate-claim.command';
// --- Dependants & Gifts ---
import { FileDependantClaimCommand } from '../../../application/estate/commands/impl/dependants/file-dependant-claim.command';
import { AddDependantEvidenceCommand } from '../../../application/estate/commands/impl/dependants/manage-evidence.command';
import {
  ContestGiftCommand,
  ResolveGiftDisputeCommand,
} from '../../../application/estate/commands/impl/gifts/manage-gift-dispute.command';
import { RecordGiftInterVivosCommand } from '../../../application/estate/commands/impl/gifts/record-gift-inter-vivos.command';
// --- Lifecycle Commands ---
import {
  CloseEstateCommand,
  CreateEstateCommand,
  FreezeEstateCommand,
  UnfreezeEstateCommand,
} from '../../../application/estate/commands/impl/lifecycle/lifecycle.commands';
// --- Liquidation Commands ---
import {
  ApproveLiquidationCommand,
  CancelLiquidationCommand,
  InitiateLiquidationCommand,
  ReceiveLiquidationProceedsCommand,
  RecordLiquidationSaleCommand,
  SubmitLiquidationForApprovalCommand,
} from '../../../application/estate/commands/impl/liquidation/liquidation.commands';
// Note: Created simple DTOs for Cancel/Submit in previous steps? If not, will use Body with reason.

// --- Tax Commands ---
import {
  ApplyForTaxExemptionCommand,
  RecordTaxAssessmentCommand,
  RecordTaxPaymentCommand,
  UploadClearanceCertificateCommand,
} from '../../../application/estate/commands/impl/tax';
import {
  AddAssetCoOwnerRequestDto,
  AddAssetRequestDto,
  UpdateAssetValuationRequestDto,
} from '../dtos/request/assets';
import {
  AddDebtRequestDto,
  DisputeDebtRequestDto,
  ExecuteWaterfallRequestDto,
  PayDebtRequestDto,
  ResolveDebtDisputeRequestDto,
  WriteOffDebtRequestDto,
} from '../dtos/request/debts';
import {
  RejectClaimRequestDto,
  SettleClaimRequestDto,
  VerifyClaimRequestDto,
} from '../dtos/request/dependants/adjudicate-claim.request.dto';
import { FileDependantClaimRequestDto } from '../dtos/request/dependants/file-claim.request.dto';
import { AddDependantEvidenceRequestDto } from '../dtos/request/dependants/manage-evidence.request.dto';
import {
  ContestGiftRequestDto,
  RecordGiftRequestDto,
  ResolveGiftDisputeRequestDto,
} from '../dtos/request/gifts/gift.request.dto';
import {
  CloseEstateRequestDto,
  CreateEstateRequestDto,
  FreezeEstateRequestDto,
  UnfreezeEstateRequestDto,
} from '../dtos/request/lifecycle';
import {
  ApproveLiquidationRequestDto,
  InitiateLiquidationRequestDto,
  ReceiveLiquidationProceedsRequestDto,
  RecordLiquidationSaleRequestDto,
} from '../dtos/request/liquidation';
import {
  RecordTaxAssessmentRequestDto,
  RecordTaxPaymentRequestDto,
  UploadTaxClearanceRequestDto,
} from '../dtos/request/tax';

@ApiTags('Estate Commands')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('estates')
export class EstateCommandController {
  constructor(private readonly commandBus: CommandBus) {}

  private handleResult<T>(result: Result<T>): T {
    if (result.isFailure) {
      throw new HttpException(result.error?.message || 'Unknown Error', HttpStatus.BAD_REQUEST);
    }
    return result.getValue();
  }

  // ===========================================================================
  // 1. LIFECYCLE MANAGEMENT
  // ===========================================================================

  @Post()
  @ApiOperation({ summary: 'Create a new Estate Ledger' })
  async createEstate(@Body() dto: CreateEstateRequestDto, @CurrentUser() user: JwtPayload) {
    const command = new CreateEstateCommand({ ...dto, createdBy: user.sub }, { userId: user.sub });
    const result = await this.commandBus.execute(command);
    return this.handleResult(result);
  }

  @Patch(':id/freeze')
  @ApiOperation({ summary: 'Freeze estate due to dispute or court order' })
  async freezeEstate(
    @Param('id') id: string,
    @Body() dto: FreezeEstateRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const command = new FreezeEstateCommand(
      { ...dto, estateId: id, frozenBy: user.sub },
      { userId: user.sub },
    );
    const result = await this.commandBus.execute(command);
    return this.handleResult(result);
  }

  @Patch(':id/unfreeze')
  @ApiOperation({ summary: 'Unfreeze estate after resolution' })
  async unfreezeEstate(
    @Param('id') id: string,
    @Body() dto: UnfreezeEstateRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const command = new UnfreezeEstateCommand(
      { ...dto, estateId: id, unfrozenBy: user.sub },
      { userId: user.sub },
    );
    const result = await this.commandBus.execute(command);
    return this.handleResult(result);
  }

  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Finalize and close estate administration' })
  async closeEstate(
    @Param('id') id: string,
    @Body() dto: CloseEstateRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const command = new CloseEstateCommand(
      { ...dto, estateId: id, closedBy: user.sub },
      { userId: user.sub },
    );
    const result = await this.commandBus.execute(command);
    return this.handleResult(result);
  }

  // ===========================================================================
  // 2. ASSET INVENTORY
  // ===========================================================================

  @Post(':id/assets')
  @ApiOperation({ summary: 'Add a new asset (Polymorphic)' })
  async addAsset(
    @Param('id') id: string,
    @Body() dto: AddAssetRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const command = new AddAssetCommand(
      { ...dto, estateId: id, addedBy: user.sub },
      { userId: user.sub },
    );
    const result = await this.commandBus.execute(command);
    return this.handleResult(result);
  }

  @Patch(':id/assets/:assetId/valuation')
  @ApiOperation({ summary: 'Update asset value (Professional Valuation)' })
  async updateAssetValue(
    @Param('id') estateId: string,
    @Param('assetId') assetId: string,
    @Body() dto: UpdateAssetValuationRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const command = new UpdateAssetValueCommand(
      { ...dto, estateId, assetId, updatedBy: user.sub },
      { userId: user.sub },
    );
    const result = await this.commandBus.execute(command);
    return this.handleResult(result);
  }

  @Post(':id/assets/:assetId/co-owners')
  @ApiOperation({ summary: 'Add a co-owner (S.41 LSA)' })
  async addCoOwner(
    @Param('id') estateId: string,
    @Param('assetId') assetId: string,
    @Body() dto: AddAssetCoOwnerRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const command = new AddAssetCoOwnerCommand(
      { ...dto, estateId, assetId, addedBy: user.sub },
      { userId: user.sub },
    );
    const result = await this.commandBus.execute(command);
    return this.handleResult(result);
  }

  @Patch(':id/assets/:assetId/encumber')
  @ApiOperation({ summary: 'Mark asset as secured collateral' })
  async encumberAsset(
    @Param('id') estateId: string,
    @Param('assetId') assetId: string,
    @Body() dto: any, // Ideally defined EncumberAssetRequestDto
    @CurrentUser() user: JwtPayload,
  ) {
    const command = new EncumberAssetCommand(
      { ...dto, estateId, assetId, markedBy: user.sub },
      { userId: user.sub },
    );
    const result = await this.commandBus.execute(command);
    return this.handleResult(result);
  }

  // ===========================================================================
  // 3. DEBT MANAGEMENT (S.45 ENGINE)
  // ===========================================================================

  @Post(':id/debts')
  @ApiOperation({ summary: 'Record a new debt/liability' })
  async addDebt(
    @Param('id') id: string,
    @Body() dto: AddDebtRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const command = new AddDebtCommand(
      { ...dto, estateId: id, addedBy: user.sub },
      { userId: user.sub },
    );
    const result = await this.commandBus.execute(command);
    return this.handleResult(result);
  }

  @Post(':id/debts/:debtId/pay')
  @ApiOperation({ summary: 'Pay a specific debt (Enforces Priority)' })
  async payDebt(
    @Param('id') estateId: string,
    @Param('debtId') debtId: string,
    @Body() dto: PayDebtRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const command = new PayDebtCommand(
      { ...dto, estateId, debtId, paidBy: user.sub },
      { userId: user.sub },
    );
    const result = await this.commandBus.execute(command);
    return this.handleResult(result);
  }

  @Post(':id/debts/waterfall')
  @ApiOperation({ summary: 'Auto-allocate cash to highest priority debts' })
  async executeWaterfall(
    @Param('id') id: string,
    @Body() dto: ExecuteWaterfallRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const command = new ExecuteS45WaterfallCommand(
      { ...dto, estateId: id, authorizedBy: user.sub },
      { userId: user.sub },
    );
    const result = await this.commandBus.execute(command);
    return this.handleResult(result);
  }

  @Patch(':id/debts/:debtId/dispute')
  async disputeDebt(
    @Param('id') estateId: string,
    @Param('debtId') debtId: string,
    @Body() dto: DisputeDebtRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const command = new DisputeDebtCommand(
      { ...dto, estateId, debtId, disputedBy: user.sub },
      { userId: user.sub },
    );
    const result = await this.commandBus.execute(command);
    return this.handleResult(result);
  }

  @Patch(':id/debts/:debtId/resolve')
  async resolveDebtDispute(
    @Param('id') estateId: string,
    @Param('debtId') debtId: string,
    @Body() dto: ResolveDebtDisputeRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const command = new ResolveDebtDisputeCommand(
      { ...dto, estateId, debtId, resolvedBy: user.sub },
      { userId: user.sub },
    );
    const result = await this.commandBus.execute(command);
    return this.handleResult(result);
  }

  @Patch(':id/debts/:debtId/write-off')
  async writeOffDebt(
    @Param('id') estateId: string,
    @Param('debtId') debtId: string,
    @Body() dto: WriteOffDebtRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const command = new WriteOffDebtCommand(
      { ...dto, estateId, debtId, authorizedBy: user.sub },
      { userId: user.sub },
    );
    const result = await this.commandBus.execute(command);
    return this.handleResult(result);
  }

  // ===========================================================================
  // 4. LIQUIDATION
  // ===========================================================================

  @Post(':id/liquidation')
  @ApiOperation({ summary: 'Initiate asset liquidation' })
  async initiateLiquidation(
    @Param('id') id: string,
    @Body() dto: InitiateLiquidationRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const command = new InitiateLiquidationCommand(
      { ...dto, estateId: id, initiatedBy: user.sub },
      { userId: user.sub },
    );
    const result = await this.commandBus.execute(command);
    return this.handleResult(result);
  }

  @Patch(':id/liquidation/:liqId/submit')
  async submitLiquidation(
    @Param('id') estateId: string,
    @Param('liqId') liquidationId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const command = new SubmitLiquidationForApprovalCommand(
      { estateId, liquidationId, submittedBy: user.sub },
      { userId: user.sub },
    );
    const result = await this.commandBus.execute(command);
    return this.handleResult(result);
  }

  @Patch(':id/liquidation/:liqId/approve')
  async approveLiquidation(
    @Param('id') estateId: string,
    @Param('liqId') liquidationId: string,
    @Body() dto: ApproveLiquidationRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const command = new ApproveLiquidationCommand(
      { ...dto, estateId, liquidationId, approvedBy: user.sub },
      { userId: user.sub },
    );
    const result = await this.commandBus.execute(command);
    return this.handleResult(result);
  }

  @Post(':id/liquidation/:liqId/sale')
  @ApiOperation({ summary: 'Record sale details' })
  async recordSale(
    @Param('id') estateId: string,
    @Param('liqId') liquidationId: string,
    @Body() dto: RecordLiquidationSaleRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const command = new RecordLiquidationSaleCommand(
      { ...dto, estateId, liquidationId, recordedBy: user.sub },
      { userId: user.sub },
    );
    const result = await this.commandBus.execute(command);
    return this.handleResult(result);
  }

  @Post(':id/liquidation/:liqId/proceeds')
  @ApiOperation({ summary: 'Confirm receipt of cash' })
  async receiveProceeds(
    @Param('id') estateId: string,
    @Param('liqId') liquidationId: string,
    @Body() dto: ReceiveLiquidationProceedsRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const command = new ReceiveLiquidationProceedsCommand(
      { ...dto, estateId, liquidationId, receivedBy: user.sub },
      { userId: user.sub },
    );
    const result = await this.commandBus.execute(command);
    return this.handleResult(result);
  }

  @Patch(':id/liquidation/:liqId/cancel')
  async cancelLiquidation(
    @Param('id') estateId: string,
    @Param('liqId') liquidationId: string,
    @Body('reason') reason: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const command = new CancelLiquidationCommand(
      { estateId, liquidationId, reason, cancelledBy: user.sub },
      { userId: user.sub },
    );
    const result = await this.commandBus.execute(command);
    return this.handleResult(result);
  }

  // ===========================================================================
  // 5. TAX COMPLIANCE
  // ===========================================================================

  @Post(':id/tax/assessment')
  async recordTaxAssessment(
    @Param('id') id: string,
    @Body() dto: RecordTaxAssessmentRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const command = new RecordTaxAssessmentCommand(
      { ...dto, estateId: id, assessedBy: user.sub },
      { userId: user.sub },
    );
    const result = await this.commandBus.execute(command);
    return this.handleResult(result);
  }

  @Post(':id/tax/payment')
  async recordTaxPayment(
    @Param('id') id: string,
    @Body() dto: RecordTaxPaymentRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const command = new RecordTaxPaymentCommand(
      { ...dto, estateId: id, paidBy: user.sub },
      { userId: user.sub },
    );
    const result = await this.commandBus.execute(command);
    return this.handleResult(result);
  }

  @Post(':id/tax/clearance')
  async uploadTaxClearance(
    @Param('id') id: string,
    @Body() dto: UploadTaxClearanceRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const command = new UploadClearanceCertificateCommand(
      { ...dto, estateId: id, uploadedBy: user.sub },
      { userId: user.sub },
    );
    const result = await this.commandBus.execute(command);
    return this.handleResult(result);
  }

  @Post(':id/tax/exemption')
  async applyForExemption(
    @Param('id') id: string,
    @Body() dto: any, // Use ApplyForTaxExemptionRequestDto
    @CurrentUser() user: JwtPayload,
  ) {
    const command = new ApplyForTaxExemptionCommand(
      { ...dto, estateId: id, appliedBy: user.sub },
      { userId: user.sub },
    );
    const result = await this.commandBus.execute(command);
    return this.handleResult(result);
  }

  // ===========================================================================
  // 6. DEPENDANTS & GIFTS
  // ===========================================================================

  @Post(':id/dependants')
  async fileDependantClaim(
    @Param('id') id: string,
    @Body() dto: FileDependantClaimRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    // Note: DTO should contain deceasedId, usually from params or lookup
    // Assuming passed in body or merged
    const command = new FileDependantClaimCommand(
      { ...dto, estateId: id, deceasedId: dto['deceasedId'] || 'unknown', filedBy: user.sub },
      { userId: user.sub },
    );
    const result = await this.commandBus.execute(command);
    return this.handleResult(result);
  }

  @Post(':id/dependants/:depId/evidence')
  async addEvidence(
    @Param('id') estateId: string,
    @Param('depId') dependantId: string,
    @Body() dto: AddDependantEvidenceRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const command = new AddDependantEvidenceCommand(
      { ...dto, estateId, dependantId, uploadedBy: user.sub },
      { userId: user.sub },
    );
    const result = await this.commandBus.execute(command);
    return this.handleResult(result);
  }

  @Patch(':id/dependants/:depId/verify')
  async verifyClaim(
    @Param('id') estateId: string,
    @Param('depId') dependantId: string,
    @Body() dto: VerifyClaimRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const command = new VerifyDependantClaimCommand(
      { ...dto, estateId, dependantId, verifiedBy: user.sub },
      { userId: user.sub },
    );
    const result = await this.commandBus.execute(command);
    return this.handleResult(result);
  }

  @Patch(':id/dependants/:depId/reject')
  async rejectClaim(
    @Param('id') estateId: string,
    @Param('depId') dependantId: string,
    @Body() dto: RejectClaimRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const command = new RejectDependantClaimCommand(
      { ...dto, estateId, dependantId, rejectedBy: user.sub },
      { userId: user.sub },
    );
    const result = await this.commandBus.execute(command);
    return this.handleResult(result);
  }

  @Post(':id/dependants/:depId/settle')
  async settleClaim(
    @Param('id') estateId: string,
    @Param('depId') dependantId: string,
    @Body() dto: SettleClaimRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const command = new SettleDependantClaimCommand(
      { ...dto, estateId, dependantId, settledBy: user.sub },
      { userId: user.sub },
    );
    const result = await this.commandBus.execute(command);
    return this.handleResult(result);
  }

  @Post(':id/gifts')
  async recordGift(
    @Param('id') id: string,
    @Body() dto: RecordGiftRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const command = new RecordGiftInterVivosCommand(
      { ...dto, estateId: id, recordedBy: user.sub },
      { userId: user.sub },
    );
    const result = await this.commandBus.execute(command);
    return this.handleResult(result);
  }

  @Patch(':id/gifts/:giftId/contest')
  async contestGift(
    @Param('id') estateId: string,
    @Param('giftId') giftId: string,
    @Body() dto: ContestGiftRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const command = new ContestGiftCommand(
      { ...dto, estateId, giftId, contestedBy: user.sub },
      { userId: user.sub },
    );
    const result = await this.commandBus.execute(command);
    return this.handleResult(result);
  }

  @Patch(':id/gifts/:giftId/resolve')
  async resolveGiftDispute(
    @Param('id') estateId: string,
    @Param('giftId') giftId: string,
    @Body() dto: ResolveGiftDisputeRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const command = new ResolveGiftDisputeCommand(
      { ...dto, estateId, giftId, resolvedBy: user.sub },
      { userId: user.sub },
    );
    const result = await this.commandBus.execute(command);
    return this.handleResult(result);
  }
}
