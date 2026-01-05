// apps/documents-service/src/presentation/dto/document-response.dto.ts

export class DocumentResponseDto {
  id: string;
  documentName: string;
  referenceNumber?: string;
  referenceType?: string;
  status: string;
  uploadedAt: Date;
  verifiedAt?: Date;
  verifiedBy?: string;
  rejectionReason?: string;
  ocrConfidence?: number;
  expiresAt?: Date;
}

export class UploadResponseDto {
  documentId: string;
  uploadUrl: string;
  expiresAt: Date;
  message: string;
}

export class DocumentListResponseDto {
  documents: DocumentResponseDto[];
  total: number;
  page: number;
  pageSize: number;
}
