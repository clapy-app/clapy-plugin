import type { RawBodyRequest } from '@nestjs/common';
import { Controller, Get, HttpException, Inject, Post, Query, Render, Req } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Request } from 'express';
import { Stripe } from 'stripe';
import type { Repository } from 'typeorm';

import { IsBrowserGet } from '../../auth/IsBrowserGet.decorator.js';
import { LoginTokensEntity } from '../../auth/login-tokens.entity.js';
import { PublicRoute } from '../../auth/public-route-annotation.js';
import { appConfig } from '../../env-and-config/app-config.js';
import { env } from '../../env-and-config/env.js';
import { UserService } from '../user/user.service.js';
import type { AccessTokenDecoded } from '../user/user.utils.js';
import { getAuth0User, isStripeDevTeam } from '../user/user.utils.js';
import { StripeWebhookService } from './stripe-webhook.service.js';
import { StripeService } from './stripe.service.js';

@Controller('stripe')
export class StripeController {
  constructor(
    @Inject(StripeService) private stripeService: StripeService,
    @Inject(StripeWebhookService) private stripeWebhookService: StripeWebhookService,
    @Inject(UserService) private userService: UserService,
    @InjectRepository(LoginTokensEntity) private loginTokensRepo: Repository<LoginTokensEntity>,
  ) {}

  @Get('/checkout')
  async stripeCheckout(@Req() req: Request, @Query('from') from: string) {
    const user = (req as any).user as AccessTokenDecoded;
    const userId = user.sub;
    const redirectUri = `${env.baseUrl}/stripe/checkout-callback?from=${encodeURIComponent(
      from,
    )}&userId=${encodeURIComponent(userId)}`;
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
          auth0Id: user.sub,
        },
      });
    } else {
      customer = customerExist.data[0];
    }

    if (!this.stripeService.isLicenceInactive(user)) {
      throw new Error('You already have an active subscription.');
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      client_reference_id: user.sub,
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
      automatic_tax: { enabled: true },
      billing_address_collection: 'auto',
      customer_update: {
        address: 'auto',
        shipping: 'auto',
      },
    };

    if (isStripeDevTeam(user)) {
      sessionParams.discounts = [
        {
          coupon: 'betacoupon',
        },
      ];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    return session.url;
  }

  @Get('/get-user-quota')
  async getUserQuotas(@Req() req: Request) {
    const user = (req as any).user as AccessTokenDecoded;
    return this.userService.getUserSubscriptionData(user);
  }
  @Get('/customer-portal')
  async stripeCustomerPortal(@Req() req: Request, @Query('from') from: string) {
    const redirectUri = `${env.baseUrl}/stripe/customer-portal-callback?from=${from}`;
    const user = (req as any).user as AccessTokenDecoded;
    const userId = user.sub;
    let auth0User = await getAuth0User(userId);
    const stripe = new Stripe(env.stripeSecretKey, appConfig.stripeConfig);
    const { data } = await stripe.customers.search({
      query: `email:'${auth0User.email}'`,
    });
    if (!data?.length) {
      // If user not found, e.g. removed in the stripe back-office while the plugin was open
      return undefined;
    }
    const session = await stripe.billingPortal.sessions.create({
      customer: data[0].id,
      return_url: redirectUri,
    });

    return session.url;
  }

  @PublicRoute()
  @IsBrowserGet()
  @Post('webhook')
  async webhook(@Req() req: RawBodyRequest<Request>) {
    if (!req.rawBody) throw new HttpException('Invalid stripe body, cannot be empty.', 400);
    const sig = req.headers['stripe-signature'];
    if (typeof sig !== 'string') throw new HttpException('Invalid stripe header type, expected a string.', 400);
    await this.stripeWebhookService.processWebhookEvent(req.rawBody, sig);

    // Return a response to acknowledge receipt of the event
    return { received: true };
  }

  @PublicRoute()
  @IsBrowserGet()
  @Get('/checkout-callback')
  @Render('checkout-callback')
  async checkoutCallback(
    @Query('from') from: 'browser' | 'desktop',
    @Query('userId') userId: string,
    @Query('state') state: 'completed' | 'canceled',
  ) {
    if (!state) throw new Error(`No state in query parameters.`);
    if (state === 'canceled') {
      await this.stripeService.cancelPayment(userId);
    }
    return { from, state };
  }

  @PublicRoute()
  @IsBrowserGet()
  @Get('/customer-portal-callback')
  @Render('customerPortal-callback')
  async customerPortalCallback(
    @Query('from') from: 'browser' | 'desktop',
    @Query('state') state: 'completed' | 'canceled',
  ) {
    return { from };
  }

  @Post('reset-payment-status')
  async resetPaymentStatus(@Req() req: Request) {
    const user = (req as any).user as AccessTokenDecoded;
    const userId = user.sub;
    // await this.loginTokensRepo.delete({ userId });
    await this.stripeService.startPayment(userId);
  }
}
