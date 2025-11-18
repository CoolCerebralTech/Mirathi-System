// estate-planning/presentation/controllers/executor.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shamba/auth';
import { TestatorOwnershipGuard } from '../../../common/guards/testator-ownership.guard';
import { WillStatusGuard } from '../../../common/guards/will-status.guard';
import { KenyanLawValidationPipe } from '../../../common/pipes/kenyan-law-validation.pipe';
import { ExecutorService } from '../../application/services/executor.service';
import { NominateExecutorRequestDto } from '../../application/dto/request/nominate-executor.dto';
import { ExecutorResponseDto } from '../../application/dto/response/executor.response.dto';

@ApiTags('Executors')
@ApiBearerAuth()
@Controller('wills/:willId/executors')
@UseGuards(JwtAuthGuard)
export class ExecutorController {
  constructor(private readonly executorService: ExecutorService) {}

  @Post()
  @ApiOperation({ summary: 'Nominate executor', description: 'Nominate an executor for a will' })
  @ApiResponse({ status: HttpStatus.CREATED, type: ExecutorResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Will not found' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or cannot modify will',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied to this will' })
  @UseGuards(TestatorOwnershipGuard, WillStatusGuard)
  async nominateExecutor(
    @Param('willId') willId: string,
    @Body(KenyanLawValidationPipe) nominateExecutorDto: NominateExecutorRequestDto,
    @Request() req,
  ): Promise<ExecutorResponseDto> {
    const testatorId = req.user.id;
    return this.executorService.nominateExecutor(nominateExecutorDto, willId, testatorId);
  }

  @Get()
  @ApiOperation({
    summary: 'Get will executors',
    description: 'Get all executors for a specific will',
  })
  @ApiResponse({ status: HttpStatus.OK, type: [ExecutorResponseDto] })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Will not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied to this will' })
  @UseGuards(TestatorOwnershipGuard)
  async getExecutors(
    @Param('willId') willId: string,
    @Request() req,
  ): Promise<{
    executors: ExecutorResponseDto[];
    primaryExecutor?: ExecutorResponseDto;
    summary: any;
  }> {
    const testatorId = req.user.id;
    return this.executorService.getExecutors(willId, testatorId);
  }

  @Put(':executorId/priority')
  @ApiOperation({
    summary: 'Update executor priority',
    description: 'Update the priority order of an executor',
  })
  @ApiResponse({ status: HttpStatus.OK, type: ExecutorResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Will or executor not found' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot modify will in current status',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied to this will' })
  @UseGuards(TestatorOwnershipGuard, WillStatusGuard)
  async updateExecutorPriority(
    @Param('willId') willId: string,
    @Param('executorId') executorId: string,
    @Body() updatePriorityDto: { priority: number },
    @Request() req,
  ): Promise<ExecutorResponseDto> {
    const testatorId = req.user.id;
    return this.executorService.updateExecutorPriority(
      executorId,
      updatePriorityDto.priority,
      willId,
      testatorId,
    );
  }

  @Delete(':executorId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove executor', description: 'Remove an executor from a will' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Will or executor not found' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot modify will in current status',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied to this will' })
  @UseGuards(TestatorOwnershipGuard, WillStatusGuard)
  async removeExecutor(
    @Param('willId') willId: string,
    @Param('executorId') executorId: string,
    @Request() req,
  ): Promise<void> {
    const testatorId = req.user.id;
    return this.executorService.removeExecutor(executorId, willId, testatorId);
  }

  @Post('my-duties')
  @ApiOperation({
    summary: 'Get my executor duties',
    description: 'Get all executor duties for the authenticated user',
  })
  @ApiResponse({ status: HttpStatus.OK, type: [ExecutorResponseDto] })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async getMyExecutorDuties(@Request() req): Promise<ExecutorResponseDto[]> {
    const userId = req.user.id;
    return this.executorService.getExecutorDuties(userId);
  }

  @Post(':executorId/accept')
  @ApiOperation({
    summary: 'Accept executor role',
    description: 'Accept nomination as an executor',
  })
  @ApiResponse({ status: HttpStatus.OK, type: ExecutorResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Executor not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Cannot accept executor role' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async acceptExecutorRole(
    @Param('executorId') executorId: string,
    @Request() req,
  ): Promise<ExecutorResponseDto> {
    const userId = req.user.id;
    return this.executorService.acceptExecutorRole(executorId, userId);
  }

  @Post(':executorId/decline')
  @ApiOperation({
    summary: 'Decline executor role',
    description: 'Decline nomination as an executor',
  })
  @ApiResponse({ status: HttpStatus.OK, type: ExecutorResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Executor not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Cannot decline executor role' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async declineExecutorRole(
    @Param('executorId') executorId: string,
    @Body() declineDto: { reason: string },
    @Request() req,
  ): Promise<ExecutorResponseDto> {
    const userId = req.user.id;
    return this.executorService.declineExecutorRole(executorId, userId, declineDto.reason);
  }
}
