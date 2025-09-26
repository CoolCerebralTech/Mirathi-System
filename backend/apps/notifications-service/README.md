# Notification Service

Email, SMS, and push notification service for Shamba Sure platform.

## Features

- Multi-channel notifications (Email, SMS)
- Template management with variable substitution
- Event-driven notification system
- Retry logic for failed notifications
- Comprehensive analytics and reporting
- Bulk notification processing

## API Endpoints

### Notifications
- `POST /notifications/send` - Send a notification (Admin only)
- `GET /notifications` - Get notifications for current user
- `GET /notifications/stats` - Get notification statistics (Admin only)
- `POST /notifications/retry-failed` - Retry failed notifications (Admin only)
- `POST /notifications/process-pending` - Process pending notifications (Admin only)
- `GET /notifications/health` - Get service health status
- `GET /notifications/:id` - Get notification by ID

### Templates
- `POST /templates` - Create a template (Admin only)
- `GET /templates` - Get all templates (Admin only)
- `GET /templates/search` - Search templates (Admin only)
- `GET /templates/:id` - Get template by ID (Admin only)
- `PUT /templates/:id` - Update a template (Admin only)
- `DELETE /templates/:id` - Delete a template (Admin only)
- `POST /templates/:id/activate` - Activate template (Admin only)
- `POST /templates/:id/deactivate` - Deactivate template (Admin only)
- `GET /templates/:id/stats` - Get template statistics (Admin only)
- `POST /templates/:id/preview` - Preview template with variables (Admin only)
- `POST /templates/:id/duplicate` - Duplicate template (Admin only)
- `GET /templates/export/all` - Export all templates (Admin only)
- `POST /templates/import` - Import templates (Admin only)

## Supported Events

The service automatically processes these events:
- `user.created` - Welcome email
- `password.reset.requested` - Password reset email
- `will.created` - Will creation confirmation
- `document.uploaded` - Document upload confirmation

## Default Templates

The service comes with pre-configured templates:
- `WELCOME_EMAIL` - Welcome new users
- `PASSWORD_RESET` - Password reset instructions
- `WILL_CREATED` - Will creation confirmation
- `DOCUMENT_UPLOADED` - Document upload confirmation
- `WILL_REMINDER` - SMS reminder to review wills
- `SECURITY_ALERT` - SMS security alerts

## Providers

### Email
- SMTP (Gmail, Outlook, etc.)
- SendGrid (API)
- AWS SES

### SMS
- Africa's Talking (Kenya)
- Twilio (International)

## Development

```bash
# Start in development mode
pnpm start:dev

# Run tests
pnpm test

# Build for production
pnpm build