import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { TemplateRepository } from '../repositories/template.repository';
import { NotificationTemplateEntity } from '../entities/notification.entity';
import { LoggerService } from '@shamba/observability';
import { NotificationChannel } from '@shamba/common';

export interface CreateTemplateDto {
  name: string;
  channel: NotificationChannel;
  subject?: string;
  body: string;
  variables: string[];
  isActive?: boolean;
}

export interface UpdateTemplateDto {
  name?: string;
  subject?: string;
  body?: string;
  variables?: string[];
  isActive?: boolean;
}

@Injectable()
export class TemplateService {
  constructor(
    private templateRepository: TemplateRepository,
    private logger: LoggerService,
  ) {}

  async createTemplate(createDto: CreateTemplateDto): Promise<NotificationTemplateEntity> {
    this.logger.info('Creating notification template', 'TemplateService', {
      name: createDto.name,
      channel: createDto.channel,
    });

    // Validate template content
    this.validateTemplateContent(createDto);

    const template = await this.templateRepository.create(createDto);

    this.logger.info('Template created successfully', 'TemplateService', {
      templateId: template.id,
      name: template.name,
    });

    return template;
  }

  async getTemplateById(id: string): Promise<NotificationTemplateEntity> {
    this.logger.debug('Fetching template by ID', 'TemplateService', { templateId: id });

    return await this.templateRepository.findById(id);
  }

  async getTemplateByName(name: string): Promise<NotificationTemplateEntity> {
    this.logger.debug('Fetching template by name', 'TemplateService', { name });

    const template = await this.templateRepository.findByName(name);
    if (!template) {
      throw new NotFoundException(`Template '${name}' not found`);
    }

    return template;
  }

  async getAllTemplates(options?: {
    page?: number;
    limit?: number;
    channel?: NotificationChannel;
    isActive?: boolean;
  }): Promise<{ templates: NotificationTemplateEntity[]; total: number }> {
    this.logger.debug('Fetching all templates', 'TemplateService', options);

    return await this.templateRepository.findAll(options);
  }

  async updateTemplate(id: string, updateDto: UpdateTemplateDto): Promise<NotificationTemplateEntity> {
    this.logger.info('Updating template', 'TemplateService', { templateId: id });

    // Validate template content if body is being updated
    if (updateDto.body) {
      const existingTemplate = await this.templateRepository.findById(id);
      this.validateTemplateContent({
        channel: existingTemplate.channel,
        subject: updateDto.subject || existingTemplate.subject,
        body: updateDto.body,
        variables: updateDto.variables || existingTemplate.variables,
      });
    }

    const template = await this.templateRepository.update(id, updateDto);

    this.logger.info('Template updated successfully', 'TemplateService', {
      templateId: id,
    });

    return template;
  }

  async deleteTemplate(id: string): Promise<void> {
    this.logger.info('Deleting template', 'TemplateService', { templateId: id });

    await this.templateRepository.delete(id);

    this.logger.info('Template deleted successfully', 'TemplateService', {
      templateId: id,
    });
  }

  async activateTemplate(id: string): Promise<NotificationTemplateEntity> {
    this.logger.info('Activating template', 'TemplateService', { templateId: id });

    const template = await this.templateRepository.activateTemplate(id);

    this.logger.info('Template activated successfully', 'TemplateService', {
      templateId: id,
    });

    return template;
  }

  async deactivateTemplate(id: string): Promise<NotificationTemplateEntity> {
    this.logger.info('Deactivating template', 'TemplateService', { templateId: id });

    const template = await this.templateRepository.deactivateTemplate(id);

    this.logger.info('Template deactivated successfully', 'TemplateService', {
      templateId: id,
    });

    return template;
  }

  async getTemplateStats(id: string): Promise<any> {
    this.logger.debug('Fetching template statistics', 'TemplateService', { templateId: id });

    const stats = await this.templateRepository.getTemplateStats(id);
    const template = await this.templateRepository.findById(id);

    return {
      ...stats,
      template: {
        id: template.id,
        name: template.name,
        channel: template.channel,
        isActive: template.isActive,
        variables: template.variables,
      },
    };
  }

