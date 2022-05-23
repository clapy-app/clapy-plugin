import { BadRequestException, Body, Controller, Get, Post, Req } from '@nestjs/common';
import { Request } from 'express';

import { perfMeasure, perfReset } from '../../common/perf-utils';
import { handleError } from '../../utils';
import { upsertPipedrivePersonByAuth0Id } from '../pipedrive/pipedrive.service';
import {
  getAuth0User,
  hasMissingMetaProfile,
  hasMissingMetaUsage,
  updateAuth0UserMetadata,
  UserMetadata,
  UserMetaUsage,
} from './user.service';

@Controller('user')
export class UserController {
  @Get('')
  async getUser(@Body() {}: UserMetadata, @Req() request: Request) {
    perfReset('Starting...');
    const userId = (request as any).user.sub;
    const res = (await getAuth0User(userId)).user_metadata || {};
    perfMeasure();
    return res;
  }

  @Post('update-profile')
  async updateUserProfile(@Body() userMetadata: UserMetadata, @Req() request: Request) {
    perfReset('Starting...');
    const { firstName, lastName, companyName, jobRole, techTeamSize } = userMetadata;
    if (hasMissingMetaProfile(userMetadata)) {
      throw new BadRequestException(
        `Cannot update user profile, missing fields: ${Object.entries({
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
    const auth0user = await updateAuth0UserMetadata(userId, {
      firstName,
      lastName,
      companyName,
      jobRole,
      techTeamSize,
    });

    // Insert data in Pipedrive asynchronously (non-blocking operation).
    // We normally wait for update-usage (below route, updating usage field = why Clapy in pipedrive),
    // but if the usage is already provided for some reason, this step will be skipped in the plugin,
    // So we immediately push the updated data in Pipedrive.
    // TODO do it in production only
    if (!hasMissingMetaUsage(auth0user.user_metadata?.usage)) {
      upsertPipedrivePersonByAuth0Id(auth0user).catch(handleError);
    }

    perfMeasure();
  }

  @Post('update-usage')
  async updateUserUsage(@Body() userMetaUsage: UserMetaUsage, @Req() request: Request) {
    perfReset('Starting...');
    if (hasMissingMetaUsage(userMetaUsage)) {
      throw new BadRequestException(
        `Cannot update user usage, at least one usage is required: components, designSystem, landingPages or other.`,
      );
    }

    // Delete fields that are false
    for (const key of Object.keys(userMetaUsage)) {
      const k = key as keyof UserMetaUsage;
      if (!userMetaUsage[k]) {
        delete userMetaUsage[k];
      }
    }

    const userId = (request as any).user.sub;
    const auth0user = await updateAuth0UserMetadata(userId, { usage: userMetaUsage });

    // Insert data in Pipedrive asynchronously (non-blocking operation)
    // TODO do it in production only
    upsertPipedrivePersonByAuth0Id(auth0user).catch(handleError);

    perfMeasure();
  }
}
