// set-will-storage.dto.ts
import { WillStorageLocation } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class SetWillStorageDto {
  @IsEnum(WillStorageLocation)
  storageLocation: WillStorageLocation;

  @IsString()
  @IsOptional()
  storageDetails?: string;
}
