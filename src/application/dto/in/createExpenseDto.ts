import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsArray,
  ArrayMinSize,
  Min,
} from "class-validator";

export class CreateExpenseDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(1)
  amountInCents: number;

  @IsString()
  @IsNotEmpty()
  payerId: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  participants: string[];
}
