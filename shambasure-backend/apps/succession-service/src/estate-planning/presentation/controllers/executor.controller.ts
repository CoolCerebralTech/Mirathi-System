import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '@shamba/auth';

import { NominateExecutorDto } from '../../application/dto/requests/nominate-executor.dto';
import { ExecutorResponseDto } from '../../application/dto/responses/executor.response.dto';
import { ExecutorService } from '../../application/services/executor.service';

interface RequestWithUser extends Request {
  user: { userId: string; email: string; role: string };
}

@ApiTags('Estate Planning - Executors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('executors')
export class ExecutorController {
  constructor(private readonly executorService: ExecutorService) {}

  // --------------------------------------------------------------------------
  // INBOX / MY DUTIES (Appointee View)
  // --------------------------------------------------------------------------

  @Get('my-nominations')
  @ApiOperation({
    summary: 'Get list of Wills where I am nominated as an Executor',
    description: 'Used for the "Inbox" or "Pending Requests" dashboard for the appointee.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [ExecutorResponseDto],
  })
  async getMyNominations(@Req() req: RequestWithUser): Promise<ExecutorResponseDto[]> {
    return this.executorService.getMyNominations(req.user.userId);
  }

  // --------------------------------------------------------------------------
  // MANAGEMENT (Testator View)
  // --------------------------------------------------------------------------

  @Post(':willId')
  @ApiOperation({ summary: 'Nominate an Executor for a Will' })
  @ApiParam({ name: 'willId', description: 'The ID of the Will' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Executor nominated successfully.',
    type: String, // Returns ID
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed (e.g. Underage executor, Max limit reached).',
  })
  async nominateExecutor(
    @Req() req: RequestWithUser,
    @Param('willId') willId: string,
    @Body() dto: NominateExecutorDto,
  ): Promise<{ id: string }> {
    const id = await this.executorService.nominateExecutor(willId, req.user.userId, dto);
    return { id };
  }

  @Get(':willId')
  @ApiOperation({ summary: 'List all executors for a specific Will' })
  @ApiParam({ name: 'willId', description: 'The ID of the Will' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [ExecutorResponseDto],
  })
  async getExecutors(
    @Req() req: RequestWithUser,
    @Param('willId') willId: string,
  ): Promise<ExecutorResponseDto[]> {
    return this.executorService.getExecutors(willId, req.user.userId);
  }

  @Get(':willId/:executorId')
  @ApiOperation({ summary: 'Get details of a specific executor appointment' })
  @ApiParam({ name: 'willId', description: 'The Will ID' })
  @ApiParam({ name: 'executorId', description: 'The Executor Record ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: ExecutorResponseDto,
  })
  async getExecutor(
    @Req() req: RequestWithUser,
    @Param('willId') willId: string,
    @Param('executorId') executorId: string,
  ): Promise<ExecutorResponseDto> {
    return this.executorService.getExecutor(willId, executorId, req.user.userId);
  }

  @Delete(':willId/:executorId')
  @ApiOperation({ summary: 'Remove an executor nomination' })
  @ApiParam({ name: 'willId', description: 'The Will ID' })
  @ApiParam({ name: 'executorId', description: 'The Executor Record ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Executor removed successfully.',
  })
  async removeExecutor(
    @Req() req: RequestWithUser,
    @Param('willId') willId: string,
    @Param('executorId') executorId: string,
  ): Promise<void> {
    return this.executorService.removeExecutor(willId, req.user.userId, executorId);
  }
}