  async searchTemplates(query: string, options?: {
    page?: number;
    limit?: number;
  }): Promise<{ templates: NotificationTemplateEntity[]; total: number }> {
    this.logger.debug('Searching templates', 'TemplateService', { query });

    return await this.templateRepository.searchTemplates(query, options);
  }

  async previewTemplate(id: string, variables: Record<string, any>): Promise<{
    subject?: string;
    body: string;
    variables: {
      provided: string[];
      missing: string[];
    };
  }> {
    this.logger.debug('Previewing template', 'TemplateService', { templateId: id });

    const template = await this.templateRepository.findById(id);

    // Validate variables
    const variableValidation = template.validateVariables(variables);

    // Compile template
    const compiled = template.compileTemplate(variables);

    return {
      subject: compiled.subject,
      body: compiled.body,
      variables: {
        provided: Object.keys(variables),
        missing: variableValidation.missing,
      },
    };
  }

  async duplicateTemplate(id: string, newName: string): Promise<NotificationTemplateEntity> {
    this.logger.info('Duplicating template', 'TemplateService', {
      templateId: id,
      newName,
    });

    const originalTemplate = await this.templateRepository.findById(id);

    const duplicateDto: CreateTemplateDto = {
      name: newName,
      channel: originalTemplate.channel,
      subject: originalTemplate.subject,
      body: originalTemplate.body,
      variables: [...originalTemplate.variables],
      isActive: false, // Keep duplicate inactive by default
    };

    return await this.createTemplate(duplicateDto);
  }

  private validateTemplateContent(template: {
    channel: NotificationChannel;
    subject?: string;
    body: string;
    variables: string[];
  }): void {
    const errors: string[] = [];

    // Validate body
    if (!template.body || template.body.trim().length === 0) {
      errors.push('Template body cannot be empty');
    }

    // Validate subject for email
    if (template.channel === NotificationChannel.EMAIL && !template.subject) {
      errors.push('Email templates require a subject');
    }

    // Validate body length based on channel
    const maxLengths = {
      [NotificationChannel.EMAIL]: 10000,
      [NotificationChannel.SMS]: 160,
    };

    const maxLength = maxLengths[template.channel] || 1000;
    if (template.body.length > maxLength) {
      errors.push(`Template body exceeds maximum length of ${maxLength} characters for ${template.channel}`);
    }

    // Validate variable syntax in template
    const variablePlaceholders = template.body.match(/{{(\w+)}}/g) || [];
    const referencedVariables = variablePlaceholders.map(p => p.replace(/[{}]/g, ''));

    // Check for undefined variables in template
    for (const variable of referencedVariables) {
      if (!template.variables.includes(variable)) {
        errors.push(`Variable '${variable}' is used in template but not defined in variables list`);
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Template validation failed',
        errors,
      });
    }
  }

  async exportTemplates(): Promise<{ templates: any[] }> {
    this.logger.info('Exporting all templates', 'TemplateService');

    const { templates } = await this.templateRepository.findAll({ limit: 1000 }); // Get all templates

    const exportData = templates.map(template => ({
      name: template.name,
      channel: template.channel,
      subject: template.subject,
      body: template.body,
      variables: template.variables,
      isActive: template.isActive,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    }));

    return { templates: exportData };
  }

  async importTemplates(templates: any[]): Promise<{ success: number; failed: number; errors: string[] }> {
    this.logger.info('Importing templates', 'TemplateService', { count: templates.length });

    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const templateData of templates) {
      try {
        await this.createTemplate({
          name: templateData.name,
          channel: templateData.channel,
          subject: templateData.subject,
          body: templateData.body,
          variables: templateData.variables,
          isActive: templateData.isActive !== false,
        });
        successCount++;
      } catch (error) {
        failedCount++;
        errors.push(`Failed to import template '${templateData.name}': ${error.message}`);
      }
    }

    this.logger.info('Template import completed', 'TemplateService', {
      successCount,
      failedCount,
    });

    return { success: successCount, failed: failedCount, errors };
  }
}