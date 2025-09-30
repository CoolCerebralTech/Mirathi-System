import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PrismaService, NotificationTemplate } from '@shamba/database';
import { PaginationQueryDto } from '@shamba/common';

@Injectable()
export class TemplatesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.NotificationTemplateCreateInput): Promise<NotificationTemplate> {
    return this.prisma.notificationTemplate.create({ data });
  }

  async findOneOrFail(where: Prisma.NotificationTemplateWhereUniqueInput): Promise<NotificationTemplate> {
    const template = await this.prisma.notificationTemplate.findUnique({ where });
    if (!template) {
      throw new NotFoundException('Notification template not found.');
    }
    return template;
  }
  
  async findOne(where: Prisma.NotificationTemplateWhereUniqueInput): Promise<NotificationTemplate | null> {
    return this.prisma.notificationTemplate.findUnique({ where });
  }

  async findMany(
    where: Prisma.NotificationTemplateWhereInput,
    pagination: PaginationQueryDto,
  ): Promise<{ templates: NotificationTemplate[]; total: number }> {
    const { page = 1, limit = 10, sortBy = 'name', sortOrder = 'asc' } = pagination;
    const skip = (page - 1) * limit;

    const [templates, total] = await this.prisma.$transaction([
      this.prisma.notificationTemplate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.notificationTemplate.count({ where }),
    ]);

    return { templates, total };
  }

  async update(id: string, data: Prisma.NotificationTemplateUpdateInput): Promise<NotificationTemplate> {
    return this.prisma.notificationTemplate.update({ where: { id }, data });
  }

  async delete(id: string): Promise<NotificationTemplate> {
    return this.prisma.notificationTemplate.delete({ where: { id } });
  }
}