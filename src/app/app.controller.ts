import { Hook, Context, controller, Get, dependency, render, Config, HttpResponseBadRequest, HttpResponseConflict, ValidateQueryParam } from '@foal/core';

import { ApiController } from './controllers';
import { Auth } from './services';
import axios from 'axios';
import { dirname } from 'path';

@Hook(() => response => {
  // Every response of this controller and its sub-controllers will be added this header.
  response.setHeader('Access-Control-Allow-Origin', '*');
})
export class AppController {
  @dependency
  authService: Auth;

  subControllers = [
    controller('/api', ApiController),
  ];

  private static operationIssue = "issue";
  private static operationVerify = "verify";
  private static operationRevoke = "revoke";

  @Get('/')
  private async index(ctx: Context) {
    const authConfig = Config.get("auth");
    let configured = true;
    for( const key in authConfig ) {
      const value = Config.get(`auth.${key}`);
      if( value == undefined || value.includes('<') || value.includes('>') || value.toLowerCase().includes('azure') ) {
        console.error(`ERROR: invalid config key auth.${key} "${value}"`);
        configured = false;
      }
    }
    let template = 'templates/not-configured.html';
    if( configured ) {
      template = 'templates/index.html';
    }
    return await render(template, {}, __dirname);
  }

  private async handleAqTouchpoint(ctx: Context, operation: string, revocationHandle: string = "" ) {
    const templateProperties = {
      operation: operation,
      api: Config.get("demoTouchpoints.api"),
      touchpointId: Config.get(`demoTouchpoints.${operation}`),
      title: `${operation} - &lt;aq-touchpoint/&gt;`,
      revocationHandle: revocationHandle
    };
     return await render('templates/aq-touchpoint.html', templateProperties, __dirname);
  }

  @Get('/aq-touchpoint-issue')
  async aqTouchpointIssue(ctx: Context) {
    return this.handleAqTouchpoint(ctx, AppController.operationIssue);
  }

  @Get('/aq-touchpoint-revoke')
  @ValidateQueryParam('revocationHandle', {type: 'string'}, {required: true})
  async aqTouchpointRevoke(ctx: Context) {
    return this.handleAqTouchpoint(ctx, AppController.operationRevoke, ctx.request.query.revocationHandle);
  }

  @Get('/aq-touchpoint-verify')
  async aqTouchpointVerify(ctx: Context) {
    return this.handleAqTouchpoint(ctx, AppController.operationVerify);
  }

  private async handleOpenTouchpoint( ctx: Context,  operation: string ) {
    // we need an auth token to use in our call to the AffinitiQuest API
    const token = await this.authService.getAccessToken();

    // prepare to make the API call
    const touchpointId = Config.get(`demoTouchpoints.${operation}`);
    const options = {
      url: `${Config.get("demoTouchpoints.api")}/api/touchpoint/${touchpointId}/open`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`      }
    };
    try {
      // make the API call to open the touchpoint
      const {data, status, headers} = await axios.request(options);
      if( status != 200 ) {
        return new HttpResponseBadRequest({status: status, error: data});
      }
      console.log( data );

      // use the data returned from the API call to render the template html
      return await render('templates/open-touchpoint.html', {
        touchpointId: touchpointId,
        title: `${operation} - Open Touchpoint`,
        brandLogo: data.brand.logo,
        touchpointTitle: data.touchpoint.title,
        qrcode: data.action.qrcode,
        wallet: "Microsoft Authenticator"
      }, __dirname);
    }
    catch( e ) {
      console.log( `handleOpenTouchpoint Failed`);
    }
    return new HttpResponseConflict();
  }

  @Get('/open-touchpoint-issue')
  async openTouchpointIssue(ctx: Context) {
    return await this.handleOpenTouchpoint(ctx, AppController.operationIssue);
  }

  @Get('/open-touchpoint-verify')
  async openTouchpointVerify(ctx: Context) {
    return await this.handleOpenTouchpoint(ctx, AppController.operationVerify);
  }

  @Get('/minimal-demo')
  async minimalDemo(ctx: Context) {
    return await render('templates/minimal-demo.html', {
      api: Config.get("demoTouchpoints.api"),
      touchpointId: Config.get(`demoTouchpoints.verify`),
    }, __dirname);
  }

  @Get('/service-desk')
  async serviceDesk(ctx: Context) {
    const templateProperties = {
      api: Config.get("demoTouchpoints.api"),
      touchpointId: Config.get(`demoTouchpoints.service-desk`)
    };
     return await render('templates/service-desk.html', templateProperties, __dirname);
  }

  @Get('/remote-device')
  async remoteDevice(ctx: Context) {
    const templateProperties = {
      api: Config.get("demoTouchpoints.api")
    };
    return await render('templates/remote-device.html', templateProperties, __dirname);
  }
}
