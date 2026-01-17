import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { PaymentStatus } from '../types/payment-status.type';

@Injectable()
export class StripeStrategy {
  private stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-08-27.basil',
  });

  async createCheckoutSession(email: string, courseId: string, amount: number) {
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: amount * 100, // amount in cents
            product_data: {
              name: `Course: ${courseId}`,
            },
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`,
      metadata: { courseId },
    });

    return {
      sessionId: session.id,
      paymentUrl: session.url,
      status: PaymentStatus.PENDING,
    };
  }

  async verifySession(sessionId: string) {
    const session = await this.stripe.checkout.sessions.retrieve(sessionId);

    return {
      transactionId: session.id,
      courseId: session.metadata?.courseId,
      amount: (session.amount_total ?? 0) / 100,
      status:
        session.payment_status === 'paid'
          ? PaymentStatus.SUCCESS
          : PaymentStatus.FAILED,
      paidAt: session.payment_status === 'paid' ? new Date() : undefined,
    };
  }
}

// 🔐 Note

// Make sure you have Stripe configured in your .env:

// STRIPE_SECRET_KEY=sk_test_...
// FRONTEND_URL=http://localhost:4200
