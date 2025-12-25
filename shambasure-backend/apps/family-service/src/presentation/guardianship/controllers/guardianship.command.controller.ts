import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser, JwtAuthGuard, type JwtPayload, Roles, RolesGuard } from '@shamba/auth';

// Common
import { Result } from '../../../application/common/result';
import { ActivateGuardianshipCommand } from '../../../application/guardianship/commands/impl/activate-guardianship.command';
import { AppointGuardianCommand } from '../../../application/guardianship/commands/impl/appoint-guardian.command';
// Commands & DTOs
import { CreateGuardianshipCommand } from '../../../application/guardianship/commands/impl/create-guardianship.command';
import { PostBondCommand } from '../../../application/guardianship/commands/impl/post-bond.command';
import { RecordConflictOfInterestCommand } from '../../../application/guardianship/commands/impl/record-conflict-of-interest.command';
import { SubmitComplianceReportCommand } from '../../../application/guardianship/commands/impl/submit-compliance-report.command';
import { SuspendGuardianCommand } from '../../../application/guardianship/commands/impl/suspend-guardian.command';
import { TerminateGuardianshipCommand } from '../../../application/guardianship/commands/impl/terminate-guardianship.command';
import { UpdateGuardianPowersCommand } from '../../../application/guardianship/commands/impl/update-guardian-powers.command';
import { SubmitComplianceDto } from '../dto/request/compliance/submit-compliance.dto';
import { AppointGuardianDto } from '../dto/request/guardian-ops/appoint-guardian.dto';
import { PostBondDto } from '../dto/request/guardian-ops/post-bond.dto';
import { SuspendGuardianDto } from '../dto/request/guardian-ops/suspend-guardian.dto';
import { UpdateGuardianPowersDto } from '../dto/request/guardian-ops/update-guardian-powers.dto';
import { ActivateGuardianshipDto } from '../dto/request/lifecycle/activate-guardianship.dto';
import { CreateGuardianshipDto } from '../dto/request/lifecycle/create-guardianship.dto';
import { TerminateGuardianshipDto } from '../dto/request/lifecycle/terminate-guardianship.dto';
import { RecordConflictDto } from '../dto/request/risk/record-conflict.dto';

@ApiTags('Guardianship Commands')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('guardianships')
export class GuardianshipCommandController {
  constructor(private readonly commandBus: CommandBus) {}

  /**
   * Helper to satisfy ESLint 'only-throw-error' rule.
   * Ensures we strictly throw an Error object.
   */
  private throwError(result: Result<any>): never {
    const error = result.error;
    if (error instanceof Error) {
      throw error;
    }
    // Fallback for string errors or nulls
    throw new Error(String(error || 'Unknown operation failure'));
  }

  // ---------------------------------------------------------
  // Lifecycle Management
  // ---------------------------------------------------------

  @Post()
  @Roles('VERIFIER', 'ADMIN') // Lawyers are VERIFIERs
  @ApiOperation({ summary: 'Open a new Guardianship Case' })
  @ApiResponse({ status: 201, description: 'Case created successfully' })
  async create(@Body() dto: CreateGuardianshipDto, @CurrentUser() user: JwtPayload) {
    const command = new CreateGuardianshipCommand({
      ...dto,
      userId: user.sub,
    });

    const result = await this.commandBus.execute<CreateGuardianshipCommand, Result<string>>(
      command,
    );

    if (result.isFailure) {
      this.throwError(result);
    }
    return { id: result.getValue() };
  }

  @Post(':id/activate')
  @Roles('VERIFIER', 'ADMIN') // Registrars/Judges are VERIFIERs/ADMINs
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate a Pending Guardianship' })
  async activate(
    @Param('id') id: string,
    @Body() _dto: ActivateGuardianshipDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const command = new ActivateGuardianshipCommand(id, user.sub);
    const result = await this.commandBus.execute(command);

    if (result.isFailure) {
      this.throwError(result);
    }
    return { success: true };
  }

