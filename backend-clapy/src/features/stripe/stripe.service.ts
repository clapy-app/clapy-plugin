import type { MessageEvent } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';

import type { AccessTokenDecoded } from '../user/user.utils.js';

// TODO review. It looks like the webservice is NOT stateless, which will lead to pernicious bugs in production.
const stripeSubject = new Subject<MessageEvent>();

@Injectable()
export class StripeService {
  getPaymentCompletedObservable() {
    return stripeSubject.asObservable();
  }

  isLicenceInactive(user: AccessTokenDecoded) {
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
