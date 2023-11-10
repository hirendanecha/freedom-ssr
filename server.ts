import 'zone.js/node';

import { APP_BASE_HREF } from '@angular/common';
import { ngExpressEngine } from '@nguniversal/express-engine';
import * as express from 'express';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import fetch from 'node-fetch';
import { AppServerModule } from './src/main.server';
import 'localstorage-polyfill';

// SEO
const url = 'https://freedom-api.opash.in';
// const url_img = url;
const api_url = url + '/api';

// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {
  const server = express();
  const distFolder = join(process.cwd(), 'dist/freedom-ssr/browser');
  const indexHtml = existsSync(join(distFolder, 'index.original.html'))
    ? 'index.original.html'
    : 'index';

  const domino = require('domino-ext');
  const fs = require('fs');
  const path = require('path');
  const template = fs
    .readFileSync(
      path.join(join(process.cwd(), 'dist/freedom-ssr/browser'), 'index.html')
    )
    .toString();
  // Shim for the global window and document objects.
  const window = domino.createWindow(template);

  global['localStorage'] = localStorage;
  global['window'] = window;
  global['document'] = window.document;
  global['self'] = window;
  global['sessionStorage'] = window.sessionStorage;
  global['IDBIndex'] = window.IDBIndex;
  global['navigator'] = window.navigator;
  global['Event'] = window.Event;
  global['Event']['prototype'] = window.Event.prototype;
  global['HTMLElement'] = window.HTMLElement;
  // global.google = google;
  global['getComputedStyle'] = window.getComputedStyle;

  // Our Universal express-engine (found @ https://github.com/angular/universal/tree/main/modules/express-engine)
  server.engine(
    'html',
    ngExpressEngine({
      bootstrap: AppServerModule,
      inlineCriticalCss: false,
    })
  );

  server.set('view engine', 'html');
  server.set('views', distFolder);

  // Example Express Rest API endpoints
  // server.get('/api/**', (req, res) => { });
  // Serve static files from /browser
  server.get(
    '*.*',
    express.static(distFolder, {
      maxAge: '1y',
    })
  );

  // All regular routes use the Universal engine
  server.get('*', (req, res) => {
    res.render(
      indexHtml,
      { req, providers: [{ provide: APP_BASE_HREF, useValue: req.baseUrl }] },
      async (err, html) => {
        const params = req.params[0];
        var seo: any = {
          title: 'Freedom Buzz',
          description:
            'The Umbrella platform for All freedom based projects worldwide',
          image:
            'https://freedom.buzz/assets/images/banner/freedom-buzz-high-res.jpeg',
          site: 'https://freedom.buzz/',
          url: 'https://freedom.buzz' + params,
          keywords: 'FreedomBuzz, Freedom',
        };
        console.log(params, params.indexOf('communities/') > -1);

        if (params.indexOf('communities/') > -1) {
          let id = params.split('/');
          id = id[id.length - 1];
          // id = params[params.length - 1];
          // id = Number(id);
          // let id = 'local-organic-food-sources';
          console.log({ id });

          // if (!isNaN(id) || Math.sign(id) > 0) {
          const community: any = await getCommunity(id);

          // console.log({ params }, { id }, { community });

          const talent = {
            name: community?.CommunityName,
            description: community?.CommunityDescription,
            image: community?.coverImg,
          };
          seo.title = talent.name;
          seo.description = strip_html_tags(talent.description);
          seo.image = `${talent.image}`;
          // }
        } else if (params.indexOf('post/') > -1) {
        }
        html = html.replace(/\$TITLE/g, seo.title);
        html = html.replace(/\$DESCRIPTION/g, strip_html_tags(seo.description));
        html = html.replace(/\$OG_DESCRIPTION/g, seo.description);
        html = html.replace(/\$OG_META_DESCRIPTION/g, seo.description);
        html = html.replace(/\$OG_TITLE/g, seo.title);
        html = html.replace(/\$OG_IMAGE/g, seo.image);
        html = html.replace(/\$OG_SITE/g, seo.site);
        html = html.replace(/\$OG_URL/g, seo.url);
        html = html.replace(/\$OG_META_KEYWORDS/g, seo.keywords);
        res.send(html);
      }
    );
  });

  return server;
}

async function getCommunity(id: any) {
  return fetch(api_url + '/v1/community/bySlug/' + id).then((resp) =>
    resp.json()
  );
}

function strip_html_tags(str) {
  if (str === null || str === '') {
    return false;
  } else {
    str = str.toString();
    return str.replace(/<[^>]*>/g, '');
  }
}

function run(): void {
  const port = process.env['PORT'] || 4000;

  // Start up the Node server
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

// Webpack will replace 'require' with '__webpack_require__'
// '__non_webpack_require__' is a proxy to Node 'require'
// The below code is to ensure that the server is run only when not requiring the bundle.
declare const __non_webpack_require__: NodeRequire;
const mainModule = __non_webpack_require__.main;
const moduleFilename = (mainModule && mainModule.filename) || '';
if (moduleFilename === __filename || moduleFilename.includes('iisnode')) {
  run();
}

export * from './src/main.server';
