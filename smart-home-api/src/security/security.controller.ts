import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { SecurityService } from './service';
import { Credential, RefreshPayload, SignInPayload, SignUpPayload } from './data';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public, User } from '@common';

@ApiBearerAuth('access-token')
@ApiTags('Account')
@Controller('account')
export class SecurityController {
  constructor(private readonly service: SecurityService) {
  }

  @Public()
  @Post('signin')
  public signIn(@Body() payload: SignInPayload) {
    return this.service.signIn(payload);
  }

  @Public()
  @Post('signup')
  public signUp(@Body() payload: SignUpPayload) {
    return this.service.signup(payload);
  }

  @Public()
  @Post('refresh')
  public refresh(@Body() payload: RefreshPayload) {
    return this.service.refresh(payload);
  }

  @Get('me')
  public me(@User() user: Credential) {
    return user;
  }

  @Delete('delete/:id')
  public delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
