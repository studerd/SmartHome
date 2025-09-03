import { SignInPayload } from './sign-in.payload';
import { ApiProperty } from '@nestjs/swagger';

export class SignUpPayload extends SignInPayload {
  @ApiProperty()
  mail: string;
}