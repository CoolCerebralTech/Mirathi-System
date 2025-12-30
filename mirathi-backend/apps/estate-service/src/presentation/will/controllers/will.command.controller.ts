import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser, JwtAuthGuard, type JwtPayload } from '@shamba/auth';

// Common
import { Result } from '../../../application/common/result';
// Application Commands
import { AddBeneficiaryCommand } from '../../../application/will/commands/impl/add-beneficiary.command';
import { AddCodicilCommand } from '../../../application/will/commands/impl/add-codicil.command';
import { AddWitnessCommand } from '../../../application/will/commands/impl/add-witness.command';
import { AppointExecutorCommand } from '../../../application/will/commands/impl/appoint-executor.command';
import { CreateDraftWillCommand } from '../../../application/will/commands/impl/create-draft-will.command';
import { ExecuteWillCommand } from '../../../application/will/commands/impl/execute-will.command';
import { RecordDisinheritanceCommand } from '../../../application/will/commands/impl/record-disinheritance.command';
import { RecordWitnessSignatureCommand } from '../../../application/will/commands/impl/record-witness-signature.command';
import { RevokeWillCommand } from '../../../application/will/commands/impl/revoke-will.command';
import { UpdateCapacityDeclarationCommand } from '../../../application/will/commands/impl/update-capacity-declaration.command';
// Request DTOs
import { AddBeneficiaryRequestDto } from '../dto/request/add-beneficiary.dto';
import { AddCodicilRequestDto } from '../dto/request/add-codicil.dto';
import { AddWitnessRequestDto } from '../dto/request/add-witness.dto';
import { AppointExecutorRequestDto } from '../dto/request/appoint-executor.dto';
import { CreateDraftWillRequestDto } from '../dto/request/create-draft-will.dto';
import { ExecuteWillRequestDto } from '../dto/request/execute-will.dto';
import { RecordDisinheritanceRequestDto } from '../dto/request/record-disinheritance.dto';
import { RecordWitnessSignatureRequestDto } from '../dto/request/record-witness-signature.dto';
import { RevokeWillRequestDto } from '../dto/request/revoke-will.dto';
import { UpdateCapacityRequestDto } from '../dto/request/update-capacity.dto';

@ApiTags('Wills (Commands)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wills')
export class WillCommandController {
  constructor(private readonly commandBus: CommandBus) {}

  // ===========================================================================
  // 1. LIFECYCLE: DRAFTING
  // ===========================================================================

  @Post('draft')
  @ApiOperation({ summary: 'Start a new Draft Will' })
  @ApiResponse({ status: 201, description: 'Draft created successfully', type: String })
  async createDraft(@CurrentUser() user: JwtPayload, @Body() dto: CreateDraftWillRequestDto) {
    const command = new CreateDraftWillCommand({
      userId: user.sub,
      data: {
        type: dto.type,
        initialCapacityDeclaration: dto.initialCapacityDeclaration
          ? {
              status: dto.initialCapacityDeclaration.status,
              date: new Date(dto.initialCapacityDeclaration.date),
              assessedBy: dto.initialCapacityDeclaration.assessedBy,
              notes: dto.initialCapacityDeclaration.notes,
              documentIds: dto.initialCapacityDeclaration.documentIds || [],
            }
          : undefined,
      },
    });

    const result = await this.commandBus.execute<CreateDraftWillCommand, Result<string>>(command);
    return this.handleResult(result);
  }

