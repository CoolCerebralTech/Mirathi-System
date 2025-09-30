import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, UseInterceptors, ClassSerializerInterceptor, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreateTemplateRequestDto, UpdateTemplateRequestDto, TemplateQueryDto, UserRole } from '@shamba/common';
import { JwtAuthGuard, RolesGuard, Roles } from '@shamba/auth';
import { TemplatesService } from '../services/templates.service';
import { NotificationTemplateEntity } from '../entities/notification.entity';

@ApiTags('Templates (Admin)')
@Controller('templates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN) // All routes in this controller require ADMIN role
@ApiBearerAuth()
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Create a new notification template' })
  @ApiResponse({ status: HttpStatus.CREATED, type: NotificationTemplateEntity })
  async create(@Body() createDto: CreateTemplateRequestDto): Promise<NotificationTemplateEntity> {
    const template = await this.templatesService.create(createDto);
    return new NotificationTemplateEntity(template);
  }

  @Get()
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Get a paginated list of all templates' })
  // @ApiResponse({ status: 200, type: PaginatedTemplateResponse }) // Paginated DTO needed
  async findMany(@Query() query: TemplateQueryDto) {
    const { templates, total } = await this.templatesService.findMany(query);
    const templateEntities = templates.map(t => new NotificationTemplateEntity(t));
    // return new PaginatedTemplateResponse(templateEntities, total, query);
    return { templates: templateEntities, total }; // Simplified for now
  }

  @Get(':id')
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Get a single template by ID' })
  @ApiResponse({ status: HttpStatus.OK, type: NotificationTemplateEntity })
  async findOne(@Param('id') id: string): Promise<NotificationTemplateEntity> {
    const template = await this.templatesService.findOne(id);
    return new NotificationTemplateEntity(template);
  }

  @Put(':id')
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Update a template' })
  @ApiResponse({ status: HttpStatus.OK, type: NotificationTemplateEntity })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateTemplateRequestDto,
  ): Promise<NotificationTemplateEntity> {
    const template = await this.templatesService.update(id, updateDto);
    return new NotificationTemplateEntity(template);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a template' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  async remove(@Param('id') id: string): Promise<void> {
    await this.templatesService.delete(id);
  }
}