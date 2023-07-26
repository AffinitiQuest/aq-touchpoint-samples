import { Class, Context, Get, HttpResponseOK, controller, IAppController, IController } from '@foal/core';
import { AuthController, WebhookController } from './index';

export class ApiController implements IAppController{

  subControllers = [
    controller('/auth', AuthController),
    controller('/webhook', WebhookController)
  ];

}
