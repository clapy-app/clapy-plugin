import type { MessageEvent } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { ReplaySubject } from 'rxjs';

const stripeSubject = new ReplaySubject<MessageEvent>();

@Injectable()
export class StripeService {
  getPaymentCompletedObservable() {
    return stripeSubject.asObservable();
  }

  emitStripePaymentStatus(status: boolean) {
    stripeSubject.next({ data: 'status: ' + status });
  }
}
