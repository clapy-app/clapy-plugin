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

    const isExpired = now.getTime() - expirationDate.getTime();
    if (isExpired >= 0) {
      return true;
    } else {
      return false;
    }
  }
  emitStripePaymentStatus(status: boolean) {
    stripeSubject.next({ data: JSON.stringify({ status: status }) });
  }
}