  @Post(':id/terminate')
  @Roles('VERIFIER', 'ADMIN') // Registrars/Judges are VERIFIERs/ADMINs
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Close/Terminate a Guardianship' })
  async terminate(
    @Param('id') id: string,
    @Body() dto: TerminateGuardianshipDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const command = new TerminateGuardianshipCommand({
      guardianshipId: id,
      ...dto,
      userId: user.sub,
    });

    const result = await this.commandBus.execute(command);
    if (result.isFailure) {
      this.throwError(result);
    }
    return { success: true };
  }

  // ---------------------------------------------------------
  // Guardian Operations
  // ---------------------------------------------------------

  @Post(':id/guardians')
  @Roles('VERIFIER', 'ADMIN') // Only legal professionals can appoint guardians
  @ApiOperation({ summary: 'Appoint a new Guardian' })
  async appointGuardian(
    @Param('id') id: string,
    @Body() dto: AppointGuardianDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const command = new AppointGuardianCommand({
      guardianshipId: id,
      ...dto,
      userId: user.sub,
    });

    const result = await this.commandBus.execute(command);
    if (result.isFailure) {
      this.throwError(result);
    }
    return { assignmentId: result.getValue() };
  }

  @Put(':id/guardians/:guardianId/powers')
  @Roles('VERIFIER', 'ADMIN') // Only legal professionals can update powers
  @ApiOperation({ summary: 'Update Guardian Legal Powers' })
  async updatePowers(
    @Param('id') id: string,
    @Param('guardianId') guardianId: string,
    @Body() dto: UpdateGuardianPowersDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const command = new UpdateGuardianPowersCommand(
      id,
      guardianId,
      dto.newPowers,
      user.sub,
      dto.reason,
    );

    const result = await this.commandBus.execute(command);
    if (result.isFailure) {
      this.throwError(result);
    }
    return { success: true };
  }

  @Post(':id/guardians/:guardianId/bond')
  @Roles('VERIFIER', 'ADMIN') // Only legal professionals can post bonds
  @ApiOperation({ summary: 'Post Security Bond (Section 72)' })
  async postBond(
    @Param('id') id: string,
    @Param('guardianId') guardianId: string,
    @Body() dto: PostBondDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const command = new PostBondCommand(id, guardianId, dto, user.sub);

    const result = await this.commandBus.execute(command);
    if (result.isFailure) {
      this.throwError(result);
    }
    return { success: true };
  }

  @Post(':id/guardians/:guardianId/suspend')
  @Roles('VERIFIER', 'ADMIN') // Only legal professionals can suspend
  @ApiOperation({ summary: 'Suspend a Guardian (Disciplinary)' })
  async suspendGuardian(
    @Param('id') id: string,
    @Param('guardianId') guardianId: string,
    @Body() dto: SuspendGuardianDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const command = new SuspendGuardianCommand(id, guardianId, dto.reason, user.sub);

    const result = await this.commandBus.execute(command);
    if (result.isFailure) {
      this.throwError(result);
    }
    return { success: true };
  }

  // ---------------------------------------------------------
  // Digital Lawyer (Compliance & Risk)
  // ---------------------------------------------------------

  @Post(':id/compliance/:checkId/submit')
  @Roles('USER', 'VERIFIER', 'ADMIN') // Users (guardians) can submit compliance reports
  @ApiOperation({ summary: 'Submit a Compliance Report' })
  async submitCompliance(
    @Param('id') id: string,
    @Param('checkId') checkId: string,
    @Body() dto: SubmitComplianceDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const command = new SubmitComplianceReportCommand(
      id,
      checkId,
      dto.method,
      dto.details,
      user.sub,
      dto.confirmationNumber,
    );

    const result = await this.commandBus.execute(command);
    if (result.isFailure) {
      this.throwError(result);
    }
    return { success: true };
  }

  @Post(':id/risk/conflict')
  @Roles('USER', 'VERIFIER', 'ADMIN', 'AUDITOR') // Anyone can report conflicts, including auditors
  @ApiOperation({ summary: 'Record a Conflict of Interest' })
  async recordConflict(
    @Param('id') id: string,
    @Body() dto: RecordConflictDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const command = new RecordConflictOfInterestCommand(
      id,
      dto.guardianId,
      dto.conflictType,
      dto.description,
      dto.severity,
      user.sub,
    );

    const result = await this.commandBus.execute(command);
    if (result.isFailure) {
      this.throwError(result);
    }
    return { success: true };
  }
}
