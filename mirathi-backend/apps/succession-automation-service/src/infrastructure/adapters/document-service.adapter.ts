export interface DocumentData {
  hasDeathCertificate: boolean;
  hasKraPin: boolean;
  hasChiefsLetter: boolean;
  hasWillDocument: boolean;
}

@Injectable()
export class DocumentServiceAdapter {
  constructor(private readonly prisma: PrismaService) {}

  async getDocumentStatus(userId: string): Promise<DocumentData> {
    const documents = await this.prisma.document.findMany({
      where: { uploaderId: userId },
    });

    return {
      hasDeathCertificate: documents.some(d => d.referenceType === 'DEATH_CERTIFICATE'),
      hasKraPin: documents.some(d => d.referenceType === 'KRA_PIN'),
      hasChiefsLetter: false, // TODO: Add to document types
      hasWillDocument: false, // Will is in will table
    };
  }
}