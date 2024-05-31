import { Context, Get, HttpResponse, HttpResponseOK, ValidatePathParam, dependency } from '@foal/core'
import { Auth } from '../services';
import { z } from 'zod';
import { generateSchema } from '@anatine/zod-openapi';

export class AuthController {

  @dependency
  authService: Auth;

  @Get('/:touchpointId')
  @ValidatePathParam('touchpointId', generateSchema(z.string().uuid()))
  async authenticate(ctx: Context, {touchpointId}: {touchpointId: string}) : Promise<HttpResponse> {
    const token = await this.authService.getAccessToken(touchpointId);
    if( typeof token === 'string' ) {
      return new HttpResponseOK(token)
    }
    return token;
  }

}
