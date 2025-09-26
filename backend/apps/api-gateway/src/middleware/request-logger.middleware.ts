import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { LoggerService } from '@shamba/observability';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  constructor(private logger: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const requestId = uuidv4();
    const correlationId = req.headers['x-correlation-id'] as string || uuidv4();

    // Set request ID and correlation ID
    req.headers['x-request-id'] = requestId;
    req.headers['x-correlation-id'] = correlationId;

    // Add to response headers
    res.setHeader('x-request-id', requestId);
    res.setHeader('x-correlation-id', correlationId);

    // Log request start
    this.logger.debug(`Incoming request: ${req.method} ${req.url}`, 'RequestLogger', {
      requestId,
      correlationId,
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Capture response details
    res.on('finish', () => {
      const duration = Date.now() - startTime;

      this.logger.httpRequest({
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        responseTime: duration,
        userAgent: req.get('user-agent'),
        ip: req.ip,
        userId: (req as any).user?.userId,
      });

      // Log slow requests
      if (duration > 5000) { // 5 seconds
        this.logger.warn(`Slow request: ${req.method} ${req.url} took ${duration}ms`, 'RequestLogger', {
          requestId,
          duration,
        });
      }

      // Log errors
      if (res.statusCode >= 400) {
        this.logger.error(`Request failed: ${req.method} ${req.url} ${res.statusCode}`, 'RequestLogger', {
          requestId,
          statusCode: res.statusCode,
          duration,
        });
      }
    });

    next();
  }
}