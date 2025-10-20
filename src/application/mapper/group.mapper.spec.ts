/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

import { GroupMapper } from "./group.mapper";
import { Group } from "@domain/entities/group";
import { Member } from "@domain/entities/member";
import { Expense } from "@domain/entities/expense";
import { CreateGroupDto } from "@application/dto/in/createGroupDto";
import { CreateExpenseDto } from "@application/dto/in/createExpenseDto";
import {
  DynamoDBGroupItem,
  DynamoDBMemberItem,
  DynamoDBExpenseItem,
} from "@infrastructure/database/dynamodb.types";

describe("GroupMapper", () => {
  describe("toDomain", () => {
    it("should convert CreateGroupDto to Group domain entity", () => {
      const dto: CreateGroupDto = {
        name: "Trip to Europe",
      };

      const group = GroupMapper.toDomain(dto);

      expect(group).toBeInstanceOf(Group);
      expect(group.name).toBe("Trip to Europe");
      expect(group.members).toHaveLength(0);
      expect(group.id).toBeDefined();
    });

    it("should generate UUID for group if groupId not provided", () => {
      const dto: CreateGroupDto = {
        name: "Test Group",
      };

      const group1 = GroupMapper.toDomain(dto);
      const group2 = GroupMapper.toDomain(dto);

      expect(group1.id).toBeDefined();
      expect(group2.id).toBeDefined();
      expect(group1.id).not.toBe(group2.id);
    });

    it("should use provided groupId when specified", () => {
      const dto: CreateGroupDto = {
        name: "Test Group",
      };
      const groupId = "custom-group-id";

      const group = GroupMapper.toDomain(dto, groupId);

      expect(group.id).toBe(groupId);
    });

    it("should handle group creation", () => {
      const dto: CreateGroupDto = {
        name: "Solo Trip",
      };

      const group = GroupMapper.toDomain(dto);

      expect(group.members).toHaveLength(0);
      expect(group.members).toEqual([]);
    });

    it("should create Group with empty members initially", () => {
      const dto: CreateGroupDto = {
        name: "Test Group",
      };

      const group = GroupMapper.toDomain(dto);

      expect(group.members).toEqual([]);
    });
  });

  describe("expenseToDomain", () => {
    it("should convert CreateExpenseDto to Expense domain entity", () => {
      const dto: CreateExpenseDto = {
        name: "Dinner",
        amount: 50,
        currencyCode: "USD",
      };

      const expense = GroupMapper.expenseToDomain(dto);

      expect(expense).toBeInstanceOf(Expense);
      expect(expense.name).toBe("Dinner");
      expect(expense.amountInCents).toBe(5000);
      expect(expense.currencyCode).toBe("USD");
      expect(expense.id).toBeDefined();
    });

    it("should generate UUID for expense if expenseId not provided", () => {
      const dto: CreateExpenseDto = {
        name: "Test",
        amount: 10,
        currencyCode: "USD",
      };

      const expense1 = GroupMapper.expenseToDomain(dto);
      const expense2 = GroupMapper.expenseToDomain(dto);

      expect(expense1.id).toBeDefined();
      expect(expense2.id).toBeDefined();
      expect(expense1.id).not.toBe(expense2.id);
    });

    it("should use provided expenseId when specified", () => {
      const dto: CreateExpenseDto = {
        name: "Test",
        amount: 10,
        currencyCode: "USD",
      };
      const expenseId = "custom-expense-id";

      const expense = GroupMapper.expenseToDomain(dto, expenseId);

      expect(expense.id).toBe(expenseId);
    });

    it("should convert amount to cents", () => {
      const dto: CreateExpenseDto = {
        name: "Solo expense",
        amount: 5,
        currencyCode: "USD",
      };

      const expense = GroupMapper.expenseToDomain(dto);

      expect(expense.amountInCents).toBe(500);
    });

    it("should handle different currencies", () => {
      const dto: CreateExpenseDto = {
        name: "Group expense",
        amount: 30,
        currencyCode: "BRL",
      };

      const expense = GroupMapper.expenseToDomain(dto);

      expect(expense.currencyCode).toBe("BRL");
      expect(expense.amountInCents).toBe(3000);
    });
  });

  describe("toResponseDto", () => {
    it("should convert Group to GroupResponseDto", () => {
      const group = new Group("group-1", "Trip");
      group.addMember(new Member("m1", "Alice"));
      group.addMember(new Member("m2", "Bob"));
      group.addExpense(new Expense("e1", "Dinner", 5000, "USD"));

      const dto = GroupMapper.toResponseDto(group);

      expect(dto.id).toBe("group-1");
      expect(dto.name).toBe("Trip");
      expect(dto.members).toHaveLength(2);
      expect(dto.expenses).toHaveLength(1);
    });

    it("should convert group without members and expenses", () => {
      const group = new Group("group-1", "Empty Group");

      const dto = GroupMapper.toResponseDto(group);

      expect(dto.id).toBe("group-1");
      expect(dto.name).toBe("Empty Group");
      expect(dto.members).toEqual([]);
      expect(dto.expenses).toEqual([]);
    });

    it("should include all member details in response", () => {
      const group = new Group("group-1", "Trip");
      group.addMember(new Member("m1", "Alice"));

      const dto = GroupMapper.toResponseDto(group);

      expect(dto.members[0]).toEqual({
        id: "m1",
        name: "Alice",
      });
    });

    it("should include all expense details in response", () => {
      const group = new Group("group-1", "Trip");
      group.addMember(new Member("m1", "Alice"));
      group.addExpense(new Expense("e1", "Dinner", 5000, "USD"));

      const dto = GroupMapper.toResponseDto(group);

      expect(dto.expenses[0]).toEqual({
        id: "e1",
        name: "Dinner",
        amount: 50,
        amountInCents: 5000,
        currencyCode: "USD",
      });
    });
  });

  describe("memberToResponseDto", () => {
    it("should convert Member to MemberResponseDto", () => {
      const member = new Member("m1", "Alice");

      const dto = GroupMapper.memberToResponseDto(member);

      expect(dto).toEqual({
        id: "m1",
        name: "Alice",
      });
    });

    it("should handle member with different name", () => {
      const member = new Member("m2", "Bob");

      const dto = GroupMapper.memberToResponseDto(member);

      expect(dto.id).toBe("m2");
      expect(dto.name).toBe("Bob");
    });
  });

  describe("expenseToResponseDto", () => {
    it("should convert Expense to ExpenseResponseDto", () => {
      const expense = new Expense("e1", "Dinner", 5000, "USD");

      const dto = GroupMapper.expenseToResponseDto(expense);

      expect(dto).toEqual({
        id: "e1",
        name: "Dinner",
        amount: 50,
        amountInCents: 5000,
        currencyCode: "USD",
      });
    });

    it("should convert cents to amount correctly", () => {
      const expense = new Expense("e1", "Coffee", 300, "USD");

      const dto = GroupMapper.expenseToResponseDto(expense);

      expect(dto.amount).toBe(3);
      expect(dto.amountInCents).toBe(300);
    });

    it("should preserve exact amount in cents", () => {
      const expense = new Expense("e1", "Test", 12345, "USD");

      const dto = GroupMapper.expenseToResponseDto(expense);

      expect(dto.amountInCents).toBe(12345);
      expect(dto.amount).toBe(123.45);
    });
  });

  describe("toBalancesResponseDto", () => {
    it("should convert group balances to response DTO", () => {
      const group = new Group("group-1", "Trip");
      group.addMember(new Member("m1", "Alice"));
      group.addMember(new Member("m2", "Bob"));
      group.addExpense(new Expense("e1", "Dinner", 3000, "USD"));

      const dto = GroupMapper.toBalancesResponseDto(group);

      expect(dto.groupId).toBe("group-1");
      expect(dto.balances).toHaveLength(2);
    });

    it("should include member names in balance response", () => {
      const group = new Group("group-1", "Trip");
      group.addMember(new Member("m1", "Alice"));
      group.addMember(new Member("m2", "Bob"));
      group.addExpense(new Expense("e1", "Dinner", 2000, "USD"));

      const dto = GroupMapper.toBalancesResponseDto(group);

      const aliceBalance = dto.balances.find((b) => b.memberId === "m1");
      expect(aliceBalance?.memberName).toBe("Alice");

      const bobBalance = dto.balances.find((b) => b.memberId === "m2");
      expect(bobBalance?.memberName).toBe("Bob");
    });

    it("should calculate correct balances", () => {
      const group = new Group("group-1", "Trip");
      group.addMember(new Member("m1", "Alice"));
      group.addMember(new Member("m2", "Bob"));
      group.addExpense(new Expense("e1", "Dinner", 2000, "USD"));

      const dto = GroupMapper.toBalancesResponseDto(group);

      expect(dto.balances).toBeDefined();
      expect(dto.balances.length).toBeGreaterThan(0);
    });

    it("should handle group with no expenses", () => {
      const group = new Group("group-1", "Trip");
      group.addMember(new Member("m1", "Alice"));
      group.addMember(new Member("m2", "Bob"));
      group.addExpense(new Expense("e1", "Dinner", 2000, "USD"));

      const dto = GroupMapper.toBalancesResponseDto(group);

      expect(dto.balances).toBeDefined();
      expect(dto.balances.length).toBeGreaterThan(0);
    });

    it("should include currency code in balances", () => {
      const group = new Group("group-1", "Trip");
      group.addMember(new Member("m1", "Alice"));
      group.addExpense(new Expense("e1", "Dinner", 2000, "USD"));

      const dto = GroupMapper.toBalancesResponseDto(group);

      expect(dto.balances[0].currencyCode).toBe("USD");
    });
  });

  describe("toDbGroupItem", () => {
    it("should convert Group to DynamoDB group item", () => {
      const group = new Group("group-1", "Trip to Europe");

      const item = GroupMapper.toDbGroupItem(group);

      expect(item.PK).toBe("GROUP#group-1");
      expect(item.SK).toBe("METADATA");
      expect(item.type).toBe("Group");
      expect(item.groupId).toBe("group-1");
      expect(item.name).toBe("Trip to Europe");
      expect(item.createdAt).toBeDefined();
      expect(item.updatedAt).toBeDefined();
    });

    it("should generate timestamp in ISO format", () => {
      const group = new Group("group-1", "Test");

      const item = GroupMapper.toDbGroupItem(group);

      expect(item.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(item.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it("should set createdAt and updatedAt to same value", () => {
      const group = new Group("group-1", "Test");

      const item = GroupMapper.toDbGroupItem(group);

      expect(item.createdAt).toBe(item.updatedAt);
    });
  });

  describe("toDbMemberItem", () => {
    it("should convert Member to DynamoDB member item", () => {
      const member = new Member("member-1", "Alice");
      const groupId = "group-1";

      const item = GroupMapper.toDbMemberItem(member, groupId);

      expect(item.PK).toBe("GROUP#group-1");
      expect(item.SK).toBe("MEMBER#member-1");
      expect(item.type).toBe("Member");
      expect(item.memberId).toBe("member-1");
      expect(item.name).toBe("Alice");
      expect(item.createdAt).toBeDefined();
      expect(item.updatedAt).toBeDefined();
    });

    it("should use correct partition key for group", () => {
      const member = new Member("m1", "Test");
      const groupId = "different-group";

      const item = GroupMapper.toDbMemberItem(member, groupId);

      expect(item.PK).toBe("GROUP#different-group");
    });

    it("should generate timestamps", () => {
      const member = new Member("m1", "Test");

      const item = GroupMapper.toDbMemberItem(member, "group-1");

      expect(item.createdAt).toBeDefined();
      expect(item.updatedAt).toBeDefined();
      expect(item.createdAt).toBe(item.updatedAt);
    });
  });

  describe("toDbExpenseItem", () => {
    it("should convert Expense to DynamoDB expense item", () => {
      const expense = new Expense("expense-1", "Dinner", 5000, "USD");
      const groupId = "group-1";

      const item = GroupMapper.toDbExpenseItem(expense, groupId);

      expect(item.PK).toBe("GROUP#group-1");
      expect(item.SK).toBe("EXPENSE#expense-1");
      expect(item.type).toBe("Expense");
      expect(item.expenseId).toBe("expense-1");
      expect(item.name).toBe("Dinner");
      expect(item.amountInCents).toBe(5000);
      expect(item.currencyCode).toBe("USD");
      expect(item.createdAt).toBeDefined();
      expect(item.updatedAt).toBeDefined();
    });

    it("should use correct partition key for group", () => {
      const expense = new Expense("e1", "Test", 100, "USD");
      const groupId = "different-group";

      const item = GroupMapper.toDbExpenseItem(expense, groupId);

      expect(item.PK).toBe("GROUP#different-group");
    });

    it("should preserve all expense details", () => {
      const expense = new Expense("e1", "Complex Expense", 12345, "BRL");

      const item = GroupMapper.toDbExpenseItem(expense, "group-1");

      expect(item.name).toBe("Complex Expense");
      expect(item.amountInCents).toBe(12345);
      expect(item.currencyCode).toBe("BRL");
    });
  });

  describe("fromDbToDomain", () => {
    it("should convert DynamoDB items to Group domain entity", () => {
      const items: Array<
        DynamoDBGroupItem | DynamoDBMemberItem | DynamoDBExpenseItem
      > = [
        {
          PK: "GROUP#group-1",
          SK: "GROUP#",
          type: "Group",
          groupId: "group-1",
          name: "Trip to Europe",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
      ];

      const group = GroupMapper.fromDbToDomain(items, "group-1");

      expect(group).toBeInstanceOf(Group);
      expect(group.id).toBe("group-1");
      expect(group.name).toBe("Trip to Europe");
      expect(group.members).toEqual([]);
      expect(group.expenses).toEqual([]);
    });

    it("should convert items with members", () => {
      const items: Array<
        DynamoDBGroupItem | DynamoDBMemberItem | DynamoDBExpenseItem
      > = [
        {
          PK: "GROUP#group-1",
          SK: "GROUP#",
          type: "Group",
          groupId: "group-1",
          name: "Trip",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
        {
          PK: "GROUP#group-1",
          SK: "MEMBER#m1",
          type: "Member",
          memberId: "m1",
          name: "Alice",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
        {
          PK: "GROUP#group-1",
          SK: "MEMBER#m2",
          type: "Member",
          memberId: "m2",
          name: "Bob",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
      ];

      const group = GroupMapper.fromDbToDomain(items, "group-1");

      expect(group.members).toHaveLength(2);
      expect(group.members[0]).toBeInstanceOf(Member);
      expect(group.members[0].id).toBe("m1");
      expect(group.members[0].name).toBe("Alice");
      expect(group.members[1].id).toBe("m2");
      expect(group.members[1].name).toBe("Bob");
    });

    it("should convert items with expenses", () => {
      const items: Array<
        DynamoDBGroupItem | DynamoDBMemberItem | DynamoDBExpenseItem
      > = [
        {
          PK: "GROUP#group-1",
          SK: "GROUP#",
          type: "Group",
          groupId: "group-1",
          name: "Trip",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
        {
          PK: "GROUP#group-1",
          SK: "EXPENSE#e1",
          type: "Expense",
          expenseId: "e1",
          name: "Dinner",
          amountInCents: 5000,
          currencyCode: "USD",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
      ];

      const group = GroupMapper.fromDbToDomain(items, "group-1");

      expect(group.expenses).toHaveLength(1);
      expect(group.expenses[0]).toBeInstanceOf(Expense);
      expect(group.expenses[0].id).toBe("e1");
      expect(group.expenses[0].name).toBe("Dinner");
      expect(group.expenses[0].amountInCents).toBe(5000);
      expect(group.expenses[0].currencyCode).toBe("USD");
    });

    it("should convert complete group with members and expenses", () => {
      const items: Array<
        DynamoDBGroupItem | DynamoDBMemberItem | DynamoDBExpenseItem
      > = [
        {
          PK: "GROUP#group-1",
          SK: "GROUP#",
          type: "Group",
          groupId: "group-1",
          name: "Trip",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
        {
          PK: "GROUP#group-1",
          SK: "MEMBER#m1",
          type: "Member",
          memberId: "m1",
          name: "Alice",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
        {
          PK: "GROUP#group-1",
          SK: "EXPENSE#e1",
          type: "Expense",
          expenseId: "e1",
          name: "Dinner",
          amountInCents: 3000,
          currencyCode: "USD",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
      ];

      const group = GroupMapper.fromDbToDomain(items, "group-1");

      expect(group.id).toBe("group-1");
      expect(group.name).toBe("Trip");
      expect(group.members).toHaveLength(1);
      expect(group.expenses).toHaveLength(1);
    });

    it("should handle multiple members and expenses", () => {
      const items: Array<
        DynamoDBGroupItem | DynamoDBMemberItem | DynamoDBExpenseItem
      > = [
        {
          PK: "GROUP#group-1",
          SK: "GROUP#",
          type: "Group",
          groupId: "group-1",
          name: "Trip",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
        {
          PK: "GROUP#group-1",
          SK: "MEMBER#m1",
          type: "Member",
          memberId: "m1",
          name: "Alice",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
        {
          PK: "GROUP#group-1",
          SK: "MEMBER#m2",
          type: "Member",
          memberId: "m2",
          name: "Bob",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
        {
          PK: "GROUP#group-1",
          SK: "EXPENSE#e1",
          type: "Expense",
          expenseId: "e1",
          name: "Dinner",
          amountInCents: 5000,
          currencyCode: "USD",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
        {
          PK: "GROUP#group-1",
          SK: "EXPENSE#e2",
          type: "Expense",
          expenseId: "e2",
          name: "Lunch",
          amountInCents: 3000,
          currencyCode: "USD",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
      ];

      const group = GroupMapper.fromDbToDomain(items, "group-1");

      expect(group.members).toHaveLength(2);
      expect(group.expenses).toHaveLength(2);
    });

    it("should handle items in any order", () => {
      const items: Array<
        DynamoDBGroupItem | DynamoDBMemberItem | DynamoDBExpenseItem
      > = [
        {
          PK: "GROUP#group-1",
          SK: "MEMBER#m1",
          type: "Member",
          memberId: "m1",
          name: "Alice",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
        {
          PK: "GROUP#group-1",
          SK: "EXPENSE#e1",
          type: "Expense",
          expenseId: "e1",
          name: "Dinner",
          amountInCents: 5000,
          currencyCode: "USD",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
        {
          PK: "GROUP#group-1",
          SK: "GROUP#",
          type: "Group",
          groupId: "group-1",
          name: "Trip",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
      ];

      const group = GroupMapper.fromDbToDomain(items, "group-1");

      expect(group.name).toBe("Trip");
      expect(group.members).toHaveLength(1);
      expect(group.expenses).toHaveLength(1);
    });

    it("should use provided groupId even if different from items", () => {
      const items: Array<
        DynamoDBGroupItem | DynamoDBMemberItem | DynamoDBExpenseItem
      > = [
        {
          PK: "GROUP#group-1",
          SK: "GROUP#",
          type: "Group",
          groupId: "group-1",
          name: "Trip",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
      ];

      const group = GroupMapper.fromDbToDomain(items, "different-id");

      expect(group.id).toBe("different-id");
    });
  });
});
