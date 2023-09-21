import { Context, Get, Post, HttpResponseOK, Config, ValidateQueryParam, HttpResponseBadRequest } from '@foal/core'
import axios from 'axios';
import signed from 'signed';

export class WebhookController {

  private signature = signed({secret: Config.get('url.signatureSecret'), hash: 'sha256', ttl: 60*60*24});

  /**
   * @method validateJwt
   * @param ctx 
   * @description Upon issue-attributes, issue-succeeded or verify-succeeded, use the AQ API to validate the received JWT
   */
  private async validateJwt( ctx: Context, touchpointId: string, jwt: any ) : Promise<any>{
    const options = {
      url: `${Config.getOrThrow('demoTouchpoints.api', 'string')}/api/touchpoint/${touchpointId}/validate-claims-jwt`,
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'      
      },
      data: {jwt: jwt}
    };
    try {
        const {data, status} = await axios.request(options);
        if( status != 200 ) {
          console.log( `${ctx.request.method} ${ctx.request.path} - Validate ClaimsJwt FAILED status=${status}`);
          throw new Error(JSON.stringify(data));
        }
        else {
          console.log( `${ctx.request.method} ${ctx.request.path} - Validate ClaimsJwt SUCCESS!`);
          return data;
        }
    }
    catch( e: any ) {
      console.log( `${ctx.request.method} ${ctx.request.path} - Validate ClaimsJwt EXCEPTION=${JSON.stringify(e,null,2)}`);
      throw new Error(e.message);
    }
  }

  /**
   * @method issueAttributes
   * @param ctx 
   * @description This webhook is invoked by the AQ API when an issuance requires claims attributes to be provided. 
   */
  @Get('/issue-attributes') // try: https://touchpoint-demo.ngrok.io/api/webhook/issue-attributes
  @ValidateQueryParam('touchpointId', {type: 'string', minLength: 1}, {required: true})
  @ValidateQueryParam('jwt', {type: 'string', minLength: 1}, {required: true})
  @ValidateQueryParam('appContext', {type: 'string', minLength: 1}, {required: true})
  async issueAttributes(ctx: Context) {
    const touchpointId = ctx.request.query.touchpointId;
    const jwt = ctx.request.query.jwt;
    const signedAppContext = ctx.request.query.appContext;
    try {
      // the appContext was signed, verify and remove signature before proceeding
      const appContext = this.signature.verify(signedAppContext);
      // validate the provided jwt before proceeding. We are not doing anything with the content of the JWT here.
      await this.validateJwt(ctx, touchpointId, jwt);
      // get the credential attributes to provide in the response from configuration
      const credentialAttributes = Config.get('demoCredentialAttributes');
      // see if the appContext matches the email in the demoCredentialAttributes
      if( credentialAttributes.Email != appContext ) {
        console.log(`${ctx.request.method} ${ctx.request.path} Invalid appContext=${appContext}`);
        return new HttpResponseBadRequest({reason: `invalid appContext=${appContext}`});
      }
      console.log(`${ctx.request.method} ${ctx.request.path} using:\n${JSON.stringify(credentialAttributes,null,2)}`);
      return new HttpResponseOK(credentialAttributes)
    }
    catch( e: any ) {
      return new HttpResponseBadRequest(e.message);
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
    try {
      await this.validateJwt(ctx, ctx.request.body.touchpoint.id, ctx.request.body.claimsJwt);
    }
    catch( e: any ) {
      return new HttpResponseBadRequest(e.message);
    }
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
    try {
      await this.validateJwt(ctx, ctx.request.body.touchpoint.id, ctx.request.body.claimsJwt);
    }
    catch( e: any ) {
      return new HttpResponseBadRequest(e.message);
    }
    return new HttpResponseOK();
  }
}

