import { DocumentStatus } from '../../enums';
import { BaseResponseDto } from '../shared/base.response.dto';
import { PaginationQueryDto } from '../shared/pagination.dto';
export declare class InitiateDocumentUploadRequestDto {
    assetId?: string;
}
export declare class UpdateDocumentRequestDto {
    filename?: string;
    status?: DocumentStatus;
}
/**
 * Defines the query parameters for filtering a list of documents.
 */
export declare class DocumentQueryDto extends PaginationQueryDto {
    status?: DocumentStatus;
    uploaderId?: string;
}
export declare class DocumentVersionResponseDto extends BaseResponseDto {
    versionNumber: number;
    storagePath: string;
    changeNote?: string;
    documentId: string;
}
export declare class DocumentResponseDto extends BaseResponseDto {
    filename: string;
    storagePath: string;
    mimeType: string;
    sizeBytes: number;
    status: DocumentStatus;
    uploaderId: string;
    versions: DocumentVersionResponseDto[];
}
//# sourceMappingURL=documents.dto.d.ts.map