import { ExpenseID } from "@domain/types/types";
import type { CurrencyCode } from "@domain/utils/currency.util";

export class Expense {
  constructor(
    public readonly id: ExpenseID,
    public name: string,
    public amountInCents: number,
    public currencyCode: CurrencyCode,
  ) {}
}
