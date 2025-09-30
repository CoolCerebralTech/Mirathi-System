import { All, Controller, Req, Res, UseGuards } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@shamba/config';
import { JwtAuthGuard } from '@shamba/auth';
import { Request, Response } from 'express';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsProxyController {
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get('DOCUMENTS_SERVICE_URL');
  }

  @All('*')
  async proxy(@Req() req: Request, @Res() res: Response) {
    const { method, originalUrl, headers, body } = req;
    const headersToForward = { ...headers };
    delete headersToForward['host'];

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
        res.status(503).json({ message: 'Service unavailable', service: 'documents-service' });
      }
    }
  }
}