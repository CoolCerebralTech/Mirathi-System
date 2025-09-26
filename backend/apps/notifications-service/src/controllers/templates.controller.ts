import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { 
  createSuccessResponse,
  createPaginatedResponse,
} from '@shamba/common';
import { 
  JwtAuthGuard, 
  RolesGuard, 
  CurrentUser,
  Roles,
} from '@shamba/auth';
import { TemplateService, CreateTemplateDto, UpdateTemplateDto } from '../services/template.service';
import { LoggerService } from '@shamba/observability';
import { UserRole, NotificationChannel } from '@shamba/common';
import { JwtPayload } from '@shamba/auth';

@ApiTags('Templates')
@Controller('templates')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TemplatesController {
  constructor(
    private templateService: TemplateService,
    private logger: LoggerService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a notification template (Admin only)' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Template created successfully' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid input data' 
  })
  async createTemplate(
    @Body() createDto: CreateTemplateDto,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.info('Creating notification template', 'TemplatesController', {
      adminUserId: user.userId,
      templateName: createDto.name,
    });

    const template = await this.templateService.createTemplate(createDto);

    return createSuccessResponse(template, 'Template created successfully');
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all templates (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'channel', required: false, enum: NotificationChannel })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Templates retrieved successfully' 
  })
  async getAllTemplates(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('channel') channel?: NotificationChannel,
    @Query('isActive') isActive?: boolean,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.debug('Fetching all templates', 'TemplatesController', {
      adminUserId: user.userId,
      page,
      limit,
    });

    const result = await this.templateService.getAllTemplates({
      page,
      limit,
      channel,
      isActive: isActive !== undefined ? Boolean(isActive) : undefined,
    });

    return createPaginatedResponse(
      result.templates,
      {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
      'Templates retrieved successfully'
    );
  }

  @Get('search')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Search templates (Admin only)' })
  @ApiQuery({ name: 'q', description: 'Search query' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Search completed successfully' 
  })
  async searchTemplates(
    @Query('q') query: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.debug('Searching templates', 'TemplatesController', {
      adminUserId: user.userId,
      query,
    });

    const result = await this.templateService.searchTemplates(query, { page, limit });

    return createPaginatedResponse(
      result.templates,
      {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
      'Search completed successfully'
    );
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get template by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Template retrieved successfully' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Template not found' 
  })
  async getTemplateById(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.debug('Fetching template by ID', 'TemplatesController', {
      adminUserId: user.userId,
      templateId: id,
    });

    const template = await this.templateService.getTemplateById(id);

    return createSuccessResponse(template, 'Template retrieved successfully');
  }

  @Get('name/:name')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get template by name (Admin only)' })
  @ApiParam({ name: 'name', description: 'Template name' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Template retrieved successfully' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Template not found' 
  })
  async getTemplateByName(
    @Param('name') name: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.debug('Fetching template by name', 'TemplatesController', {
      adminUserId: user.userId,
      templateName: name,
    });

    const template = await this.templateService.getTemplateByName(name);

    return createSuccessResponse(template, 'Template retrieved successfully');
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a template (Admin only)' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Template updated successfully' 
  })
  async updateTemplate(
    @Param('id') id: string,
    @Body() updateDto: UpdateTemplateDto,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.info('Updating template', 'TemplatesController', {
      adminUserId: user.userId,
      templateId: id,
    });

    const template = await this.templateService.updateTemplate(id, updateDto);

    return createSuccessResponse(template, 'Template updated successfully');
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a template (Admin only)' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Template deleted successfully' 
  })
  async deleteTemplate(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.info('Deleting template', 'TemplatesController', {
      adminUserId: user.userId,
      templateId: id,
    });

    await this.templateService.deleteTemplate(id);

    return createSuccessResponse(null, 'Template deleted successfully');
  }

  @Post(':id/activate')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Activate a template (Admin only)' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Template activated successfully' 
  })
  async activateTemplate(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.info('Activating template', 'TemplatesController', {
      adminUserId: user.userId,
      templateId: id,
    });

    const template = await this.templateService.activateTemplate(id);

    return createSuccessResponse(template, 'Template activated successfully');
  }

  @Post(':id/deactivate')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Deactivate a template (Admin only)' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Template deactivated successfully' 
  })
  async deactivateTemplate(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.info('Deactivating template', 'TemplatesController', {
      adminUserId: user.userId,
      templateId: id,
    });

    const template = await this.templateService.deactivateTemplate(id);

    return createSuccessResponse(template, 'Template deactivated successfully');
  }

  @Get(':id/stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get template statistics (Admin only)' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Statistics retrieved successfully' 
  })
  async getTemplateStats(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.debug('Fetching template statistics', 'TemplatesController', {
      adminUserId: user.userId,
      templateId: id,
    });

    const stats = await this.templateService.getTemplateStats(id);

    return createSuccessResponse(stats, 'Statistics retrieved successfully');
  }

  @Post(':id/preview')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Preview a template with variables (Admin only)' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Preview generated successfully' 
  })
  async previewTemplate(
    @Param('id') id: string,
    @Body() variables: Record<string, any>,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.debug('Previewing template', 'TemplatesController', {
      adminUserId: user.userId,
      templateId: id,
    });

    const preview = await this.templateService.previewTemplate(id, variables);

    return createSuccessResponse(preview, 'Preview generated successfully');
  }

  @Post(':id/duplicate')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Duplicate a template (Admin only)' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Template duplicated successfully' 
  })
  async duplicateTemplate(
    @Param('id') id: string,
    @Body('newName') newName: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.info('Duplicating template', 'TemplatesController', {
      adminUserId: user.userId,
      templateId: id,
      newName,
    });

    const duplicate = await this.templateService.duplicateTemplate(id, newName);

    return createSuccessResponse(duplicate, 'Template duplicated successfully');
  }

  @Get('export/all')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Export all templates (Admin only)' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Templates exported successfully' 
  })
  async exportTemplates(@CurrentUser() user: JwtPayload) {
    this.logger.info('Exporting all templates', 'TemplatesController', {
      adminUserId: user.userId,
    });

    const exportData = await this.templateService.exportTemplates();

    return createSuccessResponse(exportData, 'Templates exported successfully');
  }

  @Post('import')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Import templates (Admin only)' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Templates imported successfully' 
  })
  async importTemplates(
    @Body() importData: { templates: any[] },
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.info('Importing templates', 'TemplatesController', {
      adminUserId: user.userId,
      count: importData.templates.length,
    });

    const result = await this.templateService.importTemplates(importData.templates);

    return createSuccessResponse(result, 'Templates imported successfully');
  }
}