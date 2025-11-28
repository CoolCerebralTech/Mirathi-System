import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '@shamba/auth';

import { AddDebtDto } from '../../application/dto/request/add-debt.dto';
import { RecordDebtPaymentDto } from '../../application/dto/request/record-debt-payment.dto';
import { DebtResponseDto } from '../../application/dto/response/debt.response.dto';
import { DebtService } from '../../application/services/debt.service';

interface RequestWithUser extends Request {
  user: { userId: string; email: string; role: string };
}

@ApiTags('Estate Planning - Liabilities (Debts)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('debts')
export class DebtController {
  constructor(private readonly debtService: DebtService) {}

  // --------------------------------------------------------------------------
  // CREATE
  // --------------------------------------------------------------------------

  @Post()
  @ApiOperation({ summary: 'Record a new liability/debt against the estate' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Debt recorded successfully.',
    type: String, // Returns ID
  })
  async addDebt(@Req() req: RequestWithUser, @Body() dto: AddDebtDto): Promise<{ id: string }> {
    const id = await this.debtService.addDebt(req.user.userId, dto);
    return { id };
  }

  @Post(':id/payment')
  @ApiOperation({ summary: 'Record a payment towards a debt' })
  @ApiParam({ name: 'id', description: 'The Debt ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment recorded. Debt status updated if cleared.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid payment amount or currency mismatch.',
  })
  async recordPayment(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: RecordDebtPaymentDto,
  ): Promise<void> {
    return this.debtService.recordPayment(id, req.user.userId, dto);
  }

  // --------------------------------------------------------------------------
  // READ
  // --------------------------------------------------------------------------

  @Get()
  @ApiOperation({ summary: 'List estate debts with optional filtering' })
  @ApiQuery({
    name: 'filter',
    required: false,
    enum: ['ALL', 'OUTSTANDING', 'PAID', 'PRIORITY'],
    description: 'Filter debts by status. PRIORITY shows First Charge debts (Funeral/Taxes).',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [DebtResponseDto],
  })
  async getDebts(
    @Req() req: RequestWithUser,
    @Query('filter') filter?: 'ALL' | 'OUTSTANDING' | 'PAID' | 'PRIORITY',
  ): Promise<DebtResponseDto[]> {
    return this.debtService.getDebts(req.user.userId, filter || 'ALL');
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get total liabilities grouped by currency' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Financial summary of debts.',
  })
  async getLiabilitiesSummary(@Req() req: RequestWithUser) {
    return this.debtService.getLiabilitiesSummary(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific debt' })
  @ApiParam({ name: 'id', description: 'The Debt ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: DebtResponseDto,
  })
  async getDebt(@Req() req: RequestWithUser, @Param('id') id: string): Promise<DebtResponseDto> {
    return this.debtService.getDebt(id, req.user.userId);
  }
}
