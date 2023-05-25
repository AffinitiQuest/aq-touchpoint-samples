import { Hook, Context, controller, Get, dependency, render, Config, HttpResponseBadRequest, HttpResponseConflict } from '@foal/core';

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

  private async handleAqTouchpoint(ctx: Context, operation: string ) {
     return await render('templates/aq-touchpoint.html', {
      api: Config.get("demoTouchpoints.api"),
      touchpointId: Config.get(`demoTouchpoints.${operation}`),
      title: `${operation} - &lt;aq-touchpoint/&gt;`
    }, __dirname);
  }

  @Get('/aq-touchpoint-issue')
  async aqTouchpointIssue(ctx: Context) {
    return this.handleAqTouchpoint(ctx, AppController.operationIssue);
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

}
