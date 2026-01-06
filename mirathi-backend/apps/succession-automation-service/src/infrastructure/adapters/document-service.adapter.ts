import { Injectable } from '@nestjs/common';
import { DocumentStatus, ReferenceType } from '@prisma/client';

import { PrismaService } from '@shamba/database';

export interface DocumentData {
  hasDeathCertificate: boolean;
  hasKraPin: boolean;
  hasChiefsLetter: boolean;
  hasWillDocument: boolean;
  hasFamilyConsent: boolean; // Added P&A 38
}

@Injectable()
export class DocumentServiceAdapter {
  constructor(private readonly prisma: PrismaService) {}

  async getDocumentStatus(userId: string): Promise<DocumentData> {
    // 1. Fetch all active documents for this user
    const documents = await this.prisma.document.findMany({
      where: {
        uploaderId: userId,
        status: {
          in: [DocumentStatus.VERIFIED, DocumentStatus.PENDING_VERIFICATION],
          // We count Pending as "Existing" for readiness,
          // though Risk Analyzer might flag them as unverified.
        },
        deletedAt: null,
      },
    });

    // 2. Map to boolean flags
    return {
      hasDeathCertificate: documents.some(
        (d) => d.referenceType === ReferenceType.DEATH_CERTIFICATE,
      ),
      hasKraPin: documents.some((d) => d.referenceType === ReferenceType.KRA_PIN),
      // "Chief's Letter" might be categorized as OTHER with specific metadata, or explicit enum if added later
      hasChiefsLetter: documents.some(
        (d) =>
          d.referenceType === ReferenceType.OTHER && d.documentName.toLowerCase().includes('chief'),
      ),
      hasWillDocument: documents.some((d) => d.documentName.toLowerCase().includes('will')),
      hasFamilyConsent: documents.some(
        (d) =>
          d.documentName.includes('P&A 38') || d.documentName.toLowerCase().includes('consent'),
      ),
    };
  }
}
