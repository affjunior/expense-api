/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// @ts-nocheck

import { DynamoDBExpenseRepository } from "./dynamodbExpense";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { Expense } from "@domain/entities/expense";
import { GroupID } from "@domain/types/types";

describe("DynamoDBExpenseRepository", () => {
  let repository: DynamoDBExpenseRepository;
  let mockDynamoDb: jest.Mocked<DynamoDBDocumentClient>;

  const groupId: GroupID = "group-123";
  const expense1 = new Expense("expense-1", "Dinner", 5000, "member-1", [
    "member-1",
    "member-2",
  ]);
  const expense2 = new Expense("expense-2", "Lunch", 3000, "member-2", [
    "member-2",
    "member-3",
  ]);

  beforeEach(() => {
    mockDynamoDb = {
      send: jest.fn() as any,
    } as unknown as jest.Mocked<DynamoDBDocumentClient>;

    repository = new DynamoDBExpenseRepository(mockDynamoDb);
  });

  describe("findByGroupId", () => {
    it("should return empty array when no expenses found", async () => {
      mockDynamoDb.send.mockResolvedValue({
        Items: [],
      });

      const result = await repository.findByGroupId(groupId);

      expect(result).toEqual([]);
      expect(mockDynamoDb.send).toHaveBeenCalledTimes(1);
    });

    it("should return empty array when Items is undefined", async () => {
      mockDynamoDb.send.mockResolvedValue({});

      const result = await repository.findByGroupId(groupId);

      expect(result).toEqual([]);
    });

    it("should return single expense when found", async () => {
      mockDynamoDb.send.mockResolvedValue({
        Items: [
          {
            PK: "GROUP#group-123",
            SK: "EXPENSE#expense-1",
            type: "Expense",
            expenseId: "expense-1",
            name: "Dinner",
            amountInCents: 5000,
            payerId: "member-1",
            participants: ["member-1", "member-2"],
            createdAt: "2024-01-01T00:00:00.000Z",
            updatedAt: "2024-01-01T00:00:00.000Z",
          },
        ],
      });

      const result = await repository.findByGroupId(groupId);

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Expense);
      expect(result[0].id).toBe("expense-1");
      expect(result[0].name).toBe("Dinner");
      expect(result[0].amountInCents).toBe(5000);
      expect(result[0].payerId).toBe("member-1");
      expect(result[0].participants).toEqual(["member-1", "member-2"]);
    });

    it("should return multiple expenses when found", async () => {
      mockDynamoDb.send.mockResolvedValue({
        Items: [
          {
            PK: "GROUP#group-123",
            SK: "EXPENSE#expense-1",
            type: "Expense",
            expenseId: "expense-1",
            name: "Dinner",
            amountInCents: 5000,
            payerId: "member-1",
            participants: ["member-1", "member-2"],
            createdAt: "2024-01-01T00:00:00.000Z",
            updatedAt: "2024-01-01T00:00:00.000Z",
          },
          {
            PK: "GROUP#group-123",
            SK: "EXPENSE#expense-2",
            type: "Expense",
            expenseId: "expense-2",
            name: "Lunch",
            amountInCents: 3000,
            payerId: "member-2",
            participants: ["member-2", "member-3"],
            createdAt: "2024-01-01T00:00:00.000Z",
            updatedAt: "2024-01-01T00:00:00.000Z",
          },
        ],
      });

      const result = await repository.findByGroupId(groupId);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("expense-1");
      expect(result[1].id).toBe("expense-2");
    });

    it("should use correct query parameters", async () => {
      mockDynamoDb.send.mockResolvedValue({ Items: [] });

      await repository.findByGroupId(groupId);

      const sentCommand = mockDynamoDb.send.mock.calls[0]?.[0];
      expect(sentCommand?.input.KeyConditionExpression).toBe(
        "PK = :pk AND begins_with(SK, :sk)",
      );
      expect(sentCommand?.input.ExpressionAttributeValues).toEqual({
        ":pk": "GROUP#group-123",
        ":sk": "EXPENSE#",
      });
    });

    it("should handle expense with single participant", async () => {
      mockDynamoDb.send.mockResolvedValue({
        Items: [
          {
            PK: "GROUP#group-123",
            SK: "EXPENSE#expense-1",
            type: "Expense",
            expenseId: "expense-1",
            name: "Solo Coffee",
            amountInCents: 500,
            payerId: "member-1",
            participants: ["member-1"],
            createdAt: "2024-01-01T00:00:00.000Z",
            updatedAt: "2024-01-01T00:00:00.000Z",
          },
        ],
      });

      const result = await repository.findByGroupId(groupId);

      expect(result[0].participants).toEqual(["member-1"]);
    });

    it("should handle expense with multiple participants", async () => {
      mockDynamoDb.send.mockResolvedValue({
        Items: [
          {
            PK: "GROUP#group-123",
            SK: "EXPENSE#expense-1",
            type: "Expense",
            expenseId: "expense-1",
            name: "Group Dinner",
            amountInCents: 10000,
            payerId: "member-1",
            participants: ["member-1", "member-2", "member-3", "member-4"],
            createdAt: "2024-01-01T00:00:00.000Z",
            updatedAt: "2024-01-01T00:00:00.000Z",
          },
        ],
      });

      const result = await repository.findByGroupId(groupId);

      expect(result[0].participants).toHaveLength(4);
    });
  });

  describe("save", () => {
    it("should save an expense successfully", async () => {
      mockDynamoDb.send.mockResolvedValue({});

      const result = await repository.save(expense1, groupId);

      expect(result).toBe(expense1);
      expect(mockDynamoDb.send).toHaveBeenCalledTimes(1);
    });

    it("should include correct item structure", async () => {
      mockDynamoDb.send.mockResolvedValue({});

      await repository.save(expense1, groupId);

      const sentCommand = mockDynamoDb.send.mock.calls[0]?.[0];
      const item = sentCommand?.input.Item as Record<string, unknown>;

      expect(item?.PK).toBe("GROUP#group-123");
      expect(item?.SK).toBe("EXPENSE#expense-1");
      expect(item?.type).toBe("Expense");
      expect(item?.expenseId).toBe("expense-1");
      expect(item?.name).toBe("Dinner");
      expect(item?.amountInCents).toBe(5000);
      expect(item?.payerId).toBe("member-1");
      expect(item?.participants).toEqual(["member-1", "member-2"]);
      expect(item?.createdAt).toBeDefined();
      expect(item?.updatedAt).toBeDefined();
    });

    it("should set timestamps", async () => {
      const beforeSave = new Date().toISOString();
      mockDynamoDb.send.mockResolvedValue({});

      await repository.save(expense1, groupId);

      const sentCommand = mockDynamoDb.send.mock.calls[0]?.[0];
      const item = sentCommand?.input.Item as Record<string, unknown>;

      expect(item?.createdAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
      expect(item?.updatedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
      expect((item?.createdAt as string) >= beforeSave).toBe(true);
    });

    it("should handle different expense data", async () => {
      mockDynamoDb.send.mockResolvedValue({});

      await repository.save(expense2, "group-456");

      const sentCommand = mockDynamoDb.send.mock.calls[0]?.[0];
      const item = sentCommand?.input.Item as Record<string, unknown>;

      expect(item?.PK).toBe("GROUP#group-456");
      expect(item?.SK).toBe("EXPENSE#expense-2");
      expect(item?.expenseId).toBe("expense-2");
      expect(item?.name).toBe("Lunch");
      expect(item?.amountInCents).toBe(3000);
      expect(item?.payerId).toBe("member-2");
      expect(item?.participants).toEqual(["member-2", "member-3"]);
    });

    it("should handle expense with zero amount", async () => {
      const freeExpense = new Expense("expense-3", "Free", 0, "member-1", [
        "member-1",
      ]);
      mockDynamoDb.send.mockResolvedValue({});

      await repository.save(freeExpense, groupId);

      const sentCommand = mockDynamoDb.send.mock.calls[0]?.[0];
      const item = sentCommand?.input.Item as Record<string, unknown>;

      expect(item?.amountInCents).toBe(0);
    });

    it("should handle large amount values", async () => {
      const expensiveItem = new Expense(
        "expense-3",
        "Expensive",
        1000000,
        "member-1",
        ["member-1"],
      );
      mockDynamoDb.send.mockResolvedValue({});

      await repository.save(expensiveItem, groupId);

      const sentCommand = mockDynamoDb.send.mock.calls[0]?.[0];
      const item = sentCommand?.input.Item as Record<string, unknown>;

      expect(item?.amountInCents).toBe(1000000);
    });
  });

  describe("delete", () => {
    it("should return true when expense is deleted", async () => {
      mockDynamoDb.send.mockResolvedValue({
        Attributes: {
          PK: "GROUP#group-123",
          SK: "EXPENSE#expense-1",
          expenseId: "expense-1",
          name: "Dinner",
        },
      });

      const result = await repository.delete("expense-1", groupId);

      expect(result).toBe(true);
      expect(mockDynamoDb.send).toHaveBeenCalledTimes(1);
    });

    it("should return false when expense not found", async () => {
      mockDynamoDb.send.mockResolvedValue({});

      const result = await repository.delete("non-existent", groupId);

      expect(result).toBe(false);
    });

    it("should use correct delete parameters", async () => {
      mockDynamoDb.send.mockResolvedValue({ Attributes: {} });

      await repository.delete("expense-1", groupId);

      const sentCommand = mockDynamoDb.send.mock.calls[0]?.[0];

      expect(sentCommand?.input.Key).toEqual({
        PK: "GROUP#group-123",
        SK: "EXPENSE#expense-1",
      });
      expect(sentCommand?.input.ReturnValues).toBe("ALL_OLD");
    });

    it("should handle delete for different group", async () => {
      mockDynamoDb.send.mockResolvedValue({ Attributes: {} });

      await repository.delete("expense-1", "group-999");

      const sentCommand = mockDynamoDb.send.mock.calls[0]?.[0];
      const key = sentCommand?.input.Key as Record<string, unknown>;

      expect(key?.PK).toBe("GROUP#group-999");
      expect(key?.SK).toBe("EXPENSE#expense-1");
    });

    it("should handle delete for different expense IDs", async () => {
      mockDynamoDb.send.mockResolvedValue({ Attributes: {} });

      await repository.delete("expense-123", groupId);

      const sentCommand = mockDynamoDb.send.mock.calls[0]?.[0];
      const key = sentCommand?.input.Key as Record<string, unknown>;

      expect(key?.SK).toBe("EXPENSE#expense-123");
    });
  });

  describe("error handling", () => {
    it("should propagate errors from DynamoDB on findByGroupId", async () => {
      const error = new Error("DynamoDB error");
      mockDynamoDb.send.mockRejectedValue(error);

      await expect(repository.findByGroupId(groupId)).rejects.toThrow(
        "DynamoDB error",
      );
    });

    it("should propagate errors from DynamoDB on save", async () => {
      const error = new Error("DynamoDB error");
      mockDynamoDb.send.mockRejectedValue(error);

      await expect(repository.save(expense1, groupId)).rejects.toThrow(
        "DynamoDB error",
      );
    });

    it("should propagate errors from DynamoDB on delete", async () => {
      const error = new Error("DynamoDB error");
      mockDynamoDb.send.mockRejectedValue(error);

      await expect(repository.delete("expense-1", groupId)).rejects.toThrow(
        "DynamoDB error",
      );
    });

    it("should handle network errors gracefully", async () => {
      const networkError = new Error("Network timeout");
      mockDynamoDb.send.mockRejectedValue(networkError);

      await expect(repository.save(expense1, groupId)).rejects.toThrow(
        "Network timeout",
      );
    });
  });

  describe("edge cases", () => {
    it("should handle expense with empty name", async () => {
      const emptyNameExpense = new Expense("expense-3", "", 1000, "member-1", [
        "member-1",
      ]);
      mockDynamoDb.send.mockResolvedValue({});

      await repository.save(emptyNameExpense, groupId);

      const sentCommand = mockDynamoDb.send.mock.calls[0]?.[0];
      const item = sentCommand?.input.Item as Record<string, unknown>;
      expect(item?.name).toBe("");
    });

    it("should handle expense with special characters in name", async () => {
      const specialExpense = new Expense(
        "expense-3",
        "Café & Restaurant (€50)",
        5000,
        "member-1",
        ["member-1"],
      );
      mockDynamoDb.send.mockResolvedValue({});

      await repository.save(specialExpense, groupId);

      const sentCommand = mockDynamoDb.send.mock.calls[0]?.[0];
      const item = sentCommand?.input.Item as Record<string, unknown>;
      expect(item?.name).toBe("Café & Restaurant (€50)");
    });

    it("should handle expense with very long participant list", async () => {
      const participants = Array.from({ length: 100 }, (_, i) => `member-${i}`);
      const largeExpense = new Expense(
        "expense-3",
        "Large Group",
        100000,
        "member-1",
        participants,
      );
      mockDynamoDb.send.mockResolvedValue({});

      await repository.save(largeExpense, groupId);

      const sentCommand = mockDynamoDb.send.mock.calls[0]?.[0];
      const item = sentCommand?.input.Item as Record<string, unknown>;
      expect(item?.participants).toHaveLength(100);
    });
  });
});
