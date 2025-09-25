import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { LoggerService } from './logger.service';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  constructor(private logger: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const correlationId = req.headers['x-correlation-id'] as string || uuidv4();

    // Set correlation ID in context
    this.logger.setContext('correlationId', correlationId);

    // Add correlation ID to response headers
    res.setHeader('x-correlation-id', correlationId);

    // Log request start
    this.logger.debug(`Started ${req.method} ${req.url}`, 'http', {
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
      if (duration > 1000) {
        this.logger.warn(`Slow request: ${req.method} ${req.url} took ${duration}ms`, 'performance');
      }

      // Log errors
      if (res.statusCode >= 400) {
        this.logger.error(`Request failed: ${req.method} ${req.url} ${res.statusCode}`, 'http');
      }
    });

    next();
  }
}