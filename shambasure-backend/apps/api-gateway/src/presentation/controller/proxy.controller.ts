import { All, Controller, Req, Res, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiExcludeController } from '@nestjs/swagger';
import { ProxyService } from '../../application/services/proxy.service';

@ApiExcludeController()
@Controller() // keep root; global prefix will be applied by Nest
export class ProxyController {
  private readonly logger = new Logger(ProxyController.name);

  constructor(private readonly proxyService: ProxyService) {}

  // use a named star param to satisfy path-to-regexp v8
  @All('/*path')
  async proxyRequest(@Req() req: Request, @Res() res: Response): Promise<void> {
    try {
      const proxyResponse = await this.proxyService.proxyRequest(req);

      if (proxyResponse.headers) {
        Object.entries(proxyResponse.headers).forEach(([key, value]) => {
          if (
            ['transfer-encoding', 'content-length'].includes(key.toLowerCase()) ||
            value == null
          ) {
            return;
          }
          if (typeof value === 'string' || typeof value === 'number') {
            res.setHeader(key, value);
          } else if (Array.isArray(value)) {
            res.setHeader(key, value.map(String));
          } else {
            this.logger.debug(`Skipping unsafe header [${key}]`);
          }
        });
      }

      res.status(proxyResponse.status).send(proxyResponse.data);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.debug(`Error in proxy: ${error.message}`);
      } else {
        this.logger.debug(`Error in proxy: ${JSON.stringify(error)}`);
      }
      throw error;
    }
  }
}
