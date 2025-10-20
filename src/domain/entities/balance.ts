import { CurrencyCode } from "@domain/utils/currency.util";

export class Balance {
  constructor(
    public currencyCode: CurrencyCode,
    public readonly amount: number,
  ) {}
}
