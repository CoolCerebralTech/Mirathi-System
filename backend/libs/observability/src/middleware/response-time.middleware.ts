import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class ResponseTimeMiddleware implements NestMiddleware {
  constructor(private metricsService: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const route = this.getRouteName(req);

      this.metricsService.recordHttpRequest(
        req.method,
        route,
        res.statusCode,
        duration,
      );
    });

    next();
  }

  private getRouteName(req: Request): string {
    // Extract route name from request
    const path = req.route?.path || req.path;
    
    // Convert route parameters to placeholders
    return path.replace(/:[^/]+/g, ':param');
  }
}