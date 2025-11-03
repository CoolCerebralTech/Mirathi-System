import { All, Controller, Req, Res, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ProxyService } from '../../2_application/services/proxy.service';

@Controller() // A blank @Controller() path makes it the root controller
export class ProxyController {
  private readonly logger = new Logger(ProxyController.name);

  constructor(private readonly proxyService: ProxyService) {}

  /**
   * Catch-all route handler.
   * Intercepts all incoming requests and forwards them to the ProxyService.
   * @param req The incoming Express request object.
   * @param res The outgoing Express response object.
   */
  @All('*') // This decorator is the key to catching every request
  async proxyRequest(@Req() req: Request, @Res() res: Response): Promise<void> {
    try {
      // 1. Delegate all work to the application layer service
      const proxyResponse = await this.proxyService.proxyRequest(req);

      // 2. Set headers from the downstream service's response
      // Important for forwarding things like Content-Type, custom headers, etc.
      if (proxyResponse.headers) {
        Object.entries(proxyResponse.headers).forEach(([key, value]) => {
          // Avoid setting headers that are automatically handled, like 'transfer-encoding'
          if (key.toLowerCase() === 'transfer-encoding' || value == null) {
            return;
          }

          // Only forward safe header types
          if (typeof value === 'string' || typeof value === 'number') {
            res.setHeader(key, value);
          } else if (Array.isArray(value)) {
            res.setHeader(key, value.map(String));
          } else {
            // Skip unsafe header values (objects, functions, etc.)
            this.logger.debug(
              `Skipping unsafe header [${key}] with unsupported type: ${typeof value}`,
            );
          }
        });
      }

      // 3. Send the final response to the client
      res.status(proxyResponse.status).json(proxyResponse.data);
    } catch (error: unknown) {
      // If proxyService throws an error (like NotFoundException),
      // it will be caught by our AllExceptionsFilter. We just re-throw it here
      // to let the global filter handle it consistently.
      if (error instanceof Error) {
        this.logger.debug(`Error caught in controller, passing to global filter: ${error.message}`);
      } else {
        this.logger.debug(
          `Error caught in controller, passing to global filter: ${JSON.stringify(error)}`,
        );
      }
      throw error;
    }
  }
}
