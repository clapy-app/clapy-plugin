import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin/admin.controller.js';
import { AdminService } from './admin/admin.service.js';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthGuard } from './auth/auth.guard.js';
import { LoginPrivateController } from './auth/login-private.controller.js';
import { LoginTokensEntity } from './auth/login-tokens.entity.js';
import { LoginController } from './auth/login.controller.js';
import { env } from './env-and-config/env.js';
import { CodeController } from './features/export-code/1-code-controller.js';
import { GenerationHistoryEntity } from './features/export-code/generation-history.entity.js';
import { GithubController } from './features/github/1-github-controller.js';
import { SbSerializeController } from './features/sb-serialize-preview/sb-serialize.controller.js';
import { StripeWebhookService } from './features/stripe/stripe-webhook.service.js';
import { StripeController } from './features/stripe/stripe.controller.js';
import { StripeService } from './features/stripe/stripe.service.js';
import { UserController } from './features/user/user.controller.js';
import { UserService } from './features/user/user.service.js';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      // url: `postgres://${env.dbUser}:${env.dbPassword}@${env.dbHost}:${env.dbPort}/${env.dbName}`,
      // If UNIX socket:
      // postgres://analytics:pwwwwwd@/clapy?host=/cloudsql/clapy-production:europe-west1:clapy
      host: env.dbHost,
      port: parseInt(env.dbPort || '5432'),
      database: env.dbName,
      username: env.dbUser,
      password: env.dbPassword,
      synchronize: false /* env.isDev */, // Let hasura handle the migrations
      autoLoadEntities: true,
      retryAttempts: Number.MAX_SAFE_INTEGER,
    }),
    TypeOrmModule.forFeature([LoginTokensEntity, GenerationHistoryEntity]),
  ],
  controllers: [
    AppController,
    LoginController,
    LoginPrivateController,
    UserController,
    StripeController,
    SbSerializeController,
    CodeController,
    GithubController,
    AdminController,
  ],
  providers: [
    AppService,
    StripeService,
    StripeWebhookService,
    UserService,
    AdminService,
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AppModule {}
