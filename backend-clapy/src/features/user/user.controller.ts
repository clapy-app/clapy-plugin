import { BadRequestException, Body, Controller, Get, Post, Req, UnauthorizedException } from '@nestjs/common';
import { ManagementClient } from 'auth0';
import { Request } from 'express';

import { perfMeasure, perfReset } from '../../common/perf-utils';
import { env } from '../../env-and-config/env';

const { auth0Domain, auth0BackendClientId, auth0BackendClientSecret } = env;

var auth0Management = new ManagementClient({
  domain: auth0Domain,
  clientId: auth0BackendClientId,
  clientSecret: auth0BackendClientSecret,
  scope: 'read:users update:users',
});

@Controller('user')
export class UserController {
  @Get('')
  async getUser(@Body() {}: UserMetadata, @Req() request: Request) {
    perfReset('Starting...');
    const userId = (request as any).user.sub;
    if (!userId) throw new UnauthorizedException();
    const res = (await auth0Management.getUser({ id: userId })).user_metadata;
    perfMeasure();
    return res;
  }

  @Post('update-metadata')
  async updateUserMetadata(@Body() userMetadata: UserMetadata, @Req() request: Request) {
    perfReset('Starting...');
    const { firstName, lastName, companyName, jobRole, techTeamSize } = userMetadata;
    if (!firstName || !lastName || !companyName || !jobRole || !techTeamSize) {
      throw new BadRequestException(
        `Cannot update user data, missing fields: ${Object.entries({
          firstName,
          lastName,
          companyName,
          jobRole,
          techTeamSize,
        })
          .filter(([_, value]) => !value)
          .map(([name, _]) => name)
          .join(', ')}`,
      );
    }
    const userId = (request as any).user.sub;
    if (!userId) throw new UnauthorizedException();
    await auth0Management.updateUserMetadata(
      { id: userId },
      {
        firstName,
        lastName,
        companyName,
        jobRole,
        techTeamSize,
      },
    );
    perfMeasure();
  }
}

interface UserMetadata {
  firstName: string;
  lastName: string;
  companyName: string;
  jobRole: string;
  techTeamSize: string;
}
