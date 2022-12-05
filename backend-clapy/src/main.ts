import type { RawBodyRequest } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { NextFunction, Request, Response } from 'express';
import { json } from 'express';
import rateLimit from 'express-rate-limit';
import expressSanitizer from 'express-sanitizer';
import helmet from 'helmet';
import morgan from 'morgan';
import { join } from 'path';
import { URL } from 'url';

import { AppModule } from './app.module.js';
import { CsrfGuard } from './auth/csrf.guard.js';
import { UnknownExceptionFilter } from './core/unknown-exception.filter.js';
import { env } from './env-and-config/env.js';

const port = env.port;
const logger = new Logger('main');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });

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
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          'script-src': ["'self'", "'unsafe-inline'"],
        },
      },
    }),
  );
  // Security: add rate limit
  app.use(
    rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 100, // limit each IP to 15 requests per windowMs
    }),
  );
  if (env.isDev) {
    // Google Cloud Run already logs requests.
    app.use(morgan('[:date[iso]] :remote-addr :method :status :url - :response-time ms'));
  }
  // Security (XSS): sanitize incoming requests (remove common injections)
  app.use(expressSanitizer());

  app.use(
    json({
      limit: '50mb',
      // Keep the raw body for use cases like stripe webhooks.
      // Pb: all routes have the raw body. We could optimize further by only exposing it to the routes that need it, e.g. via an annotation.
      verify: (req, res, buf, encoding) => {
        if (buf && buf.length) {
          (req as RawBodyRequest<Request>).rawBody = buf;
        }
      },
    }),
  );

  // In development, a small lag is added artificially to simulate real-life network constraints.
  if (env.isDev && !env.isJest) {
    app.use((req: Request, res: Response, next: NextFunction) => setTimeout(next, env.localhostLatency));
  }

  // https://stackoverflow.com/a/66651120/4053349
  const __dirname = new URL('.', import.meta.url).pathname;
  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');

  // CSRF protection. This technique is presented here (does not require dynamic token):
  // https://owasp.org/www-project-cheat-sheets/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#use-of-custom-request-headers
  app.useGlobalGuards(new CsrfGuard());
  app.useGlobalFilters(new UnknownExceptionFilter());

  if (env.isDev) {
    // Explicitly listen requests from any source instead of just localhost, so that docker containers can call the API,
    // e.g. the stripe CLI webhooks.
    await app.listen(port, '0.0.0.0');
  } else {
    await app.listen(port);
  }
}

bootstrap()
  .then(async () => {
    logger.log(`Serving the app at http://localhost:${port}`);
  })
  .catch(err => console.error('Unknown error when starting API:', err));
