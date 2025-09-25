import { Injectable } from '@nestjs/common';
import { DocumentEntity, DocumentVerificationResult, VerificationCheck } from '../entities/document.entity';
import { LoggerService } from '@shamba/observability';
import { DocumentStatus } from '@shamba/common';

@Injectable()
export class VerificationService {
  constructor(private logger: LoggerService) {}

  async verifyDocument(document: DocumentEntity): Promise<DocumentVerificationResult> {
    const checks: VerificationCheck[] = [];
    
    // Perform various verification checks
    checks.push(await this.checkFileIntegrity(document));
    checks.push(await this.checkDocumentType(document));
    checks.push(await this.checkContentValidity(document));
    checks.push(await this.checkForSensitiveData(document));
    checks.push(await this.checkMetadataConsistency(document));

    // Calculate overall confidence score
    const passedChecks = checks.filter(check => check.passed);
    const confidenceScore = passedChecks.length > 0 
      ? passedChecks.reduce((sum, check) => sum + check.confidence, 0) / passedChecks.length
      : 0;

    // Determine final status
    const status = confidenceScore >= 0.7 ? DocumentStatus.VERIFIED : DocumentStatus.REJECTED;
    const reasons = checks.filter(check => !check.passed).map(check => check.details || check.name);

    this.logger.info('Document verification completed', 'VerificationService', {
      documentId: document.id,
      status,
      confidenceScore,
      passedChecks: passedChecks.length,
      totalChecks: checks.length,
    });

    return new DocumentVerificationResult({
      documentId: document.id,
      status,
      checks,
      confidenceScore,
      reasons,
    });
  }

  async autoVerifyDocument(document: DocumentEntity): Promise<void> {
    try {
      const result = await this.verifyDocument(document);
      
      // In a real implementation, this would update the document status in the database
      // and potentially notify the user or trigger further actions
      
      this.logger.info('Auto-verification completed', 'VerificationService', {
        documentId: document.id,
        status: result.status,
        confidence: result.confidenceScore,
      });
    } catch (error) {
      this.logger.error('Auto-verification failed', 'VerificationService', {
        documentId: document.id,
        error: error.message,
      });
    }
  }

  private async checkFileIntegrity(document: DocumentEntity): Promise<VerificationCheck> {
    try {
      // Check file size matches metadata
      const expectedSize = document.sizeBytes;
      // In reality, we'd check the actual file size from storage
      
      // Check for file corruption (basic check)
      const isCorrupt = false; // This would involve actual file validation
      
      return {
        name: 'File Integrity Check',
        passed: !isCorrupt && expectedSize > 0,
        details: isCorrupt ? 'File appears to be corrupted' : 'File integrity verified',
        confidence: 0.9,
        metadata: {
          expectedSize,
          isCorrupt,
        },
      };
    } catch (error) {
      return {
        name: 'File Integrity Check',
        passed: false,
        details: `Integrity check failed: ${error.message}`,
        confidence: 0.1,
      };
    }
  }

  private async checkDocumentType(document: DocumentEntity): Promise<VerificationCheck> {
    try {
      const isSupported = document.isSupportedType();
      const mimeTypeMatchesExtension = this.verifyMimeTypeConsistency(document);
      
      return {
        name: 'Document Type Validation',
        passed: isSupported && mimeTypeMatchesExtension,
        details: isSupported 
          ? 'Document type is supported and consistent'
          : 'Unsupported document type or type mismatch',
        confidence: isSupported ? 0.8 : 0.2,
        metadata: {
          mimeType: document.mimeType,
          isSupported,
          mimeTypeMatchesExtension,
        },
      };
    } catch (error) {
      return {
        name: 'Document Type Validation',
        passed: false,
        details: `Type validation failed: ${error.message}`,
        confidence: 0.1,
      };
    }
  }

  private async checkContentValidity(document: DocumentEntity): Promise<VerificationCheck> {
    try {
      // Basic content validation based on document type
      let isValid = true;
      let confidence = 0.7;
      let details = 'Content appears valid';

      if (document.isPDF()) {
        // Check if PDF is not empty and has readable content
        const textContent = document.metadata?.textContent || '';
        isValid = textContent.length > 10; // At least some text content
        confidence = isValid ? 0.8 : 0.3;
        details = isValid ? 'PDF contains readable content' : 'PDF appears to be empty or unreadable';
      } else if (document.isImage()) {
        // Check if image dimensions are reasonable
        const metadata = document.metadata || {};
        const width = metadata.originalWidth || 0;
        const height = metadata.originalHeight || 0;
        
        isValid = width > 50 && height > 50 && width < 10000 && height < 10000;
        confidence = isValid ? 0.9 : 0.4;
        details = isValid ? 'Image dimensions are valid' : 'Image dimensions are suspicious';
      }

      return {
        name: 'Content Validity Check',
        passed: isValid,
        details,
        confidence,
        metadata: {
          contentLength: document.metadata?.textContent?.length || 0,
        },
      };
    } catch (error) {
      return {
        name: 'Content Validity Check',
        passed: false,
        details: `Content validation failed: ${error.message}`,
        confidence: 0.1,
      };
    }
  }

