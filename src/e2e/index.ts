import { createApp } from '@foal/core';
import * as request from 'supertest';

import { AppController } from '../app/app.controller';

describe('The server', () => {
  let app;

  before(async () => {
    app = await createApp(AppController);
  });

  it('should return a 200 status on GET / requests.', () => {
    return request(app)
      .get('/')
      .expect(200);
  });

});
