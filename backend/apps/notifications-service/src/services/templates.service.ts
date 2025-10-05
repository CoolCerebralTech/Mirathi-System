// ============================================================================
// templates.service.ts - Template Management
// ============================================================================

import { 
  Injectable, 
  NotFoundException, 
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { NotificationTemplate, NotificationChannel } from '@shamba/database';
import { 
  CreateTemplateRequestDto, 
  UpdateTemplateRequestDto, 
  TemplateQueryDto 
} from '@shamba/common';
import { TemplatesRepository } from '../repositories/templates.repository';
import * as handlebars from 'handlebars';

/**
 * TemplatesService - Notification template management
 * 
 * RESPONSIBILITIES:
 * - Template CRUD operations
 * - Template compilation with Handlebars
 * - Variable validation
 * - Template uniqueness enforcement
 */
@Injectable()
export class TemplatesService {
  private readonly logger = new Logger(TemplatesService.name);

  constructor(private readonly templatesRepository: TemplatesRepository) {
    // Register Handlebars helpers
    this.registerHandlebarsHelpers();
  }

  // ========================================================================
  // CREATE OPERATIONS
  // ========================================================================

  async create(data: CreateTemplateRequestDto): Promise<NotificationTemplate> {
    // Validate template name uniqueness
    const existing = await this.templatesRepository.findByName(data.name);
    if (existing) {
      throw new ConflictException(`Template with name '${data.name}' already exists`);
    }

    // Validate template syntax
    this.validateTemplateSyntax(data.body);
    if (data.subject) {
      this.validateTemplateSyntax(data.subject);
    }

    const template = await this.templatesRepository.create(data);

    this.logger.log(`Template created: ${template.name} (${template.channel})`);
    return template;
  }

  // ========================================================================
  // READ OPERATIONS
  // ========================================================================

  async findOne(identifier: string): Promise<NotificationTemplate> {
    // Try to find by ID first, then by name
    let template = await this.templatesRepository.findById(identifier);
    if (!template) {
      template = await this.templatesRepository.findByName(identifier);
    }
    
    if (!template) {
      throw new NotFoundException(`Template '${identifier}' not found`);
    }

    return template;
  }

  async findMany(
    query: TemplateQueryDto
  ): Promise<{ templates: NotificationTemplate[]; total: number }> {
    const where: any = {};

    if (query.channel) {
      where.channel = query.channel;
    }

    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    return this.templatesRepository.findMany(where, query);
  }

  // ========================================================================
  // UPDATE OPERATIONS
  // ========================================================================

  async update(
    id: string, 
    data: UpdateTemplateRequestDto
  ): Promise<NotificationTemplate> {
    // Ensure template exists
    await this.templatesRepository.findOneOrFail({ id });

    // Validate new template syntax if provided
    if (data.body) {
      this.validateTemplateSyntax(data.body);
    }
    if (data.subject) {
      this.validateTemplateSyntax(data.subject);
    }

    const updated = await this.templatesRepository.update(id, data);

    this.logger.log(`Template updated: ${updated.name}`);
    return updated;
  }

  // ========================================================================
  // DELETE OPERATIONS
  // ========================================================================

  async delete(id: string): Promise<void> {
    // Ensure template exists
    await this.templatesRepository.findOneOrFail({ id });

    // Business rule: Check if template is in use
    // This requires injecting NotificationsRepository
    // const inUse = await this.notificationsRepo.existsByTemplate(id);
    // if (inUse) {
    //   throw new ConflictException('Cannot delete template that is in use');
    // }

    await this.templatesRepository.delete(id);

    this.logger.log(`Template deleted: ${id}`);
  }

  // ========================================================================
  // TEMPLATE COMPILATION
  // ========================================================================

  /**
   * Compile template with variables using Handlebars
   * @param template - Template to compile
   * @param variables - Variables to inject
   * @returns Compiled subject and body
   */
  compileTemplate(
    template: NotificationTemplate, 
    variables: Record<string, any>
  ): { subject: string | null; body: string } {
    try {
      const compileString = (str: string) => {
        const compiled = handlebars.compile(str);
        return compiled(variables);
      };

      return {
        subject: template.subject ? compileString(template.subject) : null,
        body: compileString(template.body),
      };
    } catch (error) {
      this.logger.error(
        `Failed to compile template ${template.name}`,
        error
      );
      throw new BadRequestException(
        `Template compilation failed: ${error.message}`
      );
    }
  }

  /**
   * Extract variables from template
   * @param templateString - Template string to analyze
   * @returns List of variable names
   */
  extractVariables(templateString: string): string[] {
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const variables = new Set<string>();
    let match;

    while ((match = variableRegex.exec(templateString)) !== null) {
      // Remove any Handlebars helpers/modifiers
      const varName = match[1].trim().split(' ')[0];
      variables.add(varName);
    }

    return Array.from(variables);
  }

  // ========================================================================
  // HELPER METHODS
  // ========================================================================

  /**
   * Validate template syntax
   */
  private validateTemplateSyntax(templateString: string): void {
    try {
      handlebars.compile(templateString);
    } catch (error) {
      throw new BadRequestException(
        `Invalid template syntax: ${error.message}`
      );
    }
  }

  /**
   * Register custom Handlebars helpers
   */
  private registerHandlebarsHelpers(): void {
    // Date formatting helper
    handlebars.registerHelper('formatDate', (date: Date | string) => {
      const d = new Date(date);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    });

    // Uppercase helper
    handlebars.registerHelper('uppercase', (str: string) => {
      return str ? str.toUpperCase() : '';
    });

    // Lowercase helper
    handlebars.registerHelper('lowercase', (str: string) => {
      return str ? str.toLowerCase() : '';
    });
  }
}