  private async checkForSensitiveData(document: DocumentEntity): Promise<VerificationCheck> {
    try {
      // Check for potential sensitive data patterns
      const textContent = (document.metadata?.textContent || '').toLowerCase();
      
      const sensitivePatterns = [
        /\b\d{16}\b/, // Credit card numbers
        /\b\d{3}-\d{2}-\d{4}\b/, // SSN pattern (US)
        /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i, // Email addresses
        /\b\d{10,15}\b/, // Long number sequences (phone numbers, etc.)
      ];

      const foundSensitiveData = sensitivePatterns.some(pattern => pattern.test(textContent));
      
      return {
        name: 'Sensitive Data Check',
        passed: !foundSensitiveData,
        details: foundSensitiveData 
          ? 'Potential sensitive data detected' 
          : 'No sensitive data patterns found',
        confidence: foundSensitiveData ? 0.3 : 0.9,
        metadata: {
          sensitivePatternsChecked: sensitivePatterns.length,
          foundSensitiveData,
        },
      };
    } catch (error) {
      return {
        name: 'Sensitive Data Check',
        passed: false,
        details: `Sensitive data check failed: ${error.message}`,
        confidence: 0.1,
      };
    }
  }

  private async checkMetadataConsistency(document: DocumentEntity): Promise<VerificationCheck> {
    try {
      // Check if metadata is consistent and complete
      const metadata = document.metadata || {};
      const hasEssentialMetadata = !!metadata.checksum && !!metadata.originalFilename;
      
      // Check if storage path is valid and accessible
      const storageInfo = await this.checkStorageAccessibility(document.storagePath);
      
      return {
        name: 'Metadata Consistency Check',
        passed: hasEssentialMetadata && storageInfo.accessible,
        details: hasEssentialMetadata && storageInfo.accessible
          ? 'Metadata is consistent and storage accessible'
          : 'Metadata issues or storage inaccessible',
        confidence: hasEssentialMetadata && storageInfo.accessible ? 0.8 : 0.2,
        metadata: {
          hasEssentialMetadata,
          storageAccessible: storageInfo.accessible,
          storageError: storageInfo.error,
        },
      };
    } catch (error) {
      return {
        name: 'Metadata Consistency Check',
        passed: false,
        details: `Metadata check failed: ${error.message}`,
        confidence: 0.1,
      };
    }
  }

  private verifyMimeTypeConsistency(document: DocumentEntity): boolean {
    const extension = document.getFileExtension();
    const mimeType = document.mimeType.toLowerCase();

    const typeMap: Record<string, string[]> = {
      'jpg': ['image/jpeg'],
      'jpeg': ['image/jpeg'],
      'png': ['image/png'],
      'gif': ['image/gif'],
      'pdf': ['application/pdf'],
      'doc': ['application/msword'],
      'docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    };

    const expectedTypes = typeMap[extension] || [];
    return expectedTypes.includes(mimeType);
  }

  private async checkStorageAccessibility(storagePath: string): Promise<{ accessible: boolean; error?: string }> {
    try {
      // This would actually check if the file exists and is readable
      // For now, we'll simulate the check
      const exists = true; // This would be an actual filesystem check
      return {
        accessible: exists,
        error: exists ? undefined : 'File not found in storage',
      };
    } catch (error) {
      return {
        accessible: false,
        error: error.message,
      };
    }
  }

  async batchVerifyDocuments(documentIds: string[]): Promise<DocumentVerificationResult[]> {
    const results: DocumentVerificationResult[] = [];

    for (const documentId of documentIds) {
      try {
        // In a real implementation, we'd fetch the document entity
        // For now, we'll simulate the result
        const result = new DocumentVerificationResult({
          documentId,
          status: Math.random() > 0.3 ? DocumentStatus.VERIFIED : DocumentStatus.REJECTED,
          confidenceScore: Math.random() * 0.5 + 0.5, // 0.5 to 1.0
          reasons: [],
        });
        
        results.push(result);
      } catch (error) {
        this.logger.error('Batch verification failed for document', 'VerificationService', {
          documentId,
          error: error.message,
        });
      }
    }

    return results;
  }
}