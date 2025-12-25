import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser, JwtAuthGuard, type JwtPayload } from '@shamba/auth';

import { AppErrors } from '../../../application/common/application.error';
import { Result } from '../../../application/common/result';
// Commands
import { AddFamilyMemberCommand } from '../../../application/family/commands/impl/add-family-member.command';
import { ArchiveFamilyCommand } from '../../../application/family/commands/impl/archive-family.command';
import { CreateFamilyCommand } from '../../../application/family/commands/impl/create-family.command';
import { DefineRelationshipCommand } from '../../../application/family/commands/impl/define-relationship.command';
import { EstablishPolygamousHouseCommand } from '../../../application/family/commands/impl/establish-polygamous-house.command';
import { RecordAdoptionCommand } from '../../../application/family/commands/impl/record-adoption.command';
import { RecordCohabitationCommand } from '../../../application/family/commands/impl/record-cohabitation.command';
import { RegisterMarriageCommand } from '../../../application/family/commands/impl/register-marriage.command';
import { VerifyMemberIdentityCommand } from '../../../application/family/commands/impl/verify-member-identity.command';
// DTOs
import { AddFamilyMemberDto } from '../dto/request/add-family-member.dto';
import { ArchiveFamilyDto } from '../dto/request/archive-family.dto';
import { CreateFamilyDto } from '../dto/request/create-family.dto';
import { DefineRelationshipDto } from '../dto/request/define-relationship.dto';
import { EstablishPolygamousHouseDto } from '../dto/request/establish-house.dto';
import { RecordAdoptionDto } from '../dto/request/record-adoption.dto';
import { RecordCohabitationDto } from '../dto/request/record-cohabitation.dto';
import { RegisterMarriageDto } from '../dto/request/register-marriage.dto';
import { VerifyMemberIdentityDto } from '../dto/request/verify-identity.dto';

@ApiTags('Family Commands (Write)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('families')
export class FamilyCommandController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @ApiOperation({ summary: 'Create a new family tree' })
  @ApiResponse({ status: 201, description: 'Family created successfully', type: String })
  async createFamily(@CurrentUser() user: JwtPayload, @Body() dto: CreateFamilyDto) {
    const command = new CreateFamilyCommand({
      userId: user.sub,
      ...dto,
    });

    const result = await this.commandBus.execute<CreateFamilyCommand, Result<string>>(command);
    return this.handleResult(result);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add a member to the family' })
  async addMember(
    @Param('id') familyId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: AddFamilyMemberDto,
  ) {
    const command = new AddFamilyMemberCommand({
      userId: user.sub,
      familyId,
      ...dto,
    });

    const result = await this.commandBus.execute<AddFamilyMemberCommand, Result<string>>(command);
    return this.handleResult(result);
  }

  @Post(':id/marriages')
  @ApiOperation({ summary: 'Register a marriage (Civil, Customary, etc.)' })
  async registerMarriage(
    @Param('id') familyId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: RegisterMarriageDto,
  ) {
    const command = new RegisterMarriageCommand({
      userId: user.sub,
      familyId,
      ...dto,
    });

    const result = await this.commandBus.execute<RegisterMarriageCommand, Result<string>>(command);
    return this.handleResult(result);
  }

  @Post(':id/houses')
  @ApiOperation({ summary: 'Establish a polygamous house (Section 40)' })
  async establishHouse(
    @Param('id') familyId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: EstablishPolygamousHouseDto,
  ) {
    const command = new EstablishPolygamousHouseCommand({
      userId: user.sub,
      familyId,
      ...dto,
    });

    const result = await this.commandBus.execute<EstablishPolygamousHouseCommand, Result<string>>(
      command,
    );
    return this.handleResult(result);
  }

  @Post(':id/relationships')
  @ApiOperation({ summary: 'Define a biological or legal relationship' })
  async defineRelationship(
    @Param('id') familyId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: DefineRelationshipDto,
  ) {
    const command = new DefineRelationshipCommand({
      userId: user.sub,
      familyId,
      ...dto,
    });

    const result = await this.commandBus.execute<DefineRelationshipCommand, Result<string>>(
      command,
    );
    return this.handleResult(result);
  }

  @Post(':id/cohabitations')
  @ApiOperation({ summary: 'Record a cohabitation/dependency claim (Section 29)' })
  async recordCohabitation(
    @Param('id') familyId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: RecordCohabitationDto,
  ) {
    const command = new RecordCohabitationCommand({
      userId: user.sub,
      familyId,
      ...dto,
    });

    const result = await this.commandBus.execute<RecordCohabitationCommand, Result<string>>(
      command,
    );
    return this.handleResult(result);
  }

  @Post(':id/adoptions')
  @ApiOperation({ summary: 'Record an adoption (Formal or Customary)' })
  async recordAdoption(
    @Param('id') familyId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: RecordAdoptionDto,
  ) {
    const command = new RecordAdoptionCommand({
      userId: user.sub,
      familyId,
      ...dto,
    });

    const result = await this.commandBus.execute<RecordAdoptionCommand, Result<string>>(command);
    return this.handleResult(result);
  }

  @Post(':id/members/:memberId/verify')
  @ApiOperation({ summary: 'Verify a member identity (KYC/KYM)' })
  async verifyIdentity(
    @Param('id') familyId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: VerifyMemberIdentityDto,
  ) {
    const command = new VerifyMemberIdentityCommand({
      userId: user.sub,
      familyId,
      memberId,
      ...dto,
    });

    const result = await this.commandBus.execute<VerifyMemberIdentityCommand, Result<string>>(
      command,
    );
    return this.handleResult(result);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Archive/Soft delete a family tree' })
  async archiveFamily(
    @Param('id') familyId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: ArchiveFamilyDto,
  ) {
    const command = new ArchiveFamilyCommand({
      userId: user.sub,
      familyId,
      reason: dto.reason,
    });

    const result = await this.commandBus.execute<ArchiveFamilyCommand, Result<void>>(command);

    if (result.isFailure) {
      this.throwHttpException(result.error);
    }
  }

  /**
   * Helper to unwrap Result<T> or throw proper HTTP exceptions
   */
  private handleResult<T>(result: Result<T>): { id: T } | T {
    if (result.isFailure) {
      this.throwHttpException(result.error);
    }
    const value = result.getValue();
    // Return object with ID if string, otherwise return value directly
    return (typeof value === 'string' ? { id: value } : value) as any;
  }

  private throwHttpException(error: Error | null): never {
    if (!error) throw new HttpException('Unknown error', HttpStatus.INTERNAL_SERVER_ERROR);

    if (error instanceof AppErrors.NotFoundError) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
    if (error instanceof AppErrors.ConflictError) {
      throw new HttpException(error.message, HttpStatus.CONFLICT);
    }
    if (error instanceof AppErrors.ValidationError) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
    if (error instanceof AppErrors.SecurityError) {
      throw new HttpException(error.message, HttpStatus.FORBIDDEN);
    }

    throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
