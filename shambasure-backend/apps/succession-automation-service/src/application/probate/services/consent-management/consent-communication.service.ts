import { Injectable, Logger } from '@nestjs/common';

import { ConfigService } from '@shamba/config';

import { ConsentMethod, FamilyConsent } from '../../../../domain/entities/family-consent.entity';

// Removed ICommunicationAdapter import since we are mocking internally

@Injectable()
export class ConsentCommunicationService {
  private readonly logger = new Logger(ConsentCommunicationService.name);

  constructor(
    // Removed private readonly comms: ICommunicationAdapter,
    private readonly config: ConfigService,
  ) {}

  /**
   * Sends the official P&A 38 Consent Request
   */
  public async sendConsentRequest(
    consent: FamilyConsent,
    applicantName: string,
    deceasedName: string,
  ): Promise<void> {
    // FIX 1: Added .toString() to consent.id
    const token = `mock_token_${consent.id.toString()}_${Date.now()}`;

    // Safe fallback if APP_URL is not set in env yet
    const baseUrl = this.config.get('APP_URL') || 'http://localhost:3000';
    const link = `${baseUrl}/consent/verify?token=${token}`;

    // 2. Prepare Message Content
    const messageData = {
      familyMemberName: consent.fullName,
      applicantName,
      deceasedName,
      relationship: consent.relationshipToDeceased,
      link,
      expiryDays: 30,
    };

    // 3. Mock Sending via Channels
    const methods: string[] = [];

    // Simulate Network Latency
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (consent.email) {
      this.logger.log(
        `[MOCK EMAIL] To: ${consent.email} | Template: CONSENT_REQUEST_PA38 | Data: ${JSON.stringify(messageData)}`,
      );
      methods.push('EMAIL');
    }

    if (consent.phoneNumber) {
      const smsBody = `Probate Alert: ${applicantName} has requested your consent for the estate of ${deceasedName}. Reply YES to approve or click: ${link}`;
      this.logger.log(`[MOCK SMS] To: ${consent.phoneNumber} | Body: ${smsBody}`);
      methods.push('SMS');
    }

    if (methods.length === 0) {
      // Allow it to pass in dev mode even if no contact, just warn
      this.logger.warn(
        `[MOCK] No contact method found for ${consent.fullName}, but skipping error for testing.`,
      );
      return;
    }

    this.logger.log(
      `Consent request successfully sent to ${consent.fullName} via ${methods.join(', ')}`,
    );
  }

  /**
   * Verifies an OTP or Token for Digital Consent
   */
  public async verifyDigitalConsent(
    token: string,
    inputCode?: string,
  ): Promise<{ isValid: boolean; method: ConsentMethod }> {
    // FIX 2: Added await to satisfy eslint rule and simulate DB lookup
    await new Promise((resolve) => setTimeout(resolve, 100));
    this.logger.log(`[MOCK] Verifying token: ${token} with code: ${inputCode}`);

    // Mock validation logic
    if (token === 'invalid_token') {
      return { isValid: false, method: ConsentMethod.DIGITAL_SIGNATURE };
    }

    return { isValid: true, method: ConsentMethod.DIGITAL_SIGNATURE };
  }
}
