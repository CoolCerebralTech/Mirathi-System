import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { NotificationTemplate } from '@shamba/database';
import { CreateTemplateRequestDto, UpdateTemplateRequestDto, TemplateQueryDto } from '@shamba/common';
import { TemplatesRepository } from '../repositories/templates.repository';
import * as handlebars from 'handlebars';

@Injectable()
export class TemplatesService {
  constructor(private readonly templatesRepository: TemplatesRepository) {}

  async create(data: CreateTemplateRequestDto): Promise<NotificationTemplate> {
    const existing = await this.templatesRepository.findOne({ name: data.name });
    if (existing) {
      throw new ConflictException(`Template with name '${data.name}' already exists.`);
    }
    return this.templatesRepository.create(data);
  }

  async findOne(id: string): Promise<NotificationTemplate> {
    return this.templatesRepository.findOneOrFail({ id });
  }

  async findMany(query: TemplateQueryDto): Promise<{ templates: NotificationTemplate[]; total: number }> {
    return this.templatesRepository.findMany({ channel: query.channel, name: { contains: query.search } }, query);
  }

  async update(id: string, data: UpdateTemplateRequestDto): Promise<NotificationTemplate> {
    await this.findOne(id); // Ensure it exists
    return this.templatesRepository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.findOne(id); // Ensure it exists
    // Business logic: Check if template is in use before deleting
    // const notifications = await this.notificationsRepository.findMany({ where: { templateId: id }, take: 1 });
    // if (notifications.length > 0) { throw new ConflictException(...) }
    await this.templatesRepository.delete(id);
  }

  /**
   * Compiles a template body and subject with the given variables.
   * This is the core template rendering logic.
   */
  compileTemplate(template: NotificationTemplate, variables: Record<string, any>): { subject?: string; body: string } {
    const compile = (str: string) => handlebars.compile(str)(variables);
    
    return {
      body: compile(template.body),
      subject: template.subject ? compile(template.subject) : undefined
    }
  }
}