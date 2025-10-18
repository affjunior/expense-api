import { ExpenseID, MemberID } from "@domain/types/types";

export class Expense {
  constructor(
    public readonly id: ExpenseID,
    public name: string,
    public amountInCents: number,
    public payerId: MemberID,
    public participants: MemberID[],
  ) {}
}
