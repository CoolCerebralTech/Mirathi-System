import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ConsentMethod, FamilyConsent } from '../../../../domain/entities/family-consent.entity';
import { ICommunicationAdapter } from '../../interfaces/i-communication.adapter';

@Injectable()
export class ConsentCommunicationService {
  private readonly logger = new Logger(ConsentCommunicationService.name);

  constructor(
    private readonly comms: ICommunicationAdapter,
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
    // 1. Generate Secure Token (JWT with 30-day expiry)
    // In production, this would call a TokenService
    const token = `mock_token_${consent.id}_${Date.now()}`;
    const link = `${this.config.get('APP_URL')}/consent/verify?token=${token}`;

    // 2. Prepare Message Content
    const messageData = {
      familyMemberName: consent.fullName,
      applicantName,
      deceasedName,
      relationship: consent.relationshipToDeceased,
      link,
      expiryDays: 30,
    };

    // 3. Send via Channels
    const methods: string[] = [];

    // Send Email
    if (consent.email) {
      await this.comms.sendEmail({
        to: consent.email,
        template: 'CONSENT_REQUEST_PA38',
        data: messageData,
      });
      methods.push('EMAIL');
    }

    // Send SMS (Short version)
    if (consent.phoneNumber) {
      await this.comms.sendSms({
        to: consent.phoneNumber,
        message: `Probate Alert: ${applicantName} has requested your consent for the estate of ${deceasedName}. Reply YES to approve or click: ${link}`,
      });
      methods.push('SMS');
    }

    if (methods.length === 0) {
      throw new Error(`No contact method available for ${consent.fullName}`);
    }

    this.logger.log(`Consent request sent to ${consent.fullName} via ${methods.join(', ')}`);
  }

  /**
   * Verifies an OTP or Token for Digital Consent
   */
  public async verifyDigitalConsent(
    token: string,
    inputCode?: string,
  ): Promise<{ isValid: boolean; method: ConsentMethod }> {
    // Implementation would verify JWT signature or OTP match
    return { isValid: true, method: ConsentMethod.DIGITAL_SIGNATURE };
  }
}
