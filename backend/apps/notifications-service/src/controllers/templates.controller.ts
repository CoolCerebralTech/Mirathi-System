
// ============================================================================
// templates.controller.ts - Admin Template Management
// ============================================================================

import { 
  Controller as TemplateController, 
  Get as TemplateGet, 
  Post as TemplatePost, 
  Patch as TemplatePatch,
  Delete as TemplateDelete, 
  Body as TemplateBody, 
  Param as TemplateParam, 
  Query as TemplateQuery, 
  UseGuards as TemplateUseGuards, 
  UseInterceptors as TemplateUseInterceptors, 
  ClassSerializerInterceptor as TemplateClassSerializerInterceptor, 
  HttpCode as TemplateHttpCode, 
  HttpStatus as TemplateHttpStatus,
  ParseUUIDPipe as TemplateParseUUIDPipe,
  NotFoundException,
} from '@nestjs/common';
import { 
  ApiTags as TemplateApiTags, 
  ApiOperation as TemplateApiOperation, 
  ApiResponse as TemplateApiResponse, 
  ApiBearerAuth as TemplateApiBearerAuth,
  ApiParam as TemplateApiParam,
} from '@nestjs/swagger';
import { 
  CreateTemplateRequestDto, 
  UpdateTemplateRequestDto, 
  TemplateQueryDto,
  createPaginatedResponseDto as templateCreatePaginatedResponseDto,
} from '@shamba/common';
import { 
  JwtAuthGuard as TemplateJwtAuthGuard, 
  RolesGuard as TemplateRolesGuard, 
  Roles as TemplateRoles 
} from '@shamba/auth';
import { UserRole } from '@shamba/database';
import { TemplatesService } from '../services/templates.service';
import { NotificationTemplateEntity } from '../entities/notification.entity';

const PaginatedTemplateResponse = templateCreatePaginatedResponseDto(NotificationTemplateEntity);

/**
 * TemplatesController - Admin template management
 * 
 * ROUTES:
 * - POST /templates - Create template
 * - GET /templates - List all templates
 * - GET /templates/:id - Get single template
 * - GET /templates/:id/variables - Extract template variables
 * - PATCH /templates/:id - Update template
 * - DELETE /templates/:id - Delete template
 * 
 * SECURITY: All routes require ADMIN role
 */
@TemplateApiTags('Templates (Admin)')
@TemplateController('templates')
@TemplateUseGuards(TemplateJwtAuthGuard, TemplateRolesGuard)
@TemplateRoles(UserRole.ADMIN)
@TemplateUseInterceptors(TemplateClassSerializerInterceptor)
@TemplateApiBearerAuth()
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @TemplatePost()
  @TemplateApiOperation({ 
    summary: 'Create notification template',
    description: 'Create new template with Handlebars syntax'
  })
  @TemplateApiResponse({ 
    status: TemplateHttpStatus.CREATED, 
    description: 'Template created successfully',
    type: NotificationTemplateEntity 
  })
  @TemplateApiResponse({ 
    status: TemplateHttpStatus.CONFLICT, 
    description: 'Template name already exists' 
  })
  @TemplateApiResponse({ 
    status: TemplateHttpStatus.BAD_REQUEST, 
    description: 'Invalid template syntax' 
  })
  async create(
    @TemplateBody() createDto: CreateTemplateRequestDto
  ): Promise<NotificationTemplateEntity> {
    const template = await this.templatesService.create(createDto);
    return new NotificationTemplateEntity(template);
  }

  @TemplateGet()
  @TemplateApiOperation({ 
    summary: 'List all templates',
    description: 'Get paginated list of notification templates'
  })
  @TemplateApiResponse({ 
    status: TemplateHttpStatus.OK, 
    description: 'Templates retrieved successfully',
    type: PaginatedTemplateResponse 
  })
  async findMany(@TemplateQuery() query: TemplateQueryDto) {
    const { templates, total } = await this.templatesService.findMany(query);
    const templateEntities = templates.map(t => new NotificationTemplateEntity(t));
    return new PaginatedTemplateResponse(templateEntities, total, query);
  }

  @TemplateGet(':id')
  @TemplateApiParam({ 
    name: 'id', 
    description: 'Template UUID or name',
    type: 'string'
  })
  @TemplateApiOperation({ 
    summary: 'Get template by ID or name',
    description: 'Retrieve template details'
  })
  @TemplateApiResponse({ 
    status: TemplateHttpStatus.OK, 
    description: 'Template retrieved successfully',
    type: NotificationTemplateEntity 
  })
  @TemplateApiResponse({ 
    status: TemplateHttpStatus.NOT_FOUND, 
    description: 'Template not found' 
  })
  async findOne(
    @TemplateParam('id') id: string
  ): Promise<NotificationTemplateEntity> {
    const template = await this.templatesService.findOne(id);
    return new NotificationTemplateEntity(template);
  }

  @TemplateGet(':id/variables')
  @TemplateApiParam({ 
    name: 'id', 
    description: 'Template UUID or name',
    type: 'string'
  })
  @TemplateApiOperation({ 
    summary: 'Extract template variables',
    description: 'Get list of variables used in template body and subject'
  })
  @TemplateApiResponse({ 
    status: TemplateHttpStatus.OK, 
    description: 'Variables extracted successfully'
  })
  async getVariables(@TemplateParam('id') id: string) {
    const template = await this.templatesService.findOne(id);
    
    const bodyVariables = this.templatesService.extractVariables(template.body);
    const subjectVariables = template.subject 
      ? this.templatesService.extractVariables(template.subject)
      : [];

    return {
      templateId: template.id,
      templateName: template.name,
      variables: Array.from(new Set([...bodyVariables, ...subjectVariables])),
      body: bodyVariables,
      subject: subjectVariables,
    };
  }

  @TemplatePatch(':id')
  @TemplateApiParam({ 
    name: 'id', 
    description: 'Template UUID',
    type: 'string',
    format: 'uuid'
  })
  @TemplateApiOperation({ 
    summary: 'Update template',
    description: 'Update template content or metadata'
  })
  @TemplateApiResponse({ 
    status: TemplateHttpStatus.OK, 
    description: 'Template updated successfully',
    type: NotificationTemplateEntity 
  })
  @TemplateApiResponse({ 
    status: TemplateHttpStatus.BAD_REQUEST, 
    description: 'Invalid template syntax' 
  })
  async update(
    @TemplateParam('id', TemplateParseUUIDPipe) id: string,
    @TemplateBody() updateDto: UpdateTemplateRequestDto,
  ): Promise<NotificationTemplateEntity> {
    const template = await this.templatesService.update(id, updateDto);
    return new NotificationTemplateEntity(template);
  }

  @TemplateDelete(':id')
  @TemplateHttpCode(TemplateHttpStatus.NO_CONTENT)
  @TemplateApiParam({ 
    name: 'id', 
    description: 'Template UUID',
    type: 'string',
    format: 'uuid'
  })
  @TemplateApiOperation({ 
    summary: 'Delete template',
    description: 'Delete notification template (cannot delete if in use)'
  })
  @TemplateApiResponse({ 
    status: TemplateHttpStatus.NO_CONTENT, 
    description: 'Template deleted successfully' 
  })
  @TemplateApiResponse({ 
    status: TemplateHttpStatus.CONFLICT, 
    description: 'Template is in use and cannot be deleted' 
  })
  async remove(
    @TemplateParam('id', TemplateParseUUIDPipe) id: string
  ): Promise<void> {
    await this.templatesService.delete(id);
  }
}