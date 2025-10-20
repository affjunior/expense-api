import { GroupID, MemberID } from "@domain/types/types";
import { Expense } from "./expense";
import { Member } from "./member";
import { MemberAlreadyExistsError } from "@domain/exceptions/MemberAlreadyExistsError";
import { CurrencyCode } from "@domain/utils/currency.util";

export class Group {
  public members: Member[] = [];
  public expenses: Expense[] = [];

  constructor(
    public readonly id: GroupID,
    public name: string,
  ) {}

  addMember(member: Member): void {
    if (this.members.find((m) => m.id === member.id)) {
      throw new MemberAlreadyExistsError(member.id);
    }
    this.members.push(member);
  }

  addExpense(expense: Expense, group: Group): void {
    this.expenses.push(expense);
  }

  getBalances(): Map<MemberID, number> {
    const balances = new Map<MemberID, number>();

    // Initialize all members with 0 balance
    this.members.forEach((member) => balances.set(member.id, 0));

    // Calculate total expenses in cents
    const totalAmountInCents = this.expenses.reduce(
      (sum, expense) => sum + expense.amountInCents,
      0,
    );

    // Divide equally among all members
    const amountPerMember = Math.floor(
      totalAmountInCents / this.members.length,
    );

    // Set the balance for each member
    this.members.forEach((member) => {
      balances.set(member.id, amountPerMember);
    });

    return balances;
  }
}
