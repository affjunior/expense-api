import { CurrencyCode } from "@domain/utils/currency.util";

export class ExpenseResponseDto {
  id: string;
  name: string;
  amount: number;
  amountInCents: number;
  currencyCode: CurrencyCode;
}
