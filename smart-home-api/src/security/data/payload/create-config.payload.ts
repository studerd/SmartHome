import { CredentialDataPayload } from './credential-data.payload';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConfigPayload {
  @ApiProperty()
  id: string;
  @ApiProperty()
  superAdminData: CredentialDataPayload;
}
