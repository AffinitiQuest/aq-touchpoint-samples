import { Env, render, HttpResponseBadRequest } from '@foal/core';
import { constants } from 'fs';
import { access } from 'fs/promises';

export abstract class AbstractDemoController {

  protected async renderTemplate(templateName: string, locals: object = {} ) {
    const environment = Env.get('NODE_ENV')
    switch( environment ) {
      case 'development': {
        const packageRootPath = __dirname.slice(0, __dirname.indexOf('/build/app'))
        const path = `${packageRootPath}/src/app/templates/${templateName}`;
        try {
          await access(path, constants.R_OK);
          
          return (await render(path, locals)).setHeader('Access-Control-Allow-Origin', '*');
        }
        catch( e ) {
          return new HttpResponseBadRequest({reason: `Can not read template ${path} - ${JSON.stringify(e,null,2)}`});
        }
        break;
      }
      default:{
        return await render(`templates/${templateName}`, locals, __dirname)
      }
    }
  }
  
}
