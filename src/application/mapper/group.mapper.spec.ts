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
        members: [
          { id: "member-1", name: "Alice" },
          { id: "member-2", name: "Bob" },
        ],
      };

      const group = GroupMapper.toDomain(dto);

      expect(group).toBeInstanceOf(Group);
      expect(group.name).toBe("Trip to Europe");
      expect(group.members).toHaveLength(2);
      expect(group.members[0].id).toBe("member-1");
      expect(group.members[0].name).toBe("Alice");
      expect(group.members[1].id).toBe("member-2");
      expect(group.members[1].name).toBe("Bob");
      expect(group.id).toBeDefined();
    });

    it("should generate UUID for group if groupId not provided", () => {
      const dto: CreateGroupDto = {
        name: "Test Group",
        members: [],
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
        members: [],
      };
      const groupId = "custom-group-id";

      const group = GroupMapper.toDomain(dto, groupId);

      expect(group.id).toBe(groupId);
    });

    it("should handle empty members array", () => {
      const dto: CreateGroupDto = {
        name: "Solo Trip",
        members: [],
      };

      const group = GroupMapper.toDomain(dto);

      expect(group.members).toHaveLength(0);
      expect(group.members).toEqual([]);
    });

    it("should create Member instances for each member in DTO", () => {
      const dto: CreateGroupDto = {
        name: "Test Group",
        members: [{ id: "m1", name: "Member 1" }],
      };

      const group = GroupMapper.toDomain(dto);

      expect(group.members[0]).toBeInstanceOf(Member);
    });
  });

  describe("expenseToDomain", () => {
    it("should convert CreateExpenseDto to Expense domain entity", () => {
      const dto: CreateExpenseDto = {
        name: "Dinner",
        amountInCents: 5000,
        payerId: "member-1",
        participants: ["member-1", "member-2"],
      };

      const expense = GroupMapper.expenseToDomain(dto);

      expect(expense).toBeInstanceOf(Expense);
      expect(expense.name).toBe("Dinner");
      expect(expense.amountInCents).toBe(5000);
      expect(expense.payerId).toBe("member-1");
      expect(expense.participants).toEqual(["member-1", "member-2"]);
      expect(expense.id).toBeDefined();
    });

    it("should generate UUID for expense if expenseId not provided", () => {
      const dto: CreateExpenseDto = {
        name: "Test",
        amountInCents: 1000,
        payerId: "m1",
        participants: ["m1"],
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
        amountInCents: 1000,
        payerId: "m1",
        participants: ["m1"],
      };
      const expenseId = "custom-expense-id";

      const expense = GroupMapper.expenseToDomain(dto, expenseId);

      expect(expense.id).toBe(expenseId);
    });

    it("should handle single participant", () => {
      const dto: CreateExpenseDto = {
        name: "Solo expense",
        amountInCents: 500,
        payerId: "m1",
        participants: ["m1"],
      };

      const expense = GroupMapper.expenseToDomain(dto);

      expect(expense.participants).toHaveLength(1);
      expect(expense.participants[0]).toBe("m1");
    });

    it("should handle multiple participants", () => {
      const dto: CreateExpenseDto = {
        name: "Group expense",
        amountInCents: 3000,
        payerId: "m1",
        participants: ["m1", "m2", "m3"],
      };

      const expense = GroupMapper.expenseToDomain(dto);

      expect(expense.participants).toHaveLength(3);
      expect(expense.participants).toEqual(["m1", "m2", "m3"]);
    });
  });

  describe("toResponseDto", () => {
    it("should convert Group to GroupResponseDto", () => {
      const group = new Group("group-1", "Trip");
      group.addMember(new Member("m1", "Alice"));
      group.addMember(new Member("m2", "Bob"));
      group.addExpense(new Expense("e1", "Dinner", 5000, "m1", ["m1", "m2"]));

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
      group.addExpense(new Expense("e1", "Dinner", 5000, "m1", ["m1"]));

      const dto = GroupMapper.toResponseDto(group);

      expect(dto.expenses[0]).toEqual({
        id: "e1",
        name: "Dinner",
        amountInCents: 5000,
        payerId: "m1",
        participants: ["m1"],
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
      const expense = new Expense("e1", "Dinner", 5000, "m1", ["m1", "m2"]);

      const dto = GroupMapper.expenseToResponseDto(expense);

      expect(dto).toEqual({
        id: "e1",
        name: "Dinner",
        amountInCents: 5000,
        payerId: "m1",
        participants: ["m1", "m2"],
      });
    });

    it("should handle expense with single participant", () => {
      const expense = new Expense("e1", "Coffee", 300, "m1", ["m1"]);

      const dto = GroupMapper.expenseToResponseDto(expense);

      expect(dto.participants).toHaveLength(1);
      expect(dto.participants[0]).toBe("m1");
    });

    it("should preserve exact amount in cents", () => {
      const expense = new Expense("e1", "Test", 12345, "m1", ["m1"]);

      const dto = GroupMapper.expenseToResponseDto(expense);

      expect(dto.amountInCents).toBe(12345);
    });
  });

  describe("toBalancesResponseDto", () => {
    it("should convert group balances to response DTO", () => {
      const group = new Group("group-1", "Trip");
      group.addMember(new Member("m1", "Alice"));
      group.addMember(new Member("m2", "Bob"));
      group.addExpense(new Expense("e1", "Dinner", 3000, "m1", ["m1", "m2"]));

      const dto = GroupMapper.toBalancesResponseDto(group);

      expect(dto.groupId).toBe("group-1");
      expect(dto.balances).toHaveLength(2);
    });

    it("should include member names in balance response", () => {
      const group = new Group("group-1", "Trip");
      group.addMember(new Member("m1", "Alice"));
      group.addMember(new Member("m2", "Bob"));

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
      group.addExpense(new Expense("e1", "Dinner", 2000, "m1", ["m1", "m2"]));

      const dto = GroupMapper.toBalancesResponseDto(group);

      const aliceBalance = dto.balances.find((b) => b.memberId === "m1");
      expect(aliceBalance?.balance).toBe(1000); // paid 2000, owes 1000

      const bobBalance = dto.balances.find((b) => b.memberId === "m2");
      expect(bobBalance?.balance).toBe(-1000); // owes 1000
    });

    it("should handle group with no expenses", () => {
      const group = new Group("group-1", "Trip");
      group.addMember(new Member("m1", "Alice"));
      group.addMember(new Member("m2", "Bob"));

      const dto = GroupMapper.toBalancesResponseDto(group);

      expect(dto.balances).toHaveLength(2);
      dto.balances.forEach((balance) => {
        expect(balance.balance).toBe(0);
      });
    });

    it("should use empty string for member name if member not found", () => {
      const group = new Group("group-1", "Trip");
      group.addMember(new Member("m1", "Alice"));
      // Manually add a balance for a non-existent member by modifying the balances Map
      const balances = group.getBalances();
      balances.set("non-existent-member", 1000);

      // Mock getBalances to return our custom Map
      jest.spyOn(group, "getBalances").mockReturnValue(balances);

      const dto = GroupMapper.toBalancesResponseDto(group);

      const nonExistentBalance = dto.balances.find(
        (b) => b.memberId === "non-existent-member",
      );
      expect(nonExistentBalance?.memberName).toBe("");
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
      const expense = new Expense("expense-1", "Dinner", 5000, "m1", [
        "m1",
        "m2",
      ]);
      const groupId = "group-1";

      const item = GroupMapper.toDbExpenseItem(expense, groupId);

      expect(item.PK).toBe("GROUP#group-1");
      expect(item.SK).toBe("EXPENSE#expense-1");
      expect(item.type).toBe("Expense");
      expect(item.expenseId).toBe("expense-1");
      expect(item.name).toBe("Dinner");
      expect(item.amountInCents).toBe(5000);
      expect(item.payerId).toBe("m1");
      expect(item.participants).toEqual(["m1", "m2"]);
      expect(item.createdAt).toBeDefined();
      expect(item.updatedAt).toBeDefined();
    });

    it("should use correct partition key for group", () => {
      const expense = new Expense("e1", "Test", 100, "m1", ["m1"]);
      const groupId = "different-group";

      const item = GroupMapper.toDbExpenseItem(expense, groupId);

      expect(item.PK).toBe("GROUP#different-group");
    });

    it("should preserve all expense details", () => {
      const expense = new Expense("e1", "Complex Expense", 12345, "payer-1", [
        "p1",
        "p2",
        "p3",
      ]);

      const item = GroupMapper.toDbExpenseItem(expense, "group-1");

      expect(item.name).toBe("Complex Expense");
      expect(item.amountInCents).toBe(12345);
      expect(item.payerId).toBe("payer-1");
      expect(item.participants).toEqual(["p1", "p2", "p3"]);
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
          payerId: "m1",
          participants: ["m1", "m2"],
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
      expect(group.expenses[0].payerId).toBe("m1");
      expect(group.expenses[0].participants).toEqual(["m1", "m2"]);
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
          payerId: "m1",
          participants: ["m1"],
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
          payerId: "m1",
          participants: ["m1", "m2"],
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
          payerId: "m2",
          participants: ["m1", "m2"],
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
          payerId: "m1",
          participants: ["m1"],
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
