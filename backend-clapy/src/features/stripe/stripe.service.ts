import type { MessageEvent } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { ReplaySubject } from 'rxjs';

import { env } from '../../env-and-config/env.js';
import type { AccessTokenDecoded } from '../user/user.utils.js';

const stripeSubject = new ReplaySubject<MessageEvent>();

@Injectable()
export class StripeService {
  getPaymentCompletedObservable() {
    return stripeSubject.asObservable();
  }
  isLicenceInactive(user: AccessTokenDecoded) {
    if (env.isDev) return false;
    const licenceExpirationDate = user['https://clapy.co/licence-expiration-date'];
    if (typeof licenceExpirationDate === 'undefined') return true;
    const now = new Date();
    const expirationDate = new Date(licenceExpirationDate * 1000);

    const timeDiff = now.getTime() - expirationDate.getTime();
    const isExpired = timeDiff >= 0;
    return isExpired;
  }
  emitStripePaymentStatus(status: boolean) {
    stripeSubject.next({ data: JSON.stringify({ status: status }) });
  }
}
