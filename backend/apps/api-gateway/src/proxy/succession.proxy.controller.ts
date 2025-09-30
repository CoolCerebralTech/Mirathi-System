import { All, Controller, Req, Res, UseGuards } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@shamba/config';
import { JwtAuthGuard } from '@shamba/auth';
import { Request, Response } from 'express';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

// ============================================================================
// Shamba Sure - Succession Service Proxy Controller
// ============================================================================
// This controller captures all requests targeted for the succession service
// (wills, assets, families) and forwards them. It ensures all requests
// are authenticated by default.
// ============================================================================

@Controller(['wills', 'assets', 'families']) // Catches all relevant prefixes
@UseGuards(JwtAuthGuard) // Protects all routes in this controller by default
export class SuccessionProxyController {
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get('SUCCESSION_SERVICE_URL');
  }

  /**
   * A wildcard route that captures all methods (GET, POST, PUT, DELETE, etc.)
   * and all sub-paths for the specified prefixes.
   */
  @All('*')
  async proxy(@Req() req: Request, @Res() res: Response): Promise<void> {
    const { method, originalUrl, headers, body } = req;

    // Prepare headers for forwarding. Remove headers that can cause issues.
    const headersToForward = { ...headers };
    delete headersToForward['host'];
    delete headersToForward['connection'];
    delete headersToForward['content-length']; // Let the http client recalculate this

    try {
      // Use the HttpService to make the downstream request.
      const response = await firstValueFrom(
        this.httpService.request({
          method,
          url: `${this.baseUrl}${originalUrl}`,
          headers: headersToForward,
          data: body,
          validateStatus: () => true, // Pass through all status codes
        }),
      );
      
      // Forward the response from the downstream service back to the original client.
      res.status(response.status).json(response.data);
    } catch (error) {
      // If the downstream service is unreachable, return a 503 Service Unavailable.
      // The GlobalExceptionFilter will format this nicely.
      if (error instanceof AxiosError && error.response) {
        res.status(error.response.status).json(error.response.data);
      } else {
        res.status(503).json({
          statusCode: 503,
          message: `The ${this.getServiceName(originalUrl)} is temporarily unavailable.`,
          error: 'Service Unavailable',
        });
      }
    }
  }

  private getServiceName(url: string): string {
    if (url.startsWith('/wills')) return 'Wills Service';
    if (url.startsWith('/assets')) return 'Assets Service';
    if (url.startsWith('/families')) return 'Families Service';
    return 'downstream service';
  }
}