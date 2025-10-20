import { Group } from "@domain/entities/group";
import { Member } from "@domain/entities/member";
import { Expense } from "@domain/entities/expense";
import { CreateGroupDto } from "@application/dto/in/createGroupDto";
import { CreateExpenseDto } from "@application/dto/in/createExpenseDto";
import { GroupResponseDto } from "@application/dto/out/groupResponseDto";
import { MemberResponseDto } from "@application/dto/out/memberResponseDto";
import { ExpenseResponseDto } from "@application/dto/out/expenseResponseDto";
import { BalanceResponseDto } from "@application/dto/out/balanceResponseDto";
import { GroupBalancesResponseDto } from "@application/dto/out/groupBalancesResponseDto";
import {
  DynamoDBGroupItem,
  DynamoDBMemberItem,
  DynamoDBExpenseItem,
} from "@infrastructure/database/dynamodb.types";
import { KeyBuilder } from "@infrastructure/database/mapper/KeyBuilder";
import { v4 as uuidv4 } from "uuid";
import {
  convertToCents,
  convertFromCents,
  type CurrencyCode,
} from "@domain/utils/currency.util";
import { CreateMemberDto } from "@application/dto/in/createMemberDto";
import { Balance } from "@domain/entities/balance";
import { CreateBalancesDto } from "@application/dto/in/CreateBalancesDto";

export class GroupMapper {
  static toDomain(dto: CreateGroupDto, groupId?: string): Group {
    const id = groupId || uuidv4();
    const group = new Group(id, dto.name);
    return group;
  }

  static expenseToDomain(dto: CreateExpenseDto, expenseId?: string): Expense {
    const id = expenseId || uuidv4();
    const amountInCents = convertToCents(
      dto.amount,
      dto.currencyCode as CurrencyCode,
    );
    return new Expense(
      id,
      dto.name,
      amountInCents,
      dto.currencyCode as CurrencyCode,
    );
  }

  static memberToDomain(dto: CreateMemberDto): Member {
    const id = uuidv4();
    const member = new Member(id, dto.name);
    return member;
  }

  static balanceToDomain(dto: CreateBalancesDto): Balance {
    const balance = new Balance(dto.currencyCode as CurrencyCode, 0);
    return balance;
  }

  // Domain to DTO Response
  static toResponseDto(group: Group): GroupResponseDto {
    return {
      id: group.id,
      name: group.name,
      members: group.members.map((member) => this.memberToResponseDto(member)),
      expenses: group.expenses.map((expense) =>
        this.expenseToResponseDto(expense),
      ),
    };
  }

  static memberToResponseDto(member: Member): MemberResponseDto {
    return {
      id: member.id,
      name: member.name,
    };
  }

  static expenseToResponseDto(expense: Expense): ExpenseResponseDto {
    const amount = convertFromCents(
      expense.amountInCents,
      expense.currencyCode,
    );
    return {
      id: expense.id,
      name: expense.name,
      amount,
      amountInCents: expense.amountInCents,
      currencyCode: expense.currencyCode,
    };
  }

  static toBalancesResponseDto(group: Group): GroupBalancesResponseDto {
    const balances = group.getBalances();
    const balancesList: BalanceResponseDto[] = [];

    // Get currency from the first expense, default to USD if no expenses
    const currencyCode =
      group.expenses.length > 0 ? group.expenses[0].currencyCode : "USD";

    balances.forEach((balance, memberId) => {
      const member = group.members.find((m) => m.id === memberId);
      const amount = convertFromCents(balance, currencyCode as CurrencyCode);
      balancesList.push({
        memberId,
        memberName: member?.name || "",
        amount,
        balance,
        currencyCode: currencyCode as CurrencyCode,
      });
    });

    return {
      groupId: group.id,
      balances: balancesList,
    };
  }

  // Domain to Database
  static toDbGroupItem(group: Group): DynamoDBGroupItem {
    const timestamp = new Date().toISOString();
    const pk = KeyBuilder.groupPK(group.id);

    return {
      PK: pk,
      SK: KeyBuilder.groupSK(),
      type: "Group",
      groupId: group.id,
      name: group.name,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }

  static toDbMemberItem(member: Member, groupId: string): DynamoDBMemberItem {
    const timestamp = new Date().toISOString();
    const pk = KeyBuilder.groupPK(groupId);

    return {
      PK: pk,
      SK: KeyBuilder.memberSK(member.id),
      type: "Member",
      memberId: member.id,
      name: member.name,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }

  static toDbExpenseItem(
    expense: Expense,
    groupId: string,
  ): DynamoDBExpenseItem {
    const timestamp = new Date().toISOString();
    const pk = KeyBuilder.groupPK(groupId);

    return {
      PK: pk,
      SK: KeyBuilder.expenseSK(expense.id),
      type: "Expense",
      expenseId: expense.id,
      name: expense.name,
      amountInCents: expense.amountInCents,
      currencyCode: expense.currencyCode.toString(),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }

  // Database to Domain
  static fromDbToDomain(
    items: Array<DynamoDBGroupItem | DynamoDBMemberItem | DynamoDBExpenseItem>,
    groupId: string,
  ): Group {
    let groupName = "";
    const members: Member[] = [];
    const expenses: Expense[] = [];

    for (const item of items) {
      switch (item.type) {
        case "Group":
          groupName = item.name;
          break;
        case "Member": {
          const memberItem = item;
          members.push(new Member(memberItem.memberId, memberItem.name));
          break;
        }
        case "Expense": {
          const expenseItem = item;
          expenses.push(
            new Expense(
              expenseItem.expenseId,
              expenseItem.name,
              expenseItem.amountInCents,
              expenseItem.currencyCode as CurrencyCode,
            ),
          );
          break;
        }
      }
    }

    const group = new Group(groupId, groupName);
    group.members = members;
    group.expenses = expenses;

    return group;
  }
}
