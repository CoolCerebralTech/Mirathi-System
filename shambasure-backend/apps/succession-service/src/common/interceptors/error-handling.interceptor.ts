import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    stack?: string;
  };
  timestamp: string;
  path: string;
}

interface PrismaError extends Error {
  code: string;
  meta?: unknown;
}

@Injectable()
export class ErrorHandlingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const path = request.url;
    const timestamp = new Date().toISOString();

    return next.handle().pipe(
      catchError((error: unknown) => {
        const errorResponse = this.transformError(error, path, timestamp);
        const status = this.getStatusCode(error);
        return throwError(() => new HttpException(errorResponse, status));
      }),
    );
  }

  private transformError(error: unknown, path: string, timestamp: string): ErrorResponse {
    // NestJS HttpException
    if (error instanceof HttpException) {
      const response = error.getResponse();

      return {
        success: false,
        error: {
          code: this.getErrorCode(error),
          message:
            typeof response === 'string'
              ? response
              : (response as { message?: string }).message || 'Unknown error',
          details:
            typeof response === 'object' ? { ...(response as Record<string, unknown>) } : undefined,
        },
        timestamp,
        path,
      };
    }

    // Prisma errors
    const prismaError = error as PrismaError;
    if (prismaError.code && prismaError.code.startsWith('P')) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: this.getPrismaErrorMessage(prismaError),
          details: {
            prismaCode: prismaError.code,
            meta: prismaError.meta,
          },
        },
        timestamp,
        path,
      };
    }

    // Generic errors
    const genericError = error as Error;
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message:
          process.env.NODE_ENV === 'production'
            ? 'An internal server error occurred'
            : genericError.message || 'Unknown error occurred',
        ...(process.env.NODE_ENV !== 'production' && { stack: genericError.stack }),
      },
      timestamp,
      path,
    };
  }

  private getStatusCode(error: unknown): number {
    if (error instanceof HttpException) {
      return error.getStatus();
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getErrorCode(error: HttpException): string {
    const status = error.getStatus();

    const statusCodeMap: Record<number, string> = {
      400: 'VALIDATION_ERROR',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'BUSINESS_RULE_VIOLATION',
      500: 'INTERNAL_ERROR',
    };

    return statusCodeMap[status] || 'UNKNOWN_ERROR';
  }

  private getPrismaErrorMessage(error: PrismaError): string {
    const prismaErrorMessages: Record<string, string> = {
      P2002: 'A record with this unique constraint already exists',
      P2003: 'Foreign key constraint failed',
      P2025: 'Record not found',
      P2014: 'The change you are trying to make would violate a required relation',
    };

    return prismaErrorMessages[error.code] || 'Database operation failed';
  }
}
