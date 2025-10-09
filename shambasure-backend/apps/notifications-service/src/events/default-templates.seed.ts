// ============================================================================
// default-templates.seed.ts - Default Template Seeder
// ============================================================================

import { Injectable as SeederInjectable, Logger as SeederLogger } from '@nestjs/common';
import { OnModuleInit } from '@nestjs/common';
import { NotificationChannel } from '@shamba/database';
import { TemplatesService as SeederTemplatesService } from '../services/templates.service';

/**
 * DefaultTemplatesSeed - Seeds default notification templates
 * Runs on application startup
 */
@SeederInjectable()
export class DefaultTemplatesSeed implements OnModuleInit {
  private readonly logger = new SeederLogger(DefaultTemplatesSeed.name);

  constructor(private readonly templatesService: SeederTemplatesService) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('Seeding default notification templates...');
    await this.seedTemplates();
  }

  private async seedTemplates(): Promise<void> {
    const templates = [
      // Welcome Email
      {
        name: 'welcome-email',
        channel: NotificationChannel.EMAIL,
        subject: 'Welcome to Shamba Sure!',
        body: `
      <h1>Welcome to Shamba Sure, {{firstName}}!</h1>
      <p>Thank you for joining our platform for secure succession planning.</p>
      <p>You can now:</p>
      <ul>
        <li>Create and manage your wills</li>
        <li>Register your assets</li>
        <li>Build your family tree (HeirLink™)</li>
        <li>Upload important documents</li>
      </ul>
      <p>Get started by logging in at <a href="${process.env.FRONTEND_URL}">${process.env.FRONTEND_URL}</a></p>
    `,
        variables: ['firstName'], // 👈 required
      },

      // Password Reset
      {
        name: 'password-reset-email',
        channel: NotificationChannel.EMAIL,
        subject: 'Reset Your Password - Shamba Sure',
        body: `
      <h1>Password Reset Request</h1>
      <p>We received a request to reset your password.</p>
      <p>Click the link below to reset your password (expires in 1 hour):</p>
      <p><a href="{{resetLink}}">Reset Password</a></p>
      <p>If you didn't request this, please ignore this email.</p>
    `,
        variables: ['resetLink'], // 👈 required
      },

      // Will Created
      {
        name: 'will-created-confirmation',
        channel: NotificationChannel.EMAIL,
        subject: 'Will Created Successfully - {{willTitle}}',
        body: `
      <h1>Will Created</h1>
      <p>Your will "{{willTitle}}" has been created successfully.</p>
      <p><strong>Status:</strong> {{uppercase status}}</p>
      <p>You can view and manage your will in your dashboard.</p>
    `,
        variables: ['willTitle', 'status'], // 👈 required
      },

      // Heir Assigned
      {
        name: 'heir-assigned-notification',
        channel: NotificationChannel.EMAIL,
        subject: 'You Have Been Named as a Beneficiary',
        body: `
      <h1>Beneficiary Assignment</h1>
      <p>You have been named as a beneficiary in a succession plan.</p>
      <p>Please log in to your Shamba Sure account for more details.</p>
    `,
        variables: [], // 👈 no placeholders
      },

      // Document Verified
      {
        name: 'document-verified-email',
        channel: NotificationChannel.EMAIL,
        subject: 'Document Verified - {{filename}}',
        body: `
      <h1>Document Verified</h1>
      <p>Your document "{{filename}}" has been successfully verified.</p>
      <p>You can now use this document in your succession planning.</p>
    `,
        variables: ['filename'], // 👈 required
      },
    ];

    for (const template of templates) {
      try {
        // Check if template already exists
        const existing = await this.templatesService.findOne(template.name).catch(() => null);

        if (!existing) {
          await this.templatesService.create(template);
          this.logger.log(`Created template: ${template.name}`);
        } else {
          this.logger.debug(`Template already exists: ${template.name}`);
        }
      } catch (error) {
        this.logger.error(`Failed to seed template: ${template.name}`, error);
      }
    }
  }
}
