import 'source-map-support/register';
import { Config, createApp, displayServerURL } from '@foal/core';

import { AppController } from './app/app.controller';

async function main() {
  const app = await createApp(AppController);

  const port = Config.get('port', 'number', 3001);
  app.listen(port, () => displayServerURL(port));
}

main()
  .catch(err => { console.error(err.stack); process.exit(1); });
