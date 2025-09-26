import { 
  Controller, 
  All, 
  Req, 
  Res, 
  HttpStatus,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { 
  ApiExcludeController, 
  ApiTags, 
  ApiOperation, 
  ApiResponse,
} from '@nestjs/swagger';
import { ProxyService } from '../services/proxy.service';
import { GatewayAuthGuard } from '../guards/gateway-auth.guard';
import { ResponseTransformInterceptor } from '../interceptors/response-transform.interceptor';
import { Public } from '../decorators/public.decorator';
import { LoggerService } from '@shamba/observability';

@ApiTags('Gateway')
@ApiExcludeController() // Hide from Swagger since it's a proxy
@Controller('*') // Catch all routes
@UseInterceptors(ResponseTransformInterceptor)
export class GatewayController {
  constructor(
    private proxyService: ProxyService,
    private logger: LoggerService,
  ) {}

  @All()
  @UseGuards(GatewayAuthGuard)
  @ApiOperation({ summary: 'Proxy request to appropriate microservice' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Request proxied successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Authentication required' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Service not found' })
  @ApiResponse({ status: HttpStatus.SERVICE_UNAVAILABLE, description: 'Service unavailable' })
  async proxyRequest(@Req() req: Request, @Res() res: Response) {
    const startTime = Date.now();

    try {
      const proxyRequest = {
        id: req.headers['x-request-id'] as string,
        method: req.method,
        url: req.url,
        headers: this.getHeaders(req),
        body: req.body,
        timestamp: new Date(),
        user: (req as any).user,
      };

      const proxyResponse = await this.proxyService.proxyRequest(proxyRequest);

      // Set response headers
      Object.entries(proxyResponse.headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      // Add gateway headers
      res.setHeader('x-gateway-processed', 'true');
      res.setHeader('x-gateway-duration', `${proxyResponse.duration}ms`);

      // Send response
      res.status(proxyResponse.status).json(proxyResponse.body);

      this.logger.debug(`Request proxied successfully: ${req.method} ${req.url}`, 'GatewayController', {
        duration: proxyResponse.duration,
        statusCode: proxyResponse.status,
        service: this.getServiceNameFromUrl(req.url),
        correlationId: req.headers['x-correlation-id'],
      });

    } catch (error) {
      const duration = Date.now() - startTime;

      this.logger.error(`Gateway proxy failed: ${req.method} ${req.url}`, 'GatewayController', {
        error: error.message,
        duration,
        correlationId: req.headers['x-correlation-id'],
      });

      // Re-throw the error to be handled by the exception filter
      throw error;
    }
  }

  private getHeaders(req: Request): Record<string, string> {
    const headers: Record<string, string> = {};

    Object.keys(req.headers).forEach(key => {
      const value = req.headers[key];
      if (value && typeof value === 'string') {
        headers[key] = value;
      } else if (Array.isArray(value)) {
        headers[key] = value.join(', ');
      }
    });

    return headers;
  }

  private getServiceNameFromUrl(url: string): string {
    const segments = url.split('/').filter(segment => segment);
    return segments[0] || 'unknown';
  }
}