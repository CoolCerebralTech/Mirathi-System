import { IsNotEmpty, IsString } from 'class-validator';

export class SignWillDto {
  @IsString()
  @IsNotEmpty()
  willId: string;

  @IsString()
  @IsNotEmpty()
  signatureData: string; // Base64, Hash, or URL from Digital Signature Provider

  @IsString()
  @IsNotEmpty()
  signerId: string; // User ID of Testator or Witness
}
