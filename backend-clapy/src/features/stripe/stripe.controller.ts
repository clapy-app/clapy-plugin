import type { MessageEvent } from '@nestjs/common';
import { Controller, Get, HttpException, Inject, Post, Query, Render, Req, Sse } from '@nestjs/common';
import type { Request } from 'express';
import type { Observable } from 'rxjs';
import { Stripe } from 'stripe';

import { IsBrowserGet } from '../../auth/IsBrowserGet.decorator.js';
import { PublicRoute } from '../../auth/public-route-annotation.js';
import { appConfig } from '../../env-and-config/app-config.js';
import { env } from '../../env-and-config/env.js';
import { UserService } from '../user/user.service.js';
import type { AccessTokenDecoded } from '../user/user.utils.js';
import { getAuth0User } from '../user/user.utils.js';
import { StripeWebhookService } from './stripe-webhook.service.js';
import { StripeService } from './stripe.service.js';

@Controller('stripe')
export class StripeController {
  constructor(
    @Inject(StripeService) private stripeService: StripeService,
    @Inject(StripeWebhookService) private stripeWebhookService: StripeWebhookService,
    @Inject(UserService) private userService: UserService,
  ) {}

  @Get('/checkout')
  async stripeCheckout(@Req() request: Request, @Query('from') from: string) {
    const redirectUri = `${env.baseUrl}/stripe/checkout-callback?from=${from}`;
    const user = (request as any).user;
    const userId = (request as any).user.sub;
    let auth0User = await getAuth0User(userId);
    const stripe = new Stripe(env.stripeSecretKey, appConfig.stripeConfig);
    //search if customer already exists in stripe
    //We use Full-text search instead of search by id to avoid having to register the stripe id in auth0 and not do an api call to auth0
    //Stripe api has better rate limits than Auth0 api.
    const customerExist = await stripe.customers.search({
      query: `email:'${auth0User.email}'`,
    });
    let customer;
    if (!customerExist.data.length) {
      customer = await stripe.customers.create({
        email: auth0User.email,
        metadata: {
          auth0Id: (request as any).user.sub,
        },
      });
    } else {
      customer = customerExist.data[0];
    }

    if (!this.stripeService.isLicenceInactive(user)) {
      throw new Error('You already have an active subscription.');
    }
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      client_reference_id: (request as any).user.sub,
      customer: customer.id,
      line_items: [
        {
          price: env.stripePriceId,
          quantity: 1,
        },
      ],
      metadata: {
        auth0Id: userId,
      },
      cancel_url: redirectUri + '&state=canceled',
      success_url: redirectUri + '&state=completed',
    });
    return session.url;
  }

  @Get('/get-user-quota')
  async getUserQuotas(@Req() request: Request) {
    const user = (request as any).user as AccessTokenDecoded;
    return this.userService.getUserSubscriptionData(user);
  }
  @Get('/customer-portal')
  async stripeCustomerPortal(@Req() request: Request, @Query('from') from: string) {
    const redirectUri = `${env.baseUrl}/stripe/customer-portal-callback?from=${from}`;
    const userId = (request as any).user.sub;
    let auth0User = await getAuth0User(userId);
    const stripe = new Stripe(env.stripeSecretKey, {
      apiVersion: '2020-08-27',
      appInfo: {
        name: 'clapy-dev/checkout',
        version: '0.0.1',
      },
    });
    const customerExist = await stripe.customers.search({
      query: `email:'${auth0User.email}'`,
    });
    const session = await stripe.billingPortal.sessions.create({
      customer: customerExist.data[0].id,
      return_url: redirectUri,
    });

    return session.url;
  }

  @PublicRoute()
  @IsBrowserGet()
  @Post('webhook')
  async webhook(@Req() request: Request) {
    const sig = request.headers['stripe-signature'];
    if (typeof sig !== 'string') throw new HttpException('Invalid stripe header type, expected a string.', 400);
    this.stripeWebhookService.processWebhookEvent(request.body, sig);

    // Return a response to acknowledge receipt of the event
    return { received: true };
  }

  @PublicRoute()
  @IsBrowserGet()
  @Get('/checkout-callback')
  @Render('checkout-callback')
  async checkoutCallback(@Query('from') from: 'browser' | 'desktop', @Query('state') state: 'completed' | 'canceled') {
    if (!state) throw new Error(`No state in query parameters.`);
    if (state === 'canceled') {
      this.stripeService.emitStripePaymentStatus(false);
    }
    return { from, state };
  }

  @PublicRoute()
  @IsBrowserGet()
  @Get('/customer-portal-callback')
  @Render('customerPortal-callback')
  async customerPortalCallback(
    @Query('from') from: string = 'browser' || 'desktop',
    @Query('state') state: string = 'completed' || 'canceled',
  ) {
    return { from };
  }

  @PublicRoute()
  @IsBrowserGet()
  @Sse('sse')
  sse(): Observable<MessageEvent> {
    return this.stripeService.getPaymentCompletedObservable();
  }
}
