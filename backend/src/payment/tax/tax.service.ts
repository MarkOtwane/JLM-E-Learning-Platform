import { Injectable } from '@nestjs/common';
import { TAX_RATES, getDefaultTaxRate } from '../config/tax.config';

@Injectable()
export class TaxService {
  calculateTax(
    amount: number,
    country?: string,
  ): { tax: number; total: number } {
    let taxRate = getDefaultTaxRate();

    if (country) {
      taxRate = TAX_RATES[country] ?? getDefaultTaxRate();
    }

    const tax = parseFloat((amount * taxRate).toFixed(2));
    const total = parseFloat((amount + tax).toFixed(2));

    return { tax, total };
  }
}
