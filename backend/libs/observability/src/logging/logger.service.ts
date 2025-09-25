import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import pino, { Logger, DestinationStream } from 'pino';
import { ShambaConfigService } from '@shamba/config';
import { LogEntry, LoggingConfig } from '../interfaces/observability.interface';
import { AsyncLocalStorage } from 'async_hooks';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: Logger;
  private storage: AsyncLocalStorage<Map<string, string>>;

  constructor(private configService: ShambaConfigService) {
    this.storage = new AsyncLocalStorage<Map<string, string>>();
    this.initializeLogger();
  }

  private initializeLogger() {
    const config = this.configService.logging;
    const options: pino.LoggerOptions = {
      level: config.level,
      formatters: {
        level: (label) => ({ level: label }),
        bindings: (bindings) => ({
          pid: bindings.pid,
          hostname: bindings.hostname,
          service: this.configService.app.name,
          version: this.configService.app.version,
          environment: this.configService.app.environment,
        }),
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      messageKey: 'message',
      errorKey: 'error',
    };

    if (config.format === 'pretty') {
      options.transport = {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      };
    }

    // Redact sensitive information
    options.redact = {
      paths: [
        'password',
        '*.password',
        'token',
        '*.token',
        'authorization',
        '*.authorization',
        'secret',
        '*.secret',
      ],
      censor: '***REDACTED***',
    };

    this.logger = pino(options);
  }

  private getContext(): Record<string, any> {
    const store = this.storage.getStore();
    const context: Record<string, any> = {};

    if (store) {
      for (const [key, value] of store.entries()) {
        context[key] = value;
      }
    }

    return context;
  }

  setContext(key: string, value: string): void {
    let store = this.storage.getStore();
    if (!store) {
      store = new Map();
      this.storage.enterWith(store);
    }
    store.set(key, value);
  }

  getContextValue(key: string): string | undefined {
    const store = this.storage.getStore();
    return store?.get(key);
  }

  runWithContext<T>(context: Record<string, string>, fn: () => T): T {
    const store = new Map<string, string>(Object.entries(context));
    return this.storage.run(store, fn);
  }

  log(message: string, context?: string, ...args: any[]) {
    this.info(message, context, ...args);
  }

  error(message: string, context?: string, ...args: any[]) {
    const error = args.find(arg => arg instanceof Error);
    const additional = args.filter(arg => !(arg instanceof Error));
    
    this.logger.error({
      ...this.getContext(),
      context,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : undefined,
      additional: additional.length > 0 ? additional : undefined,
    }, message);
  }

  warn(message: string, context?: string, ...args: any[]) {
    this.logger.warn({
      ...this.getContext(),
      context,
      additional: args.length > 0 ? args : undefined,
    }, message);
  }

  info(message: string, context?: string, ...args: any[]) {
    this.logger.info({
      ...this.getContext(),
      context,
      additional: args.length > 0 ? args : undefined,
    }, message);
  }

  debug(message: string, context?: string, ...args: any[]) {
    this.logger.debug({
      ...this.getContext(),
      context,
      additional: args.length > 0 ? args : undefined,
    }, message);
  }

  verbose(message: string, context?: string, ...args: any[]) {
    this.logger.trace({
      ...this.getContext(),
      context,
      additional: args.length > 0 ? args : undefined,
    }, message);
  }

  fatal(message: string, context?: string, ...args: any[]) {
    this.logger.fatal({
      ...this.getContext(),
      context,
      additional: args.length > 0 ? args : undefined,
    }, message);
  }

  // Structured logging methods
  businessEvent(event: string, data: Record<string, any>) {
    this.info(event, 'business', data);
  }

  securityEvent(event: string, data: Record<string, any>) {
    this.warn(event, 'security', data);
  }

  performanceEvent(operation: string, duration: number, data?: Record<string, any>) {
    this.debug(`${operation} completed in ${duration}ms`, 'performance', {
      duration,
      operation,
      ...data,
    });
  }

  httpRequest(log: {
    method: string;
    url: string;
    statusCode: number;
    responseTime: number;
    userAgent?: string;
    ip?: string;
    userId?: string;
  }) {
    const level = log.statusCode >= 500 ? 'error' : 
                 log.statusCode >= 400 ? 'warn' : 'info';

    this.logger[level]({
      ...this.getContext(),
      context: 'http',
      http: {
        method: log.method,
        url: log.url,
        status_code: log.statusCode,
        response_time: log.responseTime,
        user_agent: log.userAgent,
        ip: log.ip,
      },
      user: log.userId ? { id: log.userId } : undefined,
    }, `HTTP ${log.method} ${log.url} ${log.statusCode}`);
  }

  // Child logger for specific contexts
  createChildLogger(context: string): LoggerService {
    const childService = new LoggerService(this.configService);
    (childService as any).logger = this.logger.child({ context });
    return childService;
  }

  // Flush logs (important for pino with transports)
  async flush(): Promise<void> {
    if (this.logger.flush) {
      await this.logger.flush();
    }
  }
}