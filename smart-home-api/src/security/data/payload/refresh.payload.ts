import { ApiProperty } from '@nestjs/swagger';

export class RefreshPayload {
  @ApiProperty()
  refresh: string;
}