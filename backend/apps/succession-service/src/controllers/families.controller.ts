import { Controller, Get, Post, Delete, Body, Param, UseGuards, UseInterceptors, ClassSerializerInterceptor, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreateFamilyRequestDto, AddFamilyMemberRequestDto } from '@shamba/common';
import { JwtAuthGuard, CurrentUser, JwtPayload } from '@shamba/auth';
import { FamiliesService } from '../services/families.service';
import { FamilyEntity, FamilyMemberEntity } from '../entities/succession.entity';

@ApiTags('Families')
@Controller('families')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FamiliesController {
  constructor(private readonly familiesService: FamiliesService) {}

  @Post()
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Create a new family group' })
  @ApiResponse({ status: HttpStatus.CREATED, type: FamilyEntity })
  async create(
    @CurrentUser('sub') userId: string,
    @Body() createFamilyDto: CreateFamilyRequestDto,
  ): Promise<FamilyEntity> {
    const family = await this.familiesService.create(userId, createFamilyDto);
    return new FamilyEntity(family);
  }
  
  @Get(':id')
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Get a single family by ID' })
  @ApiResponse({ status: HttpStatus.OK, type: FamilyEntity })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<FamilyEntity> {
    const family = await this.familiesService.findOne(id, user);
    return new FamilyEntity(family);
  }

  @Post(':id/members')
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Add a new member to a family' })
  @ApiResponse({ status: HttpStatus.CREATED, type: FamilyMemberEntity })
  async addMember(
      @Param('id') familyId: string,
      @Body() addMemberDto: AddFamilyMemberRequestDto,
      @CurrentUser() user: JwtPayload,
  ): Promise<FamilyMemberEntity> {
      const member = await this.familiesService.addMember(familyId, addMemberDto, user);
      return new FamilyMemberEntity(member);
  }
}