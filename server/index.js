import http from 'http';
import puppeteer from 'puppeteer';
import getApp from './server';
import db from './db/db';
import { loadWords } from './db/seeds';

puppeteer.launch({
  // headless: false
}).then(browser => {
  let app = getApp(browser);
  const server = http.createServer(app);
  let currentApp = app;
  const port = process.env.PORT || 3000
  server.listen(port);
  console.log(`Server listening at port ${port}`);
  loadWords();

  if (module.hot) {
    module.hot.accept('./server', () => {
      app = getApp(browser);
      server.removeListener('request', currentApp);
      server.on('request', app);
      currentApp = app;
    })
  }
})
