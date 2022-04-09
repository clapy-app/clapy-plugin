import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json } from 'body-parser';
import { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import expressSanitizer from 'express-sanitizer';
import helmet from 'helmet';
import morgan from 'morgan';
import { join } from 'path';

import { AppModule } from './app.module';
import { CsrfGuard } from './auth/csrf.guard';
import { UnknownExceptionFilter } from './core/unknown-exception.filter';
import { env } from './env-and-config/env';

const port = env.port;
const logger = new Logger('main');

async function bootstrap() {
  if (env.isDev) {
    try {
      // const sbUrl = 'https://style.monday.com';
      // const storybookId = 'buttons-button--overview';

      // const sbUrl = 'http://nonexistingdomaiiine.com/';
      // const sbUrl = 'https://reactstrap.github.io';
      const sbUrl = 'https://www.intuit.com/qbmds-components/sb/storybook';
      // const storybookId = 'components-accordion--accordion';
      // const storybookId = 'components-badge--links';
      // const storybookId = 'components-alert--alert-content';
      // const storybookId = 'components-alert--dismiss';
      // const storybookId = 'components-alert--alert';
      // const storybookId = 'components-card--content-types';
      const storybookId = 'core-atoms-button--intro';

      // const sbUrl = 'http://localhost:9009';
      // const storybookId = 'atoms-avatar--default-story';
      // const storybookId = 'atoms-avatar--user-with-avatar-and-registration-success';

      const url = `${sbUrl}/iframe.html?id=${storybookId}&viewMode=story`;

      // await extractStories(`${sbUrl}/index.html`);
      // const nodes = await sbSerializePreview(url);
      // console.log('nodes:');
      // console.log(JSON.stringify(nodes));
      // console.log(nodes.length, `node${nodes.length > 1 ? 's' : ''}`);
    } catch (err) {
      console.error('###### puppeteer');
      console.error(err);
    }

    // // Sample conversion font to SVG
    // try {
    //   // const url = 'http://localhost:9009/static/media/node_modules/@mdi/font/fonts/materialdesignicons-webfont.ttf';
    //   const url = 'https://github.com/Templarian/MaterialDesign-Webfont/blob/master/fonts/materialdesignicons-webfont.ttf?raw=true';

    //   const code = 'f0003';

    //   const svg = await loadSvgFromFont(url, code);
    //   console.log(svg);
    // } catch (error) {
    //   console.error('###### font');
    //   console.error(error);
    // }

    // try {
    //   // const sbUrl = 'https://style.monday.com';
    //   // const sbUrl = 'https://reactstrap.github.io';
    //   const sbUrl = 'http://host.docker.internal:9009';

    //   const stories = await extractStories(sbUrl);
    //   console.log('stories:');
    //   console.log('------');
    //   console.log(JSON.stringify(stories));
    //   console.log('------');

    //   // console.log(nodes.length, `node${nodes.length > 1 ? 's' : ''}`);
    // } catch (err) {
    //   console.error('###### puppeteer');
    //   console.error(err);
    // }
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // CORS
  app.enableCors();
  // Safer variant:
  // if env.allowedHosts is not provided, no cors (no cross-domain). If provided, those specified
  // hosts only are allowed.
  // if (env.allowedHosts) {
  //   app.enableCors({
  //     credentials: true,
  //     exposedHeaders: ['Content-Disposition'],
  //     origin: env.allowedHosts.split(',').map(elt => elt.trim()),
  //   });
  // }

  // Security: various middleware (https://docs.nestjs.com/techniques/security)
  app.use(helmet());
  // Security: add rate limit
  app.use(
    rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 100, // limit each IP to 15 requests per windowMs
    }),
  );
  app.use(morgan('[:date[iso]] :remote-addr :method :status :url - :response-time ms'));
  // Security (XSS): sanitize incoming requests (remove common injections)
  app.use(expressSanitizer());

  app.use(json({ limit: '50mb' }));

  // In development, a small lag is added artificially to simulate real-life network constraints.
  if (env.isDev && !env.isJest) {
    app.use((req: Request, res: Response, next: NextFunction) => setTimeout(next, env.localhostLatency));
  }

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');

  // CSRF protection. This technique is presented here (does not require dynamic token):
  // https://owasp.org/www-project-cheat-sheets/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#use-of-custom-request-headers
  app.useGlobalGuards(new CsrfGuard());
  app.useGlobalFilters(new UnknownExceptionFilter());

  await app.listen(port);
}

bootstrap()
  .then(async () => {
    logger.log(`Serving the app at http://localhost:${port}`);
  })
  .catch(err => console.error('Unknown error when starting API:', err));
