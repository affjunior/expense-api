import { ExpenseResponseDto } from "./expenseResponseDto";
import { MemberResponseDto } from "./memberResponseDto";

export class GroupResponseDto {
  id: string;
  name: string;
  members: MemberResponseDto[];
  expenses: ExpenseResponseDto[];
}
