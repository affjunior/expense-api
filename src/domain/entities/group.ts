import { GroupID, MemberID } from "@domain/types/types";
import { Expense } from "./expense";
import { Member } from "./member";
import { PayerNotMemberError } from "@domain/exceptions/PayerNotMemberError";
import { ParticipantNotMemberError } from "@domain/exceptions/ParticipantNotMemberError";
import { MemberAlreadyExistsError } from "@domain/exceptions/MemberAlreadyExistsError";

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

  addExpense(expense: Expense): void {
    // Valida se o pagador e os participantes existem no grupo
    const memberIds = this.members.map((m) => m.id);
    if (!memberIds.includes(expense.payerId)) {
      throw new PayerNotMemberError(expense.payerId);
    }
    for (const participantId of expense.participants) {
      if (!memberIds.includes(participantId)) {
        throw new ParticipantNotMemberError(participantId);
      }
    }
    this.expenses.push(expense);
  }

  getBalances(): Map<MemberID, number> {
    const balances = new Map<MemberID, number>();
    this.members.forEach((member) => balances.set(member.id, 0));

    this.expenses.forEach((expense) => {
      // Adiciona o valor total ao pagador
      const payerBalance = balances.get(expense.payerId) || 0;
      balances.set(expense.payerId, payerBalance + expense.amountInCents);

      // Divide o custo entre os participantes
      const numParticipants = expense.participants.length;
      const amountPerPerson = Math.floor(
        expense.amountInCents / numParticipants,
      );
      let remainder = expense.amountInCents % numParticipants;

      expense.participants.forEach((participantId) => {
        let amountToDeduct = amountPerPerson;
        // Distribui o resto (1 centavo por pessoa) de forma determinística
        if (remainder > 0) {
          amountToDeduct += 1;
          remainder -= 1;
        }

        const participantBalance = balances.get(participantId) || 0;

        balances.set(participantId, participantBalance - amountToDeduct);
      });
    });

    return balances;
  }
}
