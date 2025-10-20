import { IsString, IsNotEmpty, IsNumber, Min, IsIn } from "class-validator";
import { SUPPORTED_CURRENCIES } from "@domain/utils/currency.util";

export class CreateExpenseDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  @IsNotEmpty()
  @IsIn(SUPPORTED_CURRENCIES)
  currencyCode: string;
}
