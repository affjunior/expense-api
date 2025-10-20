import { IsString, IsNotEmpty } from "class-validator";

export class CreateMemberDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
