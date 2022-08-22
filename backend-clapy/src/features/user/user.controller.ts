import { BadRequestException, Body, Controller, Get, Inject, Post, Req } from '@nestjs/common';

import { wait } from '../../common/general-utils.js';
import { perfMeasure, perfReset } from '../../common/perf-utils.js';
import { flags } from '../../env-and-config/app-config.js';
import { env } from '../../env-and-config/env.js';
import type { RequestPrivate } from '../../typings/express-jwt.js';
import { handleError } from '../../utils.js';
import { upsertPipedrivePersonByAuth0Id } from '../pipedrive/pipedrive.service.js';
import { UserService } from './user.service.js';
import type { UserMetadata, UserMetaUsage } from './user.utils.js';
import {
  getAuth0FirstLastName,
  getAuth0User,
  hasMissingMetaProfile,
  hasMissingMetaUsage,
  updateAuth0UserMetadata,
} from './user.utils.js';

@Controller('user')
export class UserController {
  constructor(@Inject(UserService) private userService: UserService) {}

  @Get('')
  async getUser(@Body() {}: UserMetadata, @Req() request: RequestPrivate) {
    perfReset('Starting...');
    // Simulates a potential cold start on Google Cloud Run.
    // This API is one of the first calls.
    if (env.isDev && flags.simulateColdStart) {
      await wait(3000);
    }
    const user = request.auth;
    const userId = user.sub;

    const auth0User = await getAuth0User(userId);
    const userMetadata: UserMetadata = auth0User.user_metadata || {};

    userMetadata.picture = auth0User.picture;
    userMetadata.email = auth0User.email;
    // If missing name, pre-fill with other profile info available.
    if (!userMetadata.firstName || !userMetadata.lastName) {
      const [firstName, lastName] = getAuth0FirstLastName(auth0User);
      userMetadata.firstName = firstName;
      userMetadata.lastName = lastName;
    }

    const subscriptionData = await this.userService.getUserSubscriptionData(user);
    Object.assign(userMetadata, subscriptionData);

    perfMeasure();
    return userMetadata;
  }

  @Post('update-profile')
  async updateUserProfile(@Body() userMetadata: UserMetadata, @Req() req: RequestPrivate) {
    perfReset('Starting...');
    const { firstName, lastName, companyName, jobRole, techTeamSize, phone } = userMetadata;
    if (hasMissingMetaProfile(userMetadata)) {
      throw new BadRequestException(
        `Cannot update user profile, missing fields: ${Object.entries({
          firstName,
          lastName,
          companyName,
          jobRole,
          techTeamSize,
          phone,
        })
          .filter(([_, value]) => !value)
          .map(([name, _]) => name)
          .join(', ')}`,
      );
    }
    const userId = req.auth.sub;
    const auth0user = await updateAuth0UserMetadata(userId, {
      firstName,
      lastName,
      companyName,
      jobRole,
      techTeamSize,
      phone,
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
  async updateUserUsage(@Body() userMetaUsage: UserMetaUsage, @Req() req: RequestPrivate) {
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

    const userId = req.auth.sub;
    const auth0user = await updateAuth0UserMetadata(userId, { usage: userMetaUsage });

    // Insert data in Pipedrive asynchronously (non-blocking operation)
    // TODO do it in production only
    upsertPipedrivePersonByAuth0Id(auth0user).catch(handleError);

    perfMeasure();
  }
}
