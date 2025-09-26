import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private helmetMiddleware = helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    xssFilter: true,
    frameguard: { action: 'deny' },
  });

  private compressionMiddleware = compression({
    level: 6,
    threshold: 1024,
  });

  private globalRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    message: {
      error: 'Too many requests',
      message: 'Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  use(req: Request, res: Response, next: NextFunction) {
    // Apply security middleware in sequence
    this.helmetMiddleware(req, res, () => {
      this.compressionMiddleware(req, res, () => {
        this.globalRateLimit(req, res, next);
      });
    });
  }
}