import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthGuard } from './auth/auth.guard';
import { LoginController } from './auth/login.controller';
import { LoginPrivateController } from './auth/login-private.controller';
import { CodeController } from './features/export-cdoe/code-controller';
import { SbSerializeController } from './features/sb-serialize-preview/sb-serialize.controller';

@Module({
  imports: [HttpModule],
  controllers: [AppController, LoginController, LoginPrivateController, SbSerializeController, CodeController],
  providers: [AppService, { provide: APP_GUARD, useClass: AuthGuard }],
})
export class AppModule {}
