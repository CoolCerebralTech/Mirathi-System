// enable-will-encryption.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';

export class EnableWillEncryptionDto {
  @IsString()
  @IsNotEmpty()
  encryptionKeyId: string;
}
