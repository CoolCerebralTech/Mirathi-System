# Auditing Service

Comprehensive audit trail and compliance logging service for Shamba Sure platform.

## Features

- **Immutable audit logging** for all system events
- **Security event detection** and alerting
- **Compliance reporting** with export capabilities
- **Real-time monitoring** of system activities
- **Suspicious activity detection**
- **User behavior analysis**

## API Endpoints

### Audit Logs (Admin only)
- `GET /audit/logs` - Get audit logs with filtering
- `GET /audit/logs/:id` - Get specific audit log
- `GET /audit/summary` - Get audit summary for period
- `GET /audit/user-activity/:userId` - Get user activity report
- `GET /audit/service-stats/:service` - Get service statistics

### Security Events (Admin only)
- `GET /audit/security-events` - Get open security events
- `POST /audit/security-events/:id/resolve` - Resolve security event

### Reports (Admin only)
- `GET /audit/reports/export` - Export audit report (ZIP with CSV/JSON)
- `GET /audit/reports/detailed` - Get detailed audit report
- `POST /audit/cleanup` - Clean up old audit logs

## Event Consumption

The service automatically consumes events from:
- User management events
- Succession planning events  
- Document management events
- Notification events

## Security Features

- **Automatic suspicious activity detection**
- **Failed login monitoring**
- **Unauthorized access tracking**
- **Security event prioritization**
- **Real-time alerting**

## Compliance

- **GDPR-ready** with data sanitization
- **Immutable logs** for legal compliance
- **Comprehensive reporting** for audits
- **Data retention** policies

## Development

```bash
# Start in development mode
pnpm start:dev

# Run tests
pnpm test

# Build for production
pnpm build