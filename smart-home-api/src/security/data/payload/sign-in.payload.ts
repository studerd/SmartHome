import { ApiProperty } from '@nestjs/swagger';

export class SignInPayload {
  @ApiProperty()
  username: string;
  @ApiProperty()
  password: string;
  @ApiProperty()
  biometricData?: number[];
}