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

export class GroupMapper {
  // DTO to Domain
  static toDomain(dto: CreateGroupDto, groupId?: string): Group {
    const id = groupId || uuidv4();
    const group = new Group(id, dto.name);

    dto.members.forEach((memberDto) => {
      const member = new Member(memberDto.id, memberDto.name);
      group.addMember(member);
    });

    return group;
  }

  static expenseToDomain(dto: CreateExpenseDto, expenseId?: string): Expense {
    const id = expenseId || uuidv4();
    return new Expense(
      id,
      dto.name,
      dto.amountInCents,
      dto.payerId,
      dto.participants,
    );
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
    return {
      id: expense.id,
      name: expense.name,
      amountInCents: expense.amountInCents,
      payerId: expense.payerId,
      participants: expense.participants,
    };
  }

  static toBalancesResponseDto(group: Group): GroupBalancesResponseDto {
    const balances = group.getBalances();
    const balancesList: BalanceResponseDto[] = [];

    balances.forEach((balance, memberId) => {
      const member = group.members.find((m) => m.id === memberId);
      balancesList.push({
        memberId,
        memberName: member?.name || "",
        balance,
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
      payerId: expense.payerId,
      participants: expense.participants,
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
              expenseItem.payerId,
              expenseItem.participants,
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
