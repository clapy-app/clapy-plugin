import { Inject, Injectable } from '@nestjs/common';
import { Stripe } from 'stripe';

import { appConfig } from '../../env-and-config/app-config.js';
import { env } from '../../env-and-config/env.js';
import { updateAuth0UserMetadata } from '../user/auth0-management-api.js';
import { StripeService } from './stripe.service.js';

@Injectable()
export class StripeWebhookService {
  constructor(@Inject(StripeService) private stripeService: StripeService) {}

  async processWebhookEvent(payload: string | Buffer, header: string | Buffer | Array<string>) {
    const stripe = new Stripe(env.stripeSecretKey, appConfig.stripeConfig);

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(payload, header, env.stripeWebhookSecret);
    } catch (err: any) {
      // Rewrite the error, because the original one is too verbose. The integration has been tested, throwing here means the request signature is not recognized, e.g. because the Stripe webhook secret is wrong in the server environment variables.
      throw new Error(`⚠️  Webhook signature verification failed: ${err?.message}`);
    }

    switch (event.type) {
      // case 'checkout.session.completed': {
      //   const session = event.data.object as Stripe.Checkout.Session;
      //   if (session.payment_status === 'paid') {
      //     const { auth0Id } = session.metadata || {};
      //     const subscriptionId = session.subscription;
      //     const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      //     const { current_period_start, current_period_end } = subscription;
      //     await updateAuth0UserMetadata(auth0Id, {
      //       licenceStartDate: current_period_start,
      //       licenceExpirationDate: current_period_end,
      //     });
      //     this.stripeService.emitStripePaymentStatus(true);
      //   }
      //   break;
      // }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        {
          const session = event.data.object as Stripe.Subscription;
          const { current_period_start, current_period_end, status } = session;
          if (status === 'active' || status === 'trialing') {
            const customer = await stripe.customers.retrieve(session.customer as string);
            if (!customer.deleted) {
              const { auth0Id } = customer!.metadata;
              // Try/catch to diagnose in prod. To enable when I take the ticket.
              // try {
              await updateAuth0UserMetadata(auth0Id, {
                licenceStartDate: current_period_start,
                licenceExpirationDate: current_period_end,
              });
              // } catch (error: any) {
              //   console.error('Cannot update Auth0 user:', error?.message);
              //   throw error;
              // }
              await this.stripeService.completePayment(auth0Id);
            } else {
              throw new Error(`User deleted, the payment cannot be marked as completed.`);
            }
          } else {
            // Session is not active, for example because the payment attempt failed. Ignore.
          }
        }
        break;
      case 'customer.deleted': {
        const session = event.data.object as Stripe.Customer;
        const { auth0Id } = session.metadata;
        await updateAuth0UserMetadata(auth0Id, {
          licenceStartDate: null,
          licenceExpirationDate: null,
        });
        break;
      }
      case 'customer.subscription.deleted': {
        const session = event.data.object as Stripe.Subscription;
        const { current_period_start, canceled_at } = session;
        const customer = await stripe.customers.retrieve(session.customer as string);
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
  }
}
