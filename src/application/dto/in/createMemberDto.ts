import { IsString, IsNotEmpty } from "class-validator";

export class CreateMemberDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}
