import { ApiProperty } from '@nestjs/swagger';
import { BiometricData } from '../model';

export class CredentialDataPayload {
  @ApiProperty()
  id?: string;
  @ApiProperty()
  username: string;
  @ApiProperty()
  password: string;
  @ApiProperty()
  mail: string;
  @ApiProperty()
  biometricData?: BiometricData;
}