import type { MessageEvent } from '@nestjs/common';
import { Body, Controller, Get, Inject, Post, Query, Render, Req, Sse } from '@nestjs/common';
import type { Request } from 'express';
import type { Observable } from 'rxjs';
import { Stripe } from 'stripe';

import { IsBrowserGet } from '../../auth/IsBrowserGet.decorator.js';
import { PublicRoute } from '../../auth/public-route-annotation.js';
import { env } from '../../env-and-config/env.js';
import { updateAuth0UserRoles } from '../user/user.service.js';
import { StripeService } from './stripe.service.js';

@Controller('stripe')
export class StripeController {
  constructor(@Inject(StripeService) private stripeService: StripeService) {}

  @Get('/checkout')
  async stripeCheckout(@Req() request: Request, @Query('from') from: string) {
    const redirectUri = `${env.baseUrl}/stripe/checkout-callback?from=${from}`;

    const userId = (request as any).user.sub;
    const stripe = new Stripe(env.stripeSecretKey, {
      apiVersion: '2020-08-27',
      appInfo: {
        name: 'clapy-dev/checkout',
        version: '0.0.1',
      },
    });
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
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

  @PublicRoute()
  @IsBrowserGet()
  @Post('webhook')
  async webhook(@Body() body: any, @Req() request: Request) {
    const stripe = new Stripe(env.stripeSecretKey, {
      apiVersion: '2020-08-27',
      appInfo: {
        name: 'clapy-dev/checkout',
        version: '0.0.1',
      },
    });
    let event: Stripe.Event;

    const sig = request.headers['stripe-signature'];
    try {
      event = stripe.webhooks.constructEvent(request.body, sig as string, env.stripeWebhookSecret);
    } catch (err) {
      console.log(`Webhook Error: ${err}`);
      return;
    }
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as any;
        if (session.payment_status === 'paid') {
          const { auth0Id } = session.metadata;
          this.stripeService.emitStripePaymentStatus(true);
          console.log(auth0Id);
          updateAuth0UserRoles(auth0Id, ['rol_26j83lBEgJ515Zgi']);
        }
        break;
      case 'payment_intent.succeeded':
        break;
      case 'payment_intent.failed':
        console.log('failed');
        //emailCustomerAboutFailedPayment(session);
        break;
      default:
        //console.log(event.type);
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
  @Sse('sse')
  sse(): Observable<MessageEvent> {
    return this.stripeService.getPaymentCompletedObservable();
  }
}
