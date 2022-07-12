import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthGuard } from './auth/auth.guard.js';
import { LoginPrivateController } from './auth/login-private.controller.js';
import { LoginTokensEntity } from './auth/login-tokens.entity.js';
import { LoginController } from './auth/login.controller.js';
import { env } from './env-and-config/env.js';
import { CodeController } from './features/export-code/1-code-controller.js';
import { SbSerializeController } from './features/sb-serialize-preview/sb-serialize.controller.js';
import { StripeController } from './features/stripe/stripe.controller.js';
import { StripeService } from './features/stripe/stripe.service.js';
import { UserController } from './features/user/user.controller.js';

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
    TypeOrmModule.forFeature([LoginTokensEntity]),
  ],
  controllers: [
    AppController,
    LoginController,
    LoginPrivateController,
    UserController,
    StripeController,
    SbSerializeController,
    CodeController,
  ],
  providers: [AppService, StripeService, { provide: APP_GUARD, useClass: AuthGuard }],
})
export class AppModule {}
