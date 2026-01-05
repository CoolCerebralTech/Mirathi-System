// apps/documents-service/src/infrastructure/ocr/tesseract.service.ts
import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';
import Tesseract from 'tesseract.js';

export interface IOCRService {
  extractText(imageBuffer: Buffer): Promise<OCRResult>;
}

export interface OCRResult {
  text: string;
  confidence: number;
  detectedReferenceNumber?: string;
  detectedReferenceType?: string;
}

@Injectable()
export class TesseractService implements IOCRService {
  private readonly logger = new Logger(TesseractService.name);

  /**
   * Extract text from image using Tesseract OCR
   */
  async extractText(imageBuffer: Buffer): Promise<OCRResult> {
    try {
      // Optimize image for OCR
      const optimizedImage = await this.preprocessImage(imageBuffer);

      // Run OCR
      const result = await Tesseract.recognize(optimizedImage, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            this.logger.debug(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      const text = result.data.text.trim();
      const confidence = result.data.confidence;

      // Try to detect reference numbers
      const detectedRef = this.detectReferenceNumber(text);

      this.logger.log(`OCR completed with ${confidence.toFixed(2)}% confidence`);

      return {
        text,
        confidence,
        detectedReferenceNumber: detectedRef?.number,
        detectedReferenceType: detectedRef?.type,
      };
    } catch (error) {
      this.logger.error('OCR extraction failed', error);
      throw new Error('Failed to extract text from document');
    }
  }

  /**
   * Preprocess image for better OCR accuracy
   */
  private async preprocessImage(buffer: Buffer): Promise<Buffer> {
    return await sharp(buffer)
      .resize({ width: 2000, withoutEnlargement: true })
      .grayscale()
      .normalize()
      .sharpen()
      .toBuffer();
  }

  /**
   * Detect and extract reference numbers from OCR text
   * Supports Kenyan document formats
   */
  private detectReferenceNumber(text: string): { number: string; type: string } | null {
    const cleanText = text.replace(/\s+/g, ' ').toUpperCase();

    // Title Deed Pattern: NAIROBI/BLOCK123/456 or similar
    const titleDeedPattern = /([A-Z]+\/[A-Z0-9]+\/[0-9]+)/;
    const titleMatch = cleanText.match(titleDeedPattern);
    if (titleMatch) {
      return { number: titleMatch[1], type: 'TITLE_DEED' };
    }

    // National ID Pattern: 8 digits
    const idPattern = /\b(\d{8})\b/;
    const idMatch = cleanText.match(idPattern);
    if (idMatch && cleanText.includes('NATIONAL')) {
      return { number: idMatch[1], type: 'NATIONAL_ID' };
    }

    // KRA PIN Pattern: A001234567B
    const kraPinPattern = /\b([A-Z]\d{9}[A-Z])\b/;
    const kraMatch = cleanText.match(kraPinPattern);
    if (kraMatch) {
      return { number: kraMatch[1], type: 'KRA_PIN' };
    }

    // Death Certificate Pattern: DEATH/2024/001234
    const deathCertPattern = /(DEATH\/\d{4}\/\d+)/;
    const deathMatch = cleanText.match(deathCertPattern);
    if (deathMatch) {
      return { number: deathMatch[1], type: 'DEATH_CERTIFICATE' };
    }

    // Birth Certificate Pattern: BIRTH/2024/001234
    const birthCertPattern = /(BIRTH\/\d{4}\/\d+)/;
    const birthMatch = cleanText.match(birthCertPattern);
    if (birthMatch) {
      return { number: birthMatch[1], type: 'BIRTH_CERTIFICATE' };
    }

    // Marriage Certificate Pattern: MARRIAGE/2024/001234
    const marriageCertPattern = /(MARRIAGE\/\d{4}\/\d+)/;
    const marriageMatch = cleanText.match(marriageCertPattern);
    if (marriageMatch) {
      return { number: marriageMatch[1], type: 'MARRIAGE_CERTIFICATE' };
    }

    this.logger.warn('No reference number pattern detected in OCR text');
    return null;
  }
}
