import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthGuard } from './auth/auth.guard';
import { LoginPrivateController } from './auth/login-private.controller';
import { LoginTokensEntity } from './auth/login-tokens.entity';
import { LoginController } from './auth/login.controller';
import { env } from './env-and-config/env';
import { CodeController } from './features/export-code/1-code-controller';
import { SbSerializeController } from './features/sb-serialize-preview/sb-serialize.controller';

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
  controllers: [AppController, LoginController, LoginPrivateController, SbSerializeController, CodeController],
  providers: [AppService, { provide: APP_GUARD, useClass: AuthGuard }],
})
export class AppModule {}
