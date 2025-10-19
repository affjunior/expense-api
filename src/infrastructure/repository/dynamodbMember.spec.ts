/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// @ts-nocheck

import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { Member } from "@domain/entities/member";
import { GroupID, MemberID } from "@domain/types/types";
import { DynamoDBMemberRepository } from "./dynamodbMember";

describe("DynamoDBMemberRepository", () => {
  let repository: DynamoDBMemberRepository;
  let mockDynamoDb: jest.Mocked<DynamoDBDocumentClient>;

  const groupId: GroupID = "group-123";
  const member1 = new Member("member-1", "Alice");
  const member2 = new Member("member-2", "Bob");

  beforeEach(() => {
    mockDynamoDb = {
      send: jest.fn() as any,
    } as unknown as jest.Mocked<DynamoDBDocumentClient>;

    repository = new DynamoDBMemberRepository(mockDynamoDb);
  });

  describe("findByGroupId", () => {
    it("should return empty array when no members found", async () => {
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

    it("should return members when found", async () => {
      mockDynamoDb.send.mockResolvedValue({
        Items: [
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

      const result = await repository.findByGroupId(groupId);

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Member);
      expect(result[0].id).toBe("member-1");
      expect(result[0].name).toBe("Alice");
      expect(result[1].id).toBe("member-2");
      expect(result[1].name).toBe("Bob");
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
        ":sk": "MEMBER#",
      });
    });
  });

  describe("save", () => {
    it("should save a member successfully", async () => {
      mockDynamoDb.send.mockResolvedValue({});

      const result = await repository.save(member1, groupId);

      expect(result).toBe(member1);
      expect(mockDynamoDb.send).toHaveBeenCalledTimes(1);
    });

    it("should include correct item structure", async () => {
      mockDynamoDb.send.mockResolvedValue({});

      await repository.save(member1, groupId);

      const sentCommand = mockDynamoDb.send.mock.calls[0]?.[0];
      const item = sentCommand?.input.Item as Record<string, unknown>;

      expect(item?.PK).toBe("GROUP#group-123");
      expect(item?.SK).toBe("MEMBER#member-1");
      expect(item?.type).toBe("Member");
      expect(item?.memberId).toBe("member-1");
      expect(item?.name).toBe("Alice");
      expect(item?.createdAt).toBeDefined();
      expect(item?.updatedAt).toBeDefined();
    });

    it("should set timestamps", async () => {
      const beforeSave = new Date().toISOString();
      mockDynamoDb.send.mockResolvedValue({});

      await repository.save(member1, groupId);

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

    it("should handle different member data", async () => {
      mockDynamoDb.send.mockResolvedValue({});

      await repository.save(member2, "group-456");

      const sentCommand = mockDynamoDb.send.mock.calls[0]?.[0];
      const item = sentCommand?.input.Item as Record<string, unknown>;

      expect(item?.PK).toBe("GROUP#group-456");
      expect(item?.SK).toBe("MEMBER#member-2");
      expect(item?.memberId).toBe("member-2");
      expect(item?.name).toBe("Bob");
    });
  });

  describe("delete", () => {
    it("should return true when member is deleted", async () => {
      mockDynamoDb.send.mockResolvedValue({
        Attributes: {
          PK: "GROUP#group-123",
          SK: "MEMBER#member-1",
          memberId: "member-1",
          name: "Alice",
        },
      });

      const result = await repository.delete("member-1", groupId);

      expect(result).toBe(true);
      expect(mockDynamoDb.send).toHaveBeenCalledTimes(1);
    });

    it("should return false when member not found", async () => {
      mockDynamoDb.send.mockResolvedValue({});

      const result = await repository.delete("non-existent", groupId);

      expect(result).toBe(false);
    });

    it("should use correct delete parameters", async () => {
      mockDynamoDb.send.mockResolvedValue({ Attributes: {} });

      await repository.delete("member-1", groupId);

      const sentCommand = mockDynamoDb.send.mock.calls[0]?.[0];

      expect(sentCommand?.input.Key).toEqual({
        PK: "GROUP#group-123",
        SK: "MEMBER#member-1",
      });
      expect(sentCommand?.input.ReturnValues).toBe("ALL_OLD");
    });

    it("should handle delete for different group", async () => {
      mockDynamoDb.send.mockResolvedValue({ Attributes: {} });

      await repository.delete("member-1", "group-999");

      const sentCommand = mockDynamoDb.send.mock.calls[0]?.[0];
      const key = sentCommand?.input.Key as Record<string, unknown>;

      expect(key?.PK).toBe("GROUP#group-999");
    });
  });

  describe("exists", () => {
    it("should throw error as it requires groupId context", () => {
      const memberId: MemberID = "member-1";

      expect(() => repository.exists(memberId)).toThrow(
        "exists requires groupId context in single-table design.",
      );
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

      await expect(repository.save(member1, groupId)).rejects.toThrow(
        "DynamoDB error",
      );
    });

    it("should propagate errors from DynamoDB on delete", async () => {
      const error = new Error("DynamoDB error");
      mockDynamoDb.send.mockRejectedValue(error);

      await expect(repository.delete("member-1", groupId)).rejects.toThrow(
        "DynamoDB error",
      );
    });
  });
});
