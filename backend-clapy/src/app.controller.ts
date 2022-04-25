import { Controller, Get, Render } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AppService } from './app.service';
import { IsBrowserGet } from './auth/IsBrowserGet.decorator';
import { LoginTokensEntity } from './auth/login-tokens.entity';
import { PublicRoute } from './auth/public-route-annotation';

@PublicRoute()
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectRepository(LoginTokensEntity) private usersRepository: Repository<LoginTokensEntity>,
  ) {}

  @Get()
  @IsBrowserGet()
  @Render('index')
  root() {
    return { message: 'Hello world!' };
  }

  @Get('isdbalive')
  @IsBrowserGet()
  async checkDb() {
    const tokens = new LoginTokensEntity();
    tokens.readToken = '';
    tokens.writeToken = '';
    await this.usersRepository.save(tokens);
    await this.usersRepository.remove(tokens);
    return { message: 'The database works.' };
  }
}
