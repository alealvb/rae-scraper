import http from 'http';
import getApp from './server';
import puppeteer from 'puppeteer';

puppeteer.launch({ headless: false }).then(browser => {
  let app = getApp(browser);
  const server = http.createServer(app);
  let currentApp = app;
  const port = process.env.PORT || 3000
  server.listen(port);

  if (module.hot) {
    module.hot.accept('./server', () => {
      app = getApp(browser);
      server.removeListener('request', currentApp);
      server.on('request', app);
      currentApp = app;
    })
  }
})