import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PrismaService, Document, DocumentVersion, DocumentStatus } from '@shamba/database';
import { PaginationQueryDto } from '@shamba/common';

// ============================================================================
// ARCHITECTURAL NOTE: The Role of the Repository
// ============================================================================
// The Repository's ONLY responsibility is to query the database. It is a pure
// data access layer. It does not contain any business logic.
// ============================================================================

@Injectable()
export class DocumentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.DocumentCreateInput): Promise<Document> {
    return this.prisma.document.create({ data });
  }

  async findOneOrFail(where: Prisma.DocumentWhereUniqueInput): Promise<Document & { versions: DocumentVersion[] }> {
    const document = await this.prisma.document.findUnique({
      where,
      include: { versions: { orderBy: { versionNumber: 'desc' } } },
    });
    if (!document) {
      throw new NotFoundException('Document not found.');
    }
    return document;
  }

  async findMany(
    where: Prisma.DocumentWhereInput,
    pagination: PaginationQueryDto,
  ): Promise<{ documents: Document[]; total: number }> {
    const { page = 1, limit = 10, sortBy, sortOrder } = pagination;
    const skip = (page - 1) * limit;

    const [documents, total] = await this.prisma.$transaction([
      this.prisma.document.findMany({
        where,
        skip,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      this.prisma.document.count({ where }),
    ]);

    return { documents, total };
  }

  async update(id: string, data: Prisma.DocumentUpdateInput): Promise<Document> {
    return this.prisma.document.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Document> {
    // Prisma's onDelete: Cascade will handle deleting the versions.
    return this.prisma.document.delete({ where: { id } });
  }

  async addVersion(data: Prisma.DocumentVersionUncheckedCreateInput): Promise<DocumentVersion> {
    return this.prisma.documentVersion.create({ data });
  }

  async getStatsForUploader(uploaderId: string) {
    return this.prisma.document.groupBy({
      by: ['status', 'mimeType'],
      where: { uploaderId },
      _count: {
        id: true,
      },
      _sum: {
        sizeBytes: true,
      },
    });
  }
}