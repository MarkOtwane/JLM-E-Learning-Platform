/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable prettier/prettier */
// src/payments/strategies/mpesa.strategy.ts

import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { PaymentStatus } from '../types/payment-status.type';

@Injectable()
export class MpesaStrategy {
  private consumerKey = process.env.MPESA_CONSUMER_KEY;
  private consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  private shortcode = process.env.MPESA_SHORTCODE;
  private passkey = process.env.MPESA_PASSKEY;
  private callbackUrl = process.env.MPESA_CALLBACK_URL;

  private async getAccessToken(): Promise<string> {
    const auth = Buffer.from(
      `${this.consumerKey}:${this.consumerSecret}`,
    ).toString('base64');
    const response = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      },
    );
    return response.data.access_token;
  }

  async initiateStkPush(phone: string, courseId: string, amount: number) {
    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:\.Z]/g, '')
      .slice(0, 14);

    const password = Buffer.from(
      `${this.shortcode}${this.passkey}${timestamp}`,
    ).toString('base64');

    const accessToken = await this.getAccessToken();

    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: phone,
        PartyB: this.shortcode,
        PhoneNumber: phone,
        CallBackURL: this.callbackUrl,
        AccountReference: courseId,
        TransactionDesc: `Payment for course ${courseId}`,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return {
      status: PaymentStatus.PENDING,
      transactionId: response.data.CheckoutRequestID,
    };
  }

  
  async verifyStkPush(transactionId: string): Promise<{
    transactionId: string;
    courseId: string;
    status: PaymentStatus;
    paidAt?: Date;
  }> {
    // Simulated verification logic — in production, listen to callbacks
    return {
      transactionId,
      courseId: 'demo-course',
      status: PaymentStatus.SUCCESS,
      paidAt: new Date(),
    };
  }
}
