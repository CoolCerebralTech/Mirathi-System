import { NotificationChannel, NotificationStatus } from '@shamba/common';
import { Exclude } from 'class-transformer';

export class NotificationEntity {
  id: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  recipientId: string;
  templateId: string;
  subject?: string;
  body: string;
  sentAt?: Date;
  failReason?: string;
  retryCount: number;
  maxRetries: number;
  metadata?: Record<string, any>;
  createdAt: Date;

  // Relations
  template?: NotificationTemplateEntity;
  recipient?: any;

  constructor(partial: Partial<NotificationEntity>) {
    Object.assign(this, partial);
  }

  // Business logic methods
  canBeSent(): boolean {
    return this.status === NotificationStatus.PENDING && 
           this.retryCount < this.maxRetries;
  }

  shouldRetry(): boolean {
    return this.status === NotificationStatus.FAILED && 
           this.retryCount < this.maxRetries;
  }

  isExpired(): boolean {
    // Notifications expire after 24 hours
    const expirationTime = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    return Date.now() - this.createdAt.getTime() > expirationTime;
  }

  markAsSent(): void {
    this.status = NotificationStatus.SENT;
    this.sentAt = new Date();
    this.retryCount = 0;
  }

  markAsFailed(reason: string): void {
    this.status = NotificationStatus.FAILED;
    this.failReason = reason;
    this.retryCount += 1;
  }

  prepareForRetry(): void {
    this.status = NotificationStatus.PENDING;
    this.failReason = undefined;
  }

  validateContent(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.body || this.body.trim().length === 0) {
      errors.push('Notification body cannot be empty');
    }

    if (this.channel === NotificationChannel.EMAIL && !this.subject) {
      errors.push('Email notifications require a subject');
    }

    if (this.body.length > this.getMaxLength()) {
      errors.push(`Notification body exceeds maximum length of ${this.getMaxLength()} characters`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private getMaxLength(): number {
    const maxLengths = {
      [NotificationChannel.EMAIL]: 10000,
      [NotificationChannel.SMS]: 160,
    };

    return maxLengths[this.channel] || 1000;
  }
}

export class NotificationTemplateEntity {
  id: string;
  name: string;
  channel: NotificationChannel;
  subject?: string;
  body: string;
  variables: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  notifications?: NotificationEntity[];

  constructor(partial: Partial<NotificationTemplateEntity>) {
    Object.assign(this, partial);
  }

  // Business logic methods
  validateVariables(providedVariables: Record<string, any>): { isValid: boolean; missing: string[] } {
    const missing: string[] = [];

    for (const variable of this.variables) {
      if (!(variable in providedVariables)) {
        missing.push(variable);
      }
    }

    return {
      isValid: missing.length === 0,
      missing,
    };
  }

  compileTemplate(variables: Record<string, any>): { subject?: string; body: string } {
    let compiledSubject: string | undefined;
    let compiledBody = this.body;

    // Compile subject if exists
    if (this.subject) {
      compiledSubject = this.compileString(this.subject, variables);
    }

    // Compile body
    compiledBody = this.compileString(this.body, variables);

    return {
      subject: compiledSubject,
      body: compiledBody,
    };
  }

  private compileString(template: string, variables: Record<string, any>): string {
    let compiled = template;

    // Simple template variable replacement: {{variableName}}
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      compiled = compiled.replace(placeholder, String(value));
    }

    return compiled;
  }

  canBeDeleted(): boolean {
    // Check if template is used in any notifications
    return !this.notifications || this.notifications.length === 0;
  }

  getUsageStats(): { totalSent: number; successRate: number } {
    if (!this.notifications) {
      return { totalSent: 0, successRate: 0 };
    }

    const total = this.notifications.length;
    const successful = this.notifications.filter(n => n.status === NotificationStatus.SENT).length;
    const successRate = total > 0 ? (successful / total) * 100 : 0;

    return {
      totalSent: total,
      successRate: Math.round(successRate * 100) / 100, // Round to 2 decimal places
    };
  }
}