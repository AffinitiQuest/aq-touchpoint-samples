import { Context, Get, Post, HttpResponseOK, Config } from '@foal/core'
import axios from 'axios';

export class WebhookController {

  /**
   * @method issueAttributes
   * @param ctx
   * @description This webhook is invoked by the AQ API when an issuance requires claims attributes to be provided.
   */
  @Get('/issue-attributes') // try: https://touchpoint-demo.ngrok.io/api/webhook/issue-attributes
  async issueAttributes(ctx: Context) {
    // get the credential attributes to provide in the response from configuration
    const credentialAttributes = Config.get('demoCredentialAttributes');
    console.log(`${ctx.request.method} ${ctx.request.path} using:\n${JSON.stringify(credentialAttributes,null,2)}`);
    return new HttpResponseOK(credentialAttributes)
  }

  /**
   * @method validateClaimsJwt
   * @param ctx
   * @description Upon issue-succeeded or verify-succeeded, use the AQ API to validate the received claims JWT
   */
  private async validateClaimsJwt( ctx: Context ) {
    const options = {
      url: `${Config.get('demoTouchpoints.api')}/api/touchpoint/${ctx.request.body.touchpoint.id}/validate-claims-jwt`,
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      data: {jwt: ctx.request.body.claimsJwt}
    };
    try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const {data, status, headers} = await axios.request(options);
        if( status != 200 ) {
          console.log( `${ctx.request.method} ${ctx.request.path} - Validate ClaimsJwt FAILED status=${status}`);
        }
        else {
          console.log( `${ctx.request.method} ${ctx.request.path} - Validate ClaimsJwt SUCCESS!`);
        }
    }
    catch( e ) {
      console.log( `${ctx.request.method} ${ctx.request.path} - Validate ClaimsJwt EXCEPTION=${JSON.stringify(e,null,2)}`);
    }
  }

  /**
   * @method issueSucceeded
   * @param ctx
   * @description This webhook is invoked by the AQ API when an issuance succeeds. The request body includes the claims JWT
   */
  @Post('/issue-succeeded') // try: https://touchpoint-demo.ngrok.io/api/webhook/issue-succeeded
  async issueSucceeded(ctx: Context) {
    console.log(`${ctx.request.method} ${ctx.request.path} body=${JSON.stringify(ctx.request.body, null, 2)}`);
    await this.validateClaimsJwt(ctx);
    return new HttpResponseOK();
  }

  /**
   * @method revokeSucceeded
   * @param ctx
   * @description This webhook is invoked by the AQ API when an issuance succeeds. The request body includes the claims JWT
   */
  @Post('/revoke-succeeded') // try: https://touchpoint-demo.ngrok.io/api/webhook/revoke-succeeded
  async revokeSucceeded(ctx: Context) {
    console.log(`${ctx.request.method} ${ctx.request.path} body=${JSON.stringify(ctx.request.body, null, 2)}`);
    return new HttpResponseOK();
  }

  /**
   * @method verifySucceeded
   * @param ctx
   * @description This webhook is invoked by the AQ API when a verification succeeds. The request body includes the claims JWT
   */
  @Post('/verify-succeeded') // try: https://touchpoint-demo.ngrok.io/api/webhook/verify-succeeded
  async verifySucceeded(ctx: Context) {
    console.log(`${ctx.request.method} ${ctx.request.path} body=${JSON.stringify(ctx.request.body, null, 2)}`);
    await this.validateClaimsJwt(ctx);
    return new HttpResponseOK();
  }
}
