// commands/assets/update-asset-location.command.ts
import { ICommand } from '@nestjs/cqrs';
import { KenyanCounty } from '@prisma/client';

import { GPSCoordinatesDto } from '../../dto/requests/create-asset.dto';

export class UpdateAssetLocationCommand implements ICommand {
  constructor(
    public readonly assetId: string,
    public readonly estatePlanningId: string,
    public readonly county: KenyanCounty,
    public readonly subCounty?: string,
    public readonly ward?: string,
    public readonly village?: string,
    public readonly landReferenceNumber?: string,
    public readonly gpsCoordinates?: GPSCoordinatesDto,
    public readonly correlationId?: string,
  ) {}
}
