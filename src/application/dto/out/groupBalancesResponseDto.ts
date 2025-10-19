import { BalanceResponseDto } from "./balanceResponseDto";

export class GroupBalancesResponseDto {
  groupId: string;
  balances: BalanceResponseDto[];
}
