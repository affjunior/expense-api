import { SUPPORTED_CURRENCIES } from "@domain/utils/currency.util";
import { IsString, IsNotEmpty, IsIn } from "class-validator";

export class CreateBalancesDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(SUPPORTED_CURRENCIES)
  currencyCode: string;
}
