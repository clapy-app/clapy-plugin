import type { MessageEvent } from '@nestjs/common';
import { Body, Controller, Get, HttpException, Inject, Post, Query, Render, Req, Sse } from '@nestjs/common';
import type { Request } from 'express';
import type { Observable } from 'rxjs';
import { Stripe } from 'stripe';

import { IsBrowserGet } from '../../auth/IsBrowserGet.decorator.js';
import { PublicRoute } from '../../auth/public-route-annotation.js';
import { appConfig } from '../../env-and-config/app-config.js';
import { env } from '../../env-and-config/env.js';
import { UserService } from '../user/user.service.js';
import type { AccessTokenDecoded } from '../user/user.utils.js';
import { getAuth0User, hasRoleIncreasedQuota, updateAuth0UserMetadata } from '../user/user.utils.js';
import { StripeService } from './stripe.service.js';

@Controller('stripe')
export class StripeController {
  constructor(
    @Inject(StripeService) private stripeService: StripeService,
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
    const userId = (request as any).user.sub;
    const user = (request as any).user as AccessTokenDecoded;
    const isUserQualified = hasRoleIncreasedQuota(user);

    const quotas = await this.userService.getQuotaCount(userId);
    const quotasMax = isUserQualified ? appConfig.codeGenQualifiedQuota : appConfig.codeGenFreeQuota;
    const isLicenceExpired = this.stripeService.isLicenceInactive(user);
    return { quotas: quotas, quotasMax: quotasMax, isLicenceExpired: isLicenceExpired };
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
  async webhook(@Body() body: any, @Req() request: Request) {
    const stripe = new Stripe(env.stripeSecretKey, appConfig.stripeConfig);
    let event: Stripe.Event;

    const sig = request.headers['stripe-signature'];
    try {
      event = stripe.webhooks.constructEvent(request.body, sig as string, env.stripeWebhookSecret);
    } catch (err) {
      throw new HttpException(`Webhook Error: ${err}`, 401);
    }
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        if (session.payment_status === 'paid') {
          const { auth0Id } = session.metadata;
          const subscriptionId = session.subscription;
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const { current_period_start, current_period_end } = subscription;
          this.stripeService.emitStripePaymentStatus(true);
          await updateAuth0UserMetadata(auth0Id, {
            licenceStartDate: current_period_start,
            licenceExpirationDate: current_period_end,
          });
        }
        break;
      }
      case 'customer.subscription.updated':
        {
          const session = event.data.object as any;
          const { current_period_start, current_period_end } = session;
          const customer = await stripe.customers.retrieve(session.customer);
          if (!customer.deleted) {
            const { auth0Id } = customer!.metadata;
            await updateAuth0UserMetadata(auth0Id, {
              licenceStartDate: current_period_start,
              licenceExpirationDate: current_period_end,
            });
          }
        }
        break;
      case 'customer.deleted': {
        const session = event.data.object as any;
        const { auth0Id } = session!.metadata;
        await updateAuth0UserMetadata(auth0Id, {
          licenceStartDate: null,
          licenceExpirationDate: null,
        });
        break;
      }
      case 'customer.subscription.deleted': {
        const session = event.data.object as any;
        const { current_period_start, current_period_end, canceled_at } = session;
        const customer = await stripe.customers.retrieve(session.customer);
        if (!customer.deleted && customer!.metadata?.auth0Id) {
          const { auth0Id } = customer!.metadata;
          await updateAuth0UserMetadata(auth0Id, {
            licenceStartDate: current_period_start,
            licenceExpirationDate: canceled_at,
          });
        }
        break;
      }
      /**
       * "If we want to add a logic in the app reacting to isolated payment refunds, here is a sample:"
       */

      // case 'charge.refunded': {
      //   const session = event.data.object as any;
      //   const customer = await stripe.customers.retrieve(session.customer);
      //   if (
      //     session.refunds.data[0].object === 'refund' &&
      //     session.refunds.data[0].status === 'succeeded' &&
      //     customer!.metadata?.auth0Id
      //   ) {
      //     const { auth0Id } = customer!.metadata;
      //     await updateAuth0UserMetadata(auth0Id, {
      //       licenceExpirationDate: session.refunds.data[0].created,
      //     });
      //   }
      //   console.log(session.refunds.data[0]);
      //   break;
      // }
      default:
        /**
         * this log will be usefull if we ever come back to this stripe feature in the future
         */
        // console.log(event.type);
        break;
    }
    // Return a response to acknowledge receipt of the event
    return { received: true };
  }

  @PublicRoute()
  @IsBrowserGet()
  @Get('/checkout-callback')
  @Render('checkout-callback')
  async checkoutCallback(
    @Query('from') from: string = 'browser' || 'desktop',
    @Query('state') state: string = 'completed' || 'canceled',
  ) {
    if (!state) throw new Error(`No state in query parameters.`);
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
