import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

interface AuditLog {
  timestamp: string;
  userId?: string;
  action: string;
  userAgent?: string;
  ipAddress?: string;
  resource: string;
  parameters: Record<string, unknown>;
  body: Record<string, unknown>;
}

interface ResponseLog extends AuditLog {
  responseTimestamp: string;
  status: string;
  responseSize?: number;
}

@Injectable()
export class AuditLoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, body, params } = request;
    const timestamp = new Date().toISOString();

    // Log request details
    const auditLog: AuditLog = {
      timestamp,
      userId: user?.id,
      action: `${method} ${url}`,
      userAgent: request.get('User-Agent'),
      ipAddress: request.ip,
      resource: this.getResourceFromUrl(url),
      parameters: this.sanitizeParameters(params),
      body: this.sanitizeBody(body),
    };

    console.log('AUDIT_LOG:', auditLog);

    return next.handle().pipe(
      tap((response: unknown) => {
        // Log successful response
        const responseLog: ResponseLog = {
          ...auditLog,
          responseTimestamp: new Date().toISOString(),
          status: 'SUCCESS',
          responseSize: response ? JSON.stringify(response).length : undefined,
        };

        console.log('AUDIT_RESPONSE:', responseLog);

        // In production, this would send to auditing service
        this.sendToAuditingService(responseLog);
      }),
    );
  }

  private getResourceFromUrl(url: string): string {
    const segments = url.split('/').filter((segment) => segment);
    if (segments.length >= 2) {
      return `${segments[0]}/${segments[1]}`; // e.g., 'wills/123'
    }
    return url;
  }

  private sanitizeParameters(params: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...params };
    // Remove sensitive parameters
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.authorization;
    return sanitized;
  }

  private sanitizeBody(body: unknown): Record<string, unknown> {
    if (!body || typeof body !== 'object') {
      return {};
    }

    const sanitized = { ...(body as Record<string, unknown>) };
    // Remove sensitive fields
    delete sanitized.password;
    delete sanitized.creditCard;
    delete sanitized.socialSecurityNumber;
    delete sanitized.identityDocument;

    // Limit large fields
    if (typeof sanitized.content === 'string' && sanitized.content.length > 100) {
      sanitized.content = sanitized.content.substring(0, 100) + '...';
    }

    return sanitized;
  }

  private sendToAuditingService(log: ResponseLog): void {
    // In production, this would integrate with your auditing service
    // For now, just log to console
    // Example: this.auditingService.recordAuditLog(log);
  }
}
