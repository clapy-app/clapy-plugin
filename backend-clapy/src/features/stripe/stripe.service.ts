import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { LoginTokensEntity } from '../../auth/login-tokens.entity.js';
import type { AccessTokenDecoded } from '../user/user.utils.js';

@Injectable()
export class StripeService {
  constructor(@InjectRepository(LoginTokensEntity) private loginTokensRepo: Repository<LoginTokensEntity>) {}

  isLicenceInactive(user: AccessTokenDecoded) {
    const licenceExpirationDate = user['https://clapy.co/licence-expiration-date'];
    const hasRoleFreeStripeAccess = user['https://clapy.co/roles']?.includes('FreeStripeAccess');
    if (hasRoleFreeStripeAccess) {
      return false;
    }
    if (typeof licenceExpirationDate === 'undefined') {
      return true;
    }
    const now = new Date();
    const expirationDate = new Date(licenceExpirationDate * 1000);

    const timeDiff = now.getTime() - expirationDate.getTime();
    const isExpired = timeDiff >= 0;
    return isExpired;
  }

  async startPayment(userId: string) {
    await this.updatePaymentStatus(userId, 'start');
  }

  async completePayment(userId: string) {
    await this.updatePaymentStatus(userId, 'completed');
  }

  async cancelPayment(userId: string) {
    await this.updatePaymentStatus(userId, 'canceled');
  }

  private async updatePaymentStatus(userId: string, status: 'start' | 'completed' | 'canceled') {
    if (!userId) throw new Error(`No Auth0 user ID, cannot update its payment status to '${status}'.`);
    await this.loginTokensRepo.upsert(
      { userId, paymentStatus: status },
      { skipUpdateIfNoValuesChanged: true, conflictPaths: ['userId'] },
    );
  }
}
