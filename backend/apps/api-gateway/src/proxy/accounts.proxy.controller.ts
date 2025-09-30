import { All, Controller, Req, Res, UseGuards } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@shamba/config';
import { Public, JwtAuthGuard } from '@shamba/auth';
import { Request, Response } from 'express';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

@Controller(['auth', 'profile', 'users']) // Catches all relevant prefixes for the accounts-service
export class AccountsProxyController {
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get('ACCOUNTS_SERVICE_URL');
  }

  // --- Allow public access to specific auth routes ---
  @Public() @All('auth/login')
  async proxyLogin(@Req() req: Request, @Res() res: Response) {
    await this.proxyRequest(req, res);
  }

  @Public() @All('auth/register')
  async proxyRegister(@Req() req: Request, @Res() res: Response) {
    await this.proxyRequest(req, res);
  }

  @Public() @All('auth/refresh')
  async proxyRefresh(@Req() req: Request, @Res() res: Response) {
    await this.proxyRequest(req, res);
  }
  
  @Public() @All('auth/forgot-password')
  async proxyForgotPassword(@Req() req: Request, @Res() res: Response) {
    await this.proxyRequest(req, res);
  }
  
  @Public() @All('auth/reset-password')
  async proxyResetPassword(@Req() req: Request, @Res() res: Response) {
    await this.proxyRequest(req, res);
  }


  // --- All other routes are protected by the JWT guard ---
  @UseGuards(JwtAuthGuard)
  @All('*')
  async proxyRequest(@Req() req: Request, @Res() res: Response) {
    const { method, originalUrl, headers, body } = req;
    
    // Clean up headers for forwarding
    const headersToForward = { ...headers };
    delete headersToForward['host'];
    delete headersToForward['connection'];

    try {
      const response = await firstValueFrom(
        this.httpService.request({
          method,
          url: `${this.baseUrl}${originalUrl}`,
          headers: headersToForward,
          data: body,
          validateStatus: () => true,
        }),
      );
      res.status(response.status).json(response.data);
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        res.status(error.response.status).json(error.response.data);
      } else {
        res.status(503).json({ message: 'Service unavailable', service: 'accounts-service' });
      }
    }
  }
}