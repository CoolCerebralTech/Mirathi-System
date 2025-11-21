import { Injectable } from '@nestjs/common';
import { LegalGrounds } from '../value-objects/legal-grounds.vo';
import { DisputeType } from '@prisma/client';

@Injectable()
export class DisputeGroundsPolicy {
  validateObjection(
    type: DisputeType,
    description: string,
    stage: 'PRE_GRANT' | 'POST_GRANT',
  ): { isValid: boolean; error?: string } {
    // 1. Minimum Detail
    if (description.length < 20) {
      return { isValid: false, error: 'Description too short. Please provide detailed grounds.' };
    }

    // 2. Post-Grant Revocation Rules (Section 76)
    // You can only revoke a grant for specific reasons (Fraud, Ignorance of Law, etc.)
    if (stage === 'POST_GRANT') {
      const grounds = new LegalGrounds(type, description);
      if (!grounds.isValidGroundForRevocation()) {
        return {
          isValid: false,
          error:
            'Invalid grounds for Revocation of Grant. Must allege Fraud, Concealment, or Defective Process.',
        };
      }
    }

    // 3. Frivolous check (Simple keyword filter)
    const forbiddenKeywords = ['hate', 'dislike', 'annoying'];
    if (forbiddenKeywords.some((w) => description.toLowerCase().includes(w))) {
      return {
        isValid: false,
        error: 'Objection must be based on legal grounds, not personal animosity.',
      };
    }

    return { isValid: true };
  }
}
