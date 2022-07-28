import type { MessageEvent } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { ReplaySubject } from 'rxjs';

const stripeSubject = new ReplaySubject<MessageEvent>();

@Injectable()
export class StripeService {
  getPaymentCompletedObservable() {
    return stripeSubject.asObservable();
  }
  isLicenceExpired(licenceExpirationDate: number | undefined) {
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