  @Post(':id/executors')
  @ApiOperation({ summary: 'Appoint an Executor' })
  async appointExecutor(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) willId: string,
    @Body() dto: AppointExecutorRequestDto,
  ) {
    const command = new AppointExecutorCommand({
      userId: user.sub,
      willId,
      data: dto,
    });
    const result = await this.commandBus.execute(command);
    return this.handleResult(result);
  }

  @Post(':id/beneficiaries')
  @ApiOperation({ summary: 'Add a Beneficiary/Bequest' })
  async addBeneficiary(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) willId: string,
    @Body() dto: AddBeneficiaryRequestDto,
  ) {
    const command = new AddBeneficiaryCommand({
      userId: user.sub,
      willId,
      data: dto,
    });
    const result = await this.commandBus.execute(command);
    return this.handleResult(result);
  }

  @Post(':id/disinheritance')
  @ApiOperation({ summary: 'Record a Disinheritance (S.26 Compliance)' })
  async recordDisinheritance(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) willId: string,
    @Body() dto: RecordDisinheritanceRequestDto,
  ) {
    const command = new RecordDisinheritanceCommand({
      userId: user.sub,
      willId,
      data: dto,
    });
    const result = await this.commandBus.execute(command);
    return this.handleResult(result);
  }

  // ===========================================================================
  // 2. RISK MANAGEMENT
  // ===========================================================================

  @Put(':id/capacity')
  @ApiOperation({ summary: 'Update Capacity Declaration' })
  async updateCapacity(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) willId: string,
    @Body() dto: UpdateCapacityRequestDto,
  ) {
    const command = new UpdateCapacityDeclarationCommand({
      userId: user.sub,
      willId,
      data: {
        ...dto,
        date: new Date(dto.date),
      },
    });
    const result = await this.commandBus.execute(command);
    return this.handleResult(result);
  }

  // ===========================================================================
  // 3. LIFECYCLE: EXECUTION
  // ===========================================================================

  @Post(':id/witnesses')
  @ApiOperation({ summary: 'Nominate a Witness (Draft Phase)' })
  async addWitness(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) willId: string,
    @Body() dto: AddWitnessRequestDto,
  ) {
    const command = new AddWitnessCommand({
      userId: user.sub,
      willId,
      data: dto,
    });
    const result = await this.commandBus.execute(command);
    return this.handleResult(result);
  }

  @Post(':id/execute')
  @ApiOperation({ summary: 'Execute the Will (S.11 Ceremony)' })
  async executeWill(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) willId: string,
    @Body() dto: ExecuteWillRequestDto,
  ) {
    const command = new ExecuteWillCommand({
      userId: user.sub,
      willId,
      data: {
        ...dto,
        executionDate: new Date(dto.executionDate),
      },
    });
    const result = await this.commandBus.execute(command);
    return this.handleResult(result);
  }

  @Post(':id/witnesses/sign')
  @ApiOperation({ summary: 'Record Witness Signature' })
  async recordWitnessSignature(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) willId: string,
    @Body() dto: RecordWitnessSignatureRequestDto,
  ) {
    const command = new RecordWitnessSignatureCommand({
      userId: user.sub,
      willId,
      data: dto,
    });
    const result = await this.commandBus.execute(command);
    return this.handleResult(result);
  }

  // ===========================================================================
  // 4. LIFECYCLE: POST-EXECUTION
  // ===========================================================================

  @Post(':id/codicils')
  @ApiOperation({ summary: 'Add a Codicil (Amendment)' })
  async addCodicil(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) willId: string,
    @Body() dto: AddCodicilRequestDto,
  ) {
    const command = new AddCodicilCommand({
      userId: user.sub,
      willId,
      data: {
        ...dto,
        date: new Date(dto.date),
        executionDetails: {
          ...dto.executionDetails,
          date: new Date(dto.executionDetails.date),
        },
      },
    });
    const result = await this.commandBus.execute(command);
    return this.handleResult(result);
  }

  @Post(':id/revoke')
  @ApiOperation({ summary: 'Revoke the Will' })
  async revokeWill(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) willId: string,
    @Body() dto: RevokeWillRequestDto,
  ) {
    const command = new RevokeWillCommand({
      userId: user.sub,
      willId,
      data: dto,
    });
    const result = await this.commandBus.execute(command);
    return this.handleResult(result);
  }

  // --- Helper to Unpack Result<T> ---
  private handleResult<T>(result: Result<T>): T {
    if (result.isFailure) {
      const error = result.error;
      const message = error ? error.message : 'Operation failed';

      // Map Domain/App Errors to HTTP Status Codes
      if (error?.name === 'NotFoundError') {
        throw new HttpException(message, HttpStatus.NOT_FOUND);
      }
      if (error?.name === 'SecurityError') {
        throw new HttpException(message, HttpStatus.FORBIDDEN);
      }
      if (error?.name === 'ConflictError' || error?.name === 'DuplicateActiveWillError') {
        throw new HttpException(message, HttpStatus.CONFLICT);
      }
      if (error?.name === 'WillException' || error?.name === 'ValidationError') {
        throw new HttpException(message, HttpStatus.BAD_REQUEST);
      }

      throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return result.getValue();
  }
}
