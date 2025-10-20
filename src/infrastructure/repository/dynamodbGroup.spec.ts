/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// @ts-nocheck

import { DynamoDBGroupRepository } from "./dynamodbGroup";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { Group } from "@domain/entities/group";
import { Member } from "@domain/entities/member";
import { Expense } from "@domain/entities/expense";
import { GroupID } from "@domain/types/types";

describe("DynamoDBGroupRepository", () => {
  let repository: DynamoDBGroupRepository;
  let mockDynamoDb: jest.Mocked<DynamoDBDocumentClient>;

  const groupId: GroupID = "group-123";
  const member1 = new Member("member-1", "Alice");
  const member2 = new Member("member-2", "Bob");
  const expense1 = new Expense("expense-1", "Dinner", 5000, "USD");

  beforeEach(() => {
    mockDynamoDb = {
      send: jest.fn() as any,
    } as unknown as jest.Mocked<DynamoDBDocumentClient>;

    repository = new DynamoDBGroupRepository(mockDynamoDb);
  });

  describe("findById", () => {
    it("should return null when group not found", async () => {
      mockDynamoDb.send.mockResolvedValue({
        Items: [],
      });

      const result = await repository.findById(groupId);

      expect(result).toBeNull();
      expect(mockDynamoDb.send).toHaveBeenCalledTimes(1);
    });

    it("should return null when Items is undefined", async () => {
      mockDynamoDb.send.mockResolvedValue({});

      const result = await repository.findById(groupId);

      expect(result).toBeNull();
    });

    it("should return group with basic data", async () => {
      mockDynamoDb.send.mockResolvedValue({
        Items: [
          {
            PK: "GROUP#group-123",
            SK: "GROUP#",
            type: "Group",
            groupId: "group-123",
            name: "Trip to Europe",
            createdAt: "2024-01-01T00:00:00.000Z",
            updatedAt: "2024-01-01T00:00:00.000Z",
          },
        ],
      });

      const result = await repository.findById(groupId);

      expect(result).toBeInstanceOf(Group);
      expect(result?.id).toBe("group-123");
      expect(result?.name).toBe("Trip to Europe");
      expect(result?.members).toEqual([]);
      expect(result?.expenses).toEqual([]);
    });

    it("should return group with members", async () => {
      mockDynamoDb.send.mockResolvedValue({
        Items: [
          {
            PK: "GROUP#group-123",
            SK: "GROUP#",
            type: "Group",
            groupId: "group-123",
            name: "Trip",
            createdAt: "2024-01-01T00:00:00.000Z",
            updatedAt: "2024-01-01T00:00:00.000Z",
          },
          {
            PK: "GROUP#group-123",
            SK: "MEMBER#member-1",
            type: "Member",
            memberId: "member-1",
            name: "Alice",
            createdAt: "2024-01-01T00:00:00.000Z",
            updatedAt: "2024-01-01T00:00:00.000Z",
          },
          {
            PK: "GROUP#group-123",
            SK: "MEMBER#member-2",
            type: "Member",
            memberId: "member-2",
            name: "Bob",
            createdAt: "2024-01-01T00:00:00.000Z",
            updatedAt: "2024-01-01T00:00:00.000Z",
          },
        ],
      });

      const result = await repository.findById(groupId);

      expect(result?.members).toHaveLength(2);
      expect(result?.members[0]).toBeInstanceOf(Member);
      expect(result?.members[0].id).toBe("member-1");
      expect(result?.members[0].name).toBe("Alice");
      expect(result?.members[1].id).toBe("member-2");
      expect(result?.members[1].name).toBe("Bob");
    });

    it("should return group with expenses", async () => {
      mockDynamoDb.send.mockResolvedValue({
        Items: [
          {
            PK: "GROUP#group-123",
            SK: "GROUP#",
            type: "Group",
            groupId: "group-123",
            name: "Trip",
            createdAt: "2024-01-01T00:00:00.000Z",
            updatedAt: "2024-01-01T00:00:00.000Z",
          },
          {
            PK: "GROUP#group-123",
            SK: "EXPENSE#expense-1",
            type: "Expense",
            expenseId: "expense-1",
            name: "Dinner",
            amountInCents: 5000,
            currencyCode: "USD",
            createdAt: "2024-01-01T00:00:00.000Z",
            updatedAt: "2024-01-01T00:00:00.000Z",
          },
        ],
      });

      const result = await repository.findById(groupId);

      expect(result?.expenses).toHaveLength(1);
      expect(result?.expenses[0]).toBeInstanceOf(Expense);
      expect(result?.expenses[0].id).toBe("expense-1");
      expect(result?.expenses[0].name).toBe("Dinner");
      expect(result?.expenses[0].amountInCents).toBe(5000);
      expect(result?.expenses[0].currencyCode).toBe("USD");
    });

    it("should return complete group with members and expenses", async () => {
      mockDynamoDb.send.mockResolvedValue({
        Items: [
          {
            PK: "GROUP#group-123",
            SK: "GROUP#",
            type: "Group",
            groupId: "group-123",
            name: "Trip",
            createdAt: "2024-01-01T00:00:00.000Z",
            updatedAt: "2024-01-01T00:00:00.000Z",
          },
          {
            PK: "GROUP#group-123",
            SK: "MEMBER#member-1",
            type: "Member",
            memberId: "member-1",
            name: "Alice",
            createdAt: "2024-01-01T00:00:00.000Z",
            updatedAt: "2024-01-01T00:00:00.000Z",
          },
          {
            PK: "GROUP#group-123",
            SK: "EXPENSE#expense-1",
            type: "Expense",
            expenseId: "expense-1",
            name: "Dinner",
            amountInCents: 5000,
            currencyCode: "USD",
            createdAt: "2024-01-01T00:00:00.000Z",
            updatedAt: "2024-01-01T00:00:00.000Z",
          },
        ],
      });

      const result = await repository.findById(groupId);

      expect(result).toBeInstanceOf(Group);
      expect(result?.members).toHaveLength(1);
      expect(result?.expenses).toHaveLength(1);
    });

    it("should use correct query parameters", async () => {
      mockDynamoDb.send.mockResolvedValue({ Items: [] });

      await repository.findById(groupId);

      const sentCommand = mockDynamoDb.send.mock.calls[0]?.[0];
      expect(sentCommand?.input.KeyConditionExpression).toBe("PK = :pk");
      expect(sentCommand?.input.ExpressionAttributeValues).toEqual({
        ":pk": "GROUP#group-123",
      });
    });
  });

  describe("save", () => {
    it("should save group with only group data", async () => {
      const group = new Group(groupId, "Test Group");
      mockDynamoDb.send.mockResolvedValue({});

      const result = await repository.save(group);

      expect(result).toBe(group);
      expect(mockDynamoDb.send).toHaveBeenCalledTimes(1);
    });

    it("should include correct group item structure", async () => {
      const group = new Group(groupId, "Test Group");
      mockDynamoDb.send.mockResolvedValue({});

      await repository.save(group);

      const sentCommand = mockDynamoDb.send.mock.calls[0]?.[0];
      const item = sentCommand?.input.Item as Record<string, unknown>;

      expect(item?.PK).toBe("GROUP#group-123");
      expect(item?.SK).toBe("METADATA");
      expect(item?.type).toBe("Group");
      expect(item?.groupId).toBe("group-123");
      expect(item?.name).toBe("Test Group");
      expect(item?.createdAt).toBeDefined();
      expect(item?.updatedAt).toBeDefined();
    });

    it("should use batch write for group with members", async () => {
      const group = new Group(groupId, "Test Group");
      group.members = [member1, member2];
      mockDynamoDb.send.mockResolvedValue({});

      await repository.save(group);

      expect(mockDynamoDb.send).toHaveBeenCalledTimes(1);
      const sentCommand = mockDynamoDb.send.mock.calls[0]?.[0];
      const requestItems = sentCommand?.input.RequestItems as Record<
        string,
        unknown[]
      >;

      expect(requestItems).toBeDefined();
      const putRequests = Object.values(requestItems ?? {})[0];
      expect(putRequests).toHaveLength(3); // 1 group + 2 members
    });

    it("should save group with members and expenses", async () => {
      const group = new Group(groupId, "Test Group");
      group.members = [member1];
      group.expenses = [expense1];
      mockDynamoDb.send.mockResolvedValue({});

      await repository.save(group);

      const sentCommand = mockDynamoDb.send.mock.calls[0]?.[0];
      const requestItems = sentCommand?.input.RequestItems as Record<
        string,
        unknown[]
      >;
      const putRequests = Object.values(requestItems ?? {})[0];

      expect(putRequests).toHaveLength(3); // 1 group + 1 member + 1 expense
    });

    it("should include member items with correct structure", async () => {
      const group = new Group(groupId, "Test Group");
      group.members = [member1];
      mockDynamoDb.send.mockResolvedValue({});

      await repository.save(group);

      const sentCommand = mockDynamoDb.send.mock.calls[0]?.[0];
      const requestItems = sentCommand?.input.RequestItems as Record<
        string,
        Array<{ PutRequest: { Item: Record<string, unknown> } }>
      >;
      const putRequests = Object.values(requestItems ?? {})[0];
      const memberItem = putRequests?.[1]?.PutRequest?.Item;

      expect(memberItem?.PK).toBe("GROUP#group-123");
      expect(memberItem?.SK).toBe("MEMBER#member-1");
      expect(memberItem?.type).toBe("Member");
      expect(memberItem?.memberId).toBe("member-1");
      expect(memberItem?.name).toBe("Alice");
    });

    it("should include expense items with correct structure", async () => {
      const group = new Group(groupId, "Test Group");
      group.members = [member1];
      group.expenses = [expense1];
      mockDynamoDb.send.mockResolvedValue({});

      await repository.save(group);

      const sentCommand = mockDynamoDb.send.mock.calls[0]?.[0];
      const requestItems = sentCommand?.input.RequestItems as Record<
        string,
        Array<{ PutRequest: { Item: Record<string, unknown> } }>
      >;
      const putRequests = Object.values(requestItems ?? {})[0];
      const expenseItem = putRequests?.[2]?.PutRequest?.Item;

      expect(expenseItem?.PK).toBe("GROUP#group-123");
      expect(expenseItem?.SK).toBe("EXPENSE#expense-1");
      expect(expenseItem?.type).toBe("Expense");
      expect(expenseItem?.expenseId).toBe("expense-1");
      expect(expenseItem?.name).toBe("Dinner");
      expect(expenseItem?.amountInCents).toBe(5000);
      expect(expenseItem?.currencyCode).toBe("USD");
    });

    it("should handle batch writes in chunks of 25", async () => {
      const group = new Group(groupId, "Test Group");
      // Add 30 members to trigger chunking (1 group + 30 members = 31 items)
      for (let i = 0; i < 30; i++) {
        group.members.push(new Member(`member-${i}`, `Member ${i}`));
      }
      mockDynamoDb.send.mockResolvedValue({});

      await repository.save(group);

      // Should be called twice: one for first 25, one for remaining 6
      expect(mockDynamoDb.send).toHaveBeenCalledTimes(2);
    });
  });

  describe("delete", () => {
    it("should return false when group not found", async () => {
      mockDynamoDb.send.mockResolvedValue({ Items: [] });

      const result = await repository.delete(groupId);

      expect(result).toBe(false);
    });

    it("should delete group with only group data", async () => {
      // First call: findById
      mockDynamoDb.send.mockResolvedValueOnce({
        Items: [
          {
            PK: "GROUP#group-123",
            SK: "GROUP#",
            type: "Group",
            groupId: "group-123",
            name: "Test",
            createdAt: "2024-01-01T00:00:00.000Z",
            updatedAt: "2024-01-01T00:00:00.000Z",
          },
        ],
      });
      // Second call: delete
      mockDynamoDb.send.mockResolvedValueOnce({});

      const result = await repository.delete(groupId);

      expect(result).toBe(true);
      expect(mockDynamoDb.send).toHaveBeenCalledTimes(2);
    });

    it("should delete group with members", async () => {
      mockDynamoDb.send.mockResolvedValueOnce({
        Items: [
          {
            PK: "GROUP#group-123",
            SK: "GROUP#",
            type: "Group",
            groupId: "group-123",
            name: "Test",
            createdAt: "2024-01-01T00:00:00.000Z",
            updatedAt: "2024-01-01T00:00:00.000Z",
          },
          {
            PK: "GROUP#group-123",
            SK: "MEMBER#member-1",
            type: "Member",
            memberId: "member-1",
            name: "Alice",
            createdAt: "2024-01-01T00:00:00.000Z",
            updatedAt: "2024-01-01T00:00:00.000Z",
          },
        ],
      });
      mockDynamoDb.send.mockResolvedValueOnce({});

      const result = await repository.delete(groupId);

      expect(result).toBe(true);
      const deleteCommand = mockDynamoDb.send.mock.calls[1]?.[0];
      const requestItems = deleteCommand?.input.RequestItems as Record<
        string,
        unknown[]
      >;
      const deleteRequests = Object.values(requestItems ?? {})[0];
      expect(deleteRequests).toHaveLength(2); // group + 1 member
    });

    it("should delete group with members and expenses", async () => {
      mockDynamoDb.send.mockResolvedValueOnce({
        Items: [
          {
            PK: "GROUP#group-123",
            SK: "GROUP#",
            type: "Group",
            groupId: "group-123",
            name: "Test",
            createdAt: "2024-01-01T00:00:00.000Z",
            updatedAt: "2024-01-01T00:00:00.000Z",
          },
          {
            PK: "GROUP#group-123",
            SK: "MEMBER#member-1",
            type: "Member",
            memberId: "member-1",
            name: "Alice",
            createdAt: "2024-01-01T00:00:00.000Z",
            updatedAt: "2024-01-01T00:00:00.000Z",
          },
          {
            PK: "GROUP#group-123",
            SK: "EXPENSE#expense-1",
            type: "Expense",
            expenseId: "expense-1",
            name: "Dinner",
            amountInCents: 5000,
            currencyCode: "USD",
            createdAt: "2024-01-01T00:00:00.000Z",
            updatedAt: "2024-01-01T00:00:00.000Z",
          },
        ],
      });
      mockDynamoDb.send.mockResolvedValueOnce({});

      const result = await repository.delete(groupId);

      expect(result).toBe(true);
      const deleteCommand = mockDynamoDb.send.mock.calls[1]?.[0];
      const requestItems = deleteCommand?.input.RequestItems as Record<
        string,
        unknown[]
      >;
      const deleteRequests = Object.values(requestItems ?? {})[0];
      expect(deleteRequests).toHaveLength(3); // group + 1 member + 1 expense
    });

    it("should handle batch deletes in chunks of 25", async () => {
      const items: any[] = [
        {
          PK: "GROUP#group-123",
          SK: "GROUP#",
          type: "Group",
          groupId: "group-123",
          name: "Test",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
      ];

      // Add 30 members (total 31 items)
      for (let i = 0; i < 30; i++) {
        items.push({
          PK: "GROUP#group-123",
          SK: `MEMBER#member-${i}`,
          type: "Member",
          memberId: `member-${i}`,
          name: `Member ${i}`,
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        });
      }

      mockDynamoDb.send.mockResolvedValueOnce({ Items: items });
      mockDynamoDb.send.mockResolvedValue({});

      await repository.delete(groupId);

      // 1 for findById + 2 for batch deletes (25 + 6)
      expect(mockDynamoDb.send).toHaveBeenCalledTimes(3);
    });
  });

  describe("exists", () => {
    it("should return true when group exists", async () => {
      mockDynamoDb.send.mockResolvedValue({
        Items: [{ PK: "GROUP#group-123" }],
      });

      const result = await repository.exists(groupId);

      expect(result).toBe(true);
    });

    it("should return false when group does not exist", async () => {
      mockDynamoDb.send.mockResolvedValue({
        Items: [],
      });

      const result = await repository.exists(groupId);

      expect(result).toBe(false);
    });

    it("should return false when Items is undefined", async () => {
      mockDynamoDb.send.mockResolvedValue({});

      const result = await repository.exists(groupId);

      expect(result).toBe(false);
    });

    it("should use correct query parameters", async () => {
      mockDynamoDb.send.mockResolvedValue({ Items: [] });

      await repository.exists(groupId);

      const sentCommand = mockDynamoDb.send.mock.calls[0]?.[0];
      expect(sentCommand?.input.KeyConditionExpression).toBe(
        "PK = :pk AND SK = :sk",
      );
      expect(sentCommand?.input.ExpressionAttributeValues).toEqual({
        ":pk": "GROUP#group-123",
        ":sk": "METADATA",
      });
      expect(sentCommand?.input.ProjectionExpression).toBe("PK");
      expect(sentCommand?.input.Limit).toBe(1);
    });
  });

  describe("error handling", () => {
    it("should propagate errors from DynamoDB on findById", async () => {
      const error = new Error("DynamoDB error");
      mockDynamoDb.send.mockRejectedValue(error);

      await expect(repository.findById(groupId)).rejects.toThrow(
        "DynamoDB error",
      );
    });

    it("should propagate errors from DynamoDB on save", async () => {
      const group = new Group(groupId, "Test");
      const error = new Error("DynamoDB error");
      mockDynamoDb.send.mockRejectedValue(error);

      await expect(repository.save(group)).rejects.toThrow("DynamoDB error");
    });

    it("should propagate errors from DynamoDB on delete", async () => {
      const error = new Error("DynamoDB error");
      mockDynamoDb.send.mockRejectedValue(error);

      await expect(repository.delete(groupId)).rejects.toThrow(
        "DynamoDB error",
      );
    });

    it("should propagate errors from DynamoDB on exists", async () => {
      const error = new Error("DynamoDB error");
      mockDynamoDb.send.mockRejectedValue(error);

      await expect(repository.exists(groupId)).rejects.toThrow(
        "DynamoDB error",
      );
    });
  });
});
