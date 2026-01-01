// src/infrastructure/adapters/sms/sms-adapter.factory.ts
import { Injectable } from '@nestjs/common';

import { SmsProviderPort } from '../../../domain/ports/sms-provider.port';
import { AfricasTalkingSmsAdapter } from './africastalking.adapter';
import { SafaricomSmsAdapter } from './safaricom.adapter';

export type SmsProviderType = 'SAFARICOM' | 'AFRICASTALKING';

@Injectable()
export class SmsAdapterFactory {
  constructor(
    private readonly safaricomAdapter: SafaricomSmsAdapter,
    private readonly africastalkingAdapter: AfricasTalkingSmsAdapter,
  ) {}

  getAdapter(provider: SmsProviderType): SmsProviderPort {
    switch (provider.toUpperCase()) {
      case 'SAFARICOM':
        return this.safaricomAdapter;
      case 'AFRICASTALKING':
        return this.africastalkingAdapter;
      default:
        throw new Error(`Unsupported SMS provider: ${provider}`);
    }
  }

  getAdapterByPhoneNumber(phoneNumber: string): SmsProviderPort {
    // Determine provider based on phone number prefix
    const formatted = phoneNumber.replace(/\D/g, '');

    if (formatted.startsWith('254')) {
      const prefix = formatted.substring(3, 5); // First two digits after 254

      // Safaricom prefixes
      const safaricomPrefixes = [
        '70',
        '71',
        '72',
        '74',
        '75',
        '76',
        '77',
        '78',
        '79',
        '10',
        '11',
        '12',
        '13',
        '14',
        '15',
        '16',
        '17',
        '18',
        '19',
      ];

      if (safaricomPrefixes.includes(prefix)) {
        return this.safaricomAdapter;
      }
    }

    // Default to Africa's Talking for other numbers
    return this.africastalkingAdapter;
  }

  getAllAdapters(): SmsProviderPort[] {
    return [this.safaricomAdapter, this.africastalkingAdapter];
  }

  getSupportedProviders(): SmsProviderType[] {
    return ['SAFARICOM', 'AFRICASTALKING'];
  }

  isProviderSupported(provider: string): boolean {
    return this.getSupportedProviders()
      .map((p) => p.toUpperCase())
      .includes(provider.toUpperCase());
  }
}
