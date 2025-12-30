import { IQuery } from '@nestjs/cqrs';

import { GetGiftsInterVivosDto } from '../dtos/gifts/get-gifts-inter-vivos.dto';

export class GetGiftsInterVivosQuery implements IQuery {
  constructor(
    public readonly dto: GetGiftsInterVivosDto,
    public readonly userId: string,
    public readonly correlationId?: string,
  ) {}
}
