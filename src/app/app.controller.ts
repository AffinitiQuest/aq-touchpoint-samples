import { Hook, Context, controller, Get, dependency, render, Config, HttpResponseBadRequest, HttpResponseConflict, ValidateQueryParam, HttpResponseOK, ValidatePathParam } from '@foal/core';

import { ApiController } from './controllers';
import { Auth } from './services';
import axios from 'axios';
import { createHttpResponseObject } from './utils/httpresponse.util';
import { z } from 'zod';
import { generateSchema } from '@anatine/zod-openapi';

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

  @Get('/')
  private async index(ctx: Context) {
    const authConfig = Config.get('auth');
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

  @Get('/aq-touchpoint/:operation')
  @ValidatePathParam('operation', generateSchema(z.enum(['issue', 'verify', 'revoke'])))
  @ValidateQueryParam('revocationHandle', {type: 'string'}, {required: false})
  async aqTouchpoint(ctx: Context, {operation}: {operation: string}) {
    const templateProperties = {
      operation: operation,
      api: Config.get('aq.api.url'),
      touchpointId: Config.get(`demoTouchpoints.${operation}`),
      title: `${operation} - &lt;aq-touchpoint/&gt;`
    };
    console.log(`templateProperties=${JSON.stringify(templateProperties,null,2)}`)
    if( operation === 'revoke' && ctx.request.query.revocationHandle ) {
      templateProperties['revocationHandle'] = ctx.request.query.revocationHandle
    }
     return await render('templates/aq-touchpoint.html', templateProperties, __dirname);
  }

  @Get('/open-touchpoint/:operation/:format')
  @ValidatePathParam('operation', generateSchema(z.enum(['issue', 'verify', 'revoke'])))
  @ValidatePathParam('format', generateSchema(z.enum(['none', 'html-tag', 'html-page'])))
  @ValidateQueryParam('layout', generateSchema(z.enum(['none', 'minimal', 'compact', 'full']).default('compact')))
  async openTouchpoint(ctx: Context, {operation, format}: {operation: string, format: string}) {
    const tenantId = Config.getOrThrow('aq.api.auth.tenantId');
    const apiKey = Config.getOrThrow('aq.api.auth.apiKey');
    const authorizationHeaderValue = `Basic ${Buffer.from(`${tenantId}:${apiKey}`, 'utf8').toString('base64')}`;

    // prepare to make the API call
    const touchpointId = Config.get(`demoTouchpoints.${operation}`);
    let url = `${Config.get('aq.api.url')}/api/touchpoint/${touchpointId}/open?format=${format}`;
    if( ctx.request.query.layout ) {
      url += `&layout=${ctx.request.query.layout}`;
    }
    const options = {
      url: url,
      method: 'GET',
      headers: {
        'Authorization': authorizationHeaderValue
      }
    };

    try {
      // make the API call to open the touchpoint
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const {data, status, headers} = await axios.request(options);
      if( status != 200 ) {
        return new HttpResponseBadRequest({status: status, error: data});
      }
      if( format === 'none' ) {
        return new HttpResponseOK(`<pre>${JSON.stringify(data,null,2)}</pre>`).setHeader('Content-Type', 'text/html');
      }
      else {
        return new HttpResponseOK(data.render.content).setHeader('Content-Type', data.render.contentType);
      }
    }
    catch( error:any ) {
      if( error.response ) {
        console.log(`openTouchpoint Failed ${error.response.status} ${error.message} ${JSON.stringify(error.response.data,null,2)}`);
        return createHttpResponseObject(error.response.status, error.response.data);
      }
     }
  }

  @Get('/minimal-demo')
  async minimalDemo(ctx: Context) {
    return await render('templates/minimal-demo.html', {
      api: Config.get('aq.api.url'),
      touchpointId: Config.get('demoTouchpoints.verify'),
    }, __dirname);
  }

  @Get('/service-desk')
  async serviceDesk(ctx: Context) {
    const templateProperties = {
      api: Config.get('aq.api.url'),
      touchpointId: Config.get('demoTouchpoints.service-desk')
    };
     return await render('templates/service-desk.html', templateProperties, __dirname);
  }

  @Get('/remote-device')
  async remoteDevice(ctx: Context) {
    const templateProperties = {
      api: Config.get('aq.api.url'),
      touchpointId: Config.get('demoTouchpoints.remote-device')
    };
    return await render('templates/remote-device.html', templateProperties, __dirname);
  }
}
