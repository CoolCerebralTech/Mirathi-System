import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, UseInterceptors, ClassSerializerInterceptor, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreateWillRequestDto, UpdateWillRequestDto, AssignBeneficiaryRequestDto } from '@shamba/common';
import { JwtAuthGuard, CurrentUser, JwtPayload } from '@shamba/auth';
import { WillsService } from '../services/wills.service';
import { WillEntity, BeneficiaryAssignmentEntity } from '../entities/succession.entity';

@ApiTags('Wills')
@Controller('wills')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WillsController {
  constructor(private readonly willsService: WillsService) {}

  @Post()
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Create a new will' })
  @ApiResponse({ status: HttpStatus.CREATED, type: WillEntity })
  async create(
    @CurrentUser('sub') userId: string,
    @Body() createWillDto: CreateWillRequestDto,
  ): Promise<WillEntity> {
    const will = await this.willsService.create(userId, createWillDto);
    return new WillEntity(will);
  }

  @Get()
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Get all wills for the authenticated user' })
  @ApiResponse({ status: HttpStatus.OK, type: [WillEntity] })
  async findMyWills(@CurrentUser('sub') userId: string): Promise<WillEntity[]> {
    const wills = await this.willsService.findForTestator(userId);
    return wills.map(will => new WillEntity(will));
  }

  @Get(':id')
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Get a single will by ID' })
  @ApiResponse({ status: HttpStatus.OK, type: WillEntity })
  async findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload): Promise<WillEntity> {
    const will = await this.willsService.findOne(id, user);
    return new WillEntity(will);
  }

  @Put(':id')
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Update a draft will' })
  @ApiResponse({ status: HttpStatus.OK, type: WillEntity })
  async update(
      @Param('id') id: string,
      @Body() updateWillDto: UpdateWillRequestDto,
      @CurrentUser() user: JwtPayload
  ): Promise<WillEntity> {
    const will = await this.willsService.update(id, updateWillDto, user);
    return new WillEntity(will);
  }

  @Post(':id/assignments')
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Assign a beneficiary to an asset within a will' })
  @ApiResponse({ status: HttpStatus.CREATED, type: BeneficiaryAssignmentEntity })
  async addAssignment(
      @Param('id') willId: string,
      @Body() assignDto: AssignBeneficiaryRequestDto,
      @CurrentUser() user: JwtPayload
  ): Promise<BeneficiaryAssignmentEntity> {
      const assignment = await this.willsService.addAssignment(willId, assignDto, user);
      return new BeneficiaryAssignmentEntity(assignment);
  }
}