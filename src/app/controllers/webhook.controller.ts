import { Context, Get, Post, HttpResponseOK, Config } from '@foal/core'
import * as Msal from '@azure/msal-node'

export class WebhookController {

  @Get('/issue-attributes')
  async authenticate(ctx: Context) {
    const credentialAttributes = Config.get('demoCredentialAttributes');
    console.log(`${ctx.request.method} ${ctx.request.path} using:\n${JSON.stringify(credentialAttributes,null,2)}`);
    return new HttpResponseOK(credentialAttributes)
  }

  @Post('/issue-succeeded')
  async issueSucceeded(ctx: Context) {
    console.log(`${ctx.request.method} ${ctx.request.path} body=${JSON.stringify(ctx.request.body, null, 2)}`);
    return new HttpResponseOK();
  }

  @Post('/verify-succeeded')
  async verifySucceeded(ctx: Context) {
    console.log(`${ctx.request.method} ${ctx.request.path} body=${JSON.stringify(ctx.request.body, null, 2)}`);
    return new HttpResponseOK();
  }
}

