import { Context, Get, HttpResponseOK, dependency } from '@foal/core'
import { Auth } from '../services';

export class AuthController {

  @dependency
  authService: Auth;

  @Get('/')
  async authenticate(ctx: Context) {
    const token = await this.authService.getAccessToken();
    return new HttpResponseOK(token)
  }

}
