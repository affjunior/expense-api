import { CurrencyCode } from "@domain/utils/currency.util";

export class BalanceResponseDto {
  memberId: string;
  memberName: string;
  amount: number;
  balance: number;
  currencyCode: CurrencyCode;
}
