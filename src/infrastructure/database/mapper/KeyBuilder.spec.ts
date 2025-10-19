/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

import { KeyBuilder } from "./KeyBuilder";

describe("KeyBuilder", () => {
  describe("groupPK", () => {
    it("should generate correct partition key for group", () => {
      const groupId = "group-123";
      const pk = KeyBuilder.groupPK(groupId);

      expect(pk).toBe("GROUP#group-123");
    });

    it("should handle different group IDs", () => {
      const groupId = "different-id-456";
      const pk = KeyBuilder.groupPK(groupId);

      expect(pk).toBe("GROUP#different-id-456");
    });

    it("should handle UUID format group IDs", () => {
      const groupId = "550e8400-e29b-41d4-a716-446655440000";
      const pk = KeyBuilder.groupPK(groupId);

      expect(pk).toBe("GROUP#550e8400-e29b-41d4-a716-446655440000");
    });

    it("should handle empty string", () => {
      const groupId = "";
      const pk = KeyBuilder.groupPK(groupId);

      expect(pk).toBe("GROUP#");
    });

    it("should handle special characters in group ID", () => {
      const groupId = "group-with-special_chars";
      const pk = KeyBuilder.groupPK(groupId);

      expect(pk).toBe("GROUP#group-with-special_chars");
    });
  });

  describe("groupSK", () => {
    it("should return METADATA as sort key", () => {
      const sk = KeyBuilder.groupSK();

      expect(sk).toBe("METADATA");
    });

    it("should always return the same value", () => {
      const sk1 = KeyBuilder.groupSK();
      const sk2 = KeyBuilder.groupSK();

      expect(sk1).toBe(sk2);
      expect(sk1).toBe("METADATA");
    });
  });

  describe("memberSK", () => {
    it("should generate correct sort key for member", () => {
      const memberId = "member-123";
      const sk = KeyBuilder.memberSK(memberId);

      expect(sk).toBe("MEMBER#member-123");
    });

    it("should handle different member IDs", () => {
      const memberId = "m-456";
      const sk = KeyBuilder.memberSK(memberId);

      expect(sk).toBe("MEMBER#m-456");
    });

    it("should handle UUID format member IDs", () => {
      const memberId = "550e8400-e29b-41d4-a716-446655440000";
      const sk = KeyBuilder.memberSK(memberId);

      expect(sk).toBe("MEMBER#550e8400-e29b-41d4-a716-446655440000");
    });

    it("should handle empty string", () => {
      const memberId = "";
      const sk = KeyBuilder.memberSK(memberId);

      expect(sk).toBe("MEMBER#");
    });

    it("should handle special characters in member ID", () => {
      const memberId = "member_with-special.chars";
      const sk = KeyBuilder.memberSK(memberId);

      expect(sk).toBe("MEMBER#member_with-special.chars");
    });
  });

  describe("expenseSK", () => {
    it("should generate correct sort key for expense", () => {
      const expenseId = "expense-123";
      const sk = KeyBuilder.expenseSK(expenseId);

      expect(sk).toBe("EXPENSE#expense-123");
    });

    it("should handle different expense IDs", () => {
      const expenseId = "e-789";
      const sk = KeyBuilder.expenseSK(expenseId);

      expect(sk).toBe("EXPENSE#e-789");
    });

    it("should handle UUID format expense IDs", () => {
      const expenseId = "550e8400-e29b-41d4-a716-446655440000";
      const sk = KeyBuilder.expenseSK(expenseId);

      expect(sk).toBe("EXPENSE#550e8400-e29b-41d4-a716-446655440000");
    });

    it("should handle empty string", () => {
      const expenseId = "";
      const sk = KeyBuilder.expenseSK(expenseId);

      expect(sk).toBe("EXPENSE#");
    });

    it("should handle special characters in expense ID", () => {
      const expenseId = "expense_with-special.chars";
      const sk = KeyBuilder.expenseSK(expenseId);

      expect(sk).toBe("EXPENSE#expense_with-special.chars");
    });
  });

  describe("extractGroupId", () => {
    it("should extract group ID from partition key", () => {
      const pk = "GROUP#group-123";
      const groupId = KeyBuilder.extractGroupId(pk);

      expect(groupId).toBe("group-123");
    });

    it("should handle different group IDs", () => {
      const pk = "GROUP#different-id-456";
      const groupId = KeyBuilder.extractGroupId(pk);

      expect(groupId).toBe("different-id-456");
    });

    it("should handle UUID format", () => {
      const pk = "GROUP#550e8400-e29b-41d4-a716-446655440000";
      const groupId = KeyBuilder.extractGroupId(pk);

      expect(groupId).toBe("550e8400-e29b-41d4-a716-446655440000");
    });

    it("should handle partition key with only prefix", () => {
      const pk = "GROUP#";
      const groupId = KeyBuilder.extractGroupId(pk);

      expect(groupId).toBe("");
    });

    it("should handle string without GROUP# prefix", () => {
      const pk = "some-random-string";
      const groupId = KeyBuilder.extractGroupId(pk);

      expect(groupId).toBe("some-random-string");
    });

    it("should handle multiple occurrences of GROUP#", () => {
      const pk = "GROUP#GROUP#nested";
      const groupId = KeyBuilder.extractGroupId(pk);

      expect(groupId).toBe("GROUP#nested");
    });
  });

  describe("extractMemberId", () => {
    it("should extract member ID from sort key", () => {
      const sk = "MEMBER#member-123";
      const memberId = KeyBuilder.extractMemberId(sk);

      expect(memberId).toBe("member-123");
    });

    it("should handle different member IDs", () => {
      const sk = "MEMBER#m-456";
      const memberId = KeyBuilder.extractMemberId(sk);

      expect(memberId).toBe("m-456");
    });

    it("should handle UUID format", () => {
      const sk = "MEMBER#550e8400-e29b-41d4-a716-446655440000";
      const memberId = KeyBuilder.extractMemberId(sk);

      expect(memberId).toBe("550e8400-e29b-41d4-a716-446655440000");
    });

    it("should handle sort key with only prefix", () => {
      const sk = "MEMBER#";
      const memberId = KeyBuilder.extractMemberId(sk);

      expect(memberId).toBe("");
    });

    it("should handle string without MEMBER# prefix", () => {
      const sk = "some-random-string";
      const memberId = KeyBuilder.extractMemberId(sk);

      expect(memberId).toBe("some-random-string");
    });

    it("should handle multiple occurrences of MEMBER#", () => {
      const sk = "MEMBER#MEMBER#nested";
      const memberId = KeyBuilder.extractMemberId(sk);

      expect(memberId).toBe("MEMBER#nested");
    });
  });

  describe("extractExpenseId", () => {
    it("should extract expense ID from sort key", () => {
      const sk = "EXPENSE#expense-123";
      const expenseId = KeyBuilder.extractExpenseId(sk);

      expect(expenseId).toBe("expense-123");
    });

    it("should handle different expense IDs", () => {
      const sk = "EXPENSE#e-789";
      const expenseId = KeyBuilder.extractExpenseId(sk);

      expect(expenseId).toBe("e-789");
    });

    it("should handle UUID format", () => {
      const sk = "EXPENSE#550e8400-e29b-41d4-a716-446655440000";
      const expenseId = KeyBuilder.extractExpenseId(sk);

      expect(expenseId).toBe("550e8400-e29b-41d4-a716-446655440000");
    });

    it("should handle sort key with only prefix", () => {
      const sk = "EXPENSE#";
      const expenseId = KeyBuilder.extractExpenseId(sk);

      expect(expenseId).toBe("");
    });

    it("should handle string without EXPENSE# prefix", () => {
      const sk = "some-random-string";
      const expenseId = KeyBuilder.extractExpenseId(sk);

      expect(expenseId).toBe("some-random-string");
    });

    it("should handle multiple occurrences of EXPENSE#", () => {
      const sk = "EXPENSE#EXPENSE#nested";
      const expenseId = KeyBuilder.extractExpenseId(sk);

      expect(expenseId).toBe("EXPENSE#nested");
    });
  });

  describe("round-trip conversions", () => {
    it("should correctly round-trip group ID", () => {
      const originalGroupId = "group-123";
      const pk = KeyBuilder.groupPK(originalGroupId);
      const extractedGroupId = KeyBuilder.extractGroupId(pk);

      expect(extractedGroupId).toBe(originalGroupId);
    });

    it("should correctly round-trip member ID", () => {
      const originalMemberId = "member-456";
      const sk = KeyBuilder.memberSK(originalMemberId);
      const extractedMemberId = KeyBuilder.extractMemberId(sk);

      expect(extractedMemberId).toBe(originalMemberId);
    });

    it("should correctly round-trip expense ID", () => {
      const originalExpenseId = "expense-789";
      const sk = KeyBuilder.expenseSK(originalExpenseId);
      const extractedExpenseId = KeyBuilder.extractExpenseId(sk);

      expect(extractedExpenseId).toBe(originalExpenseId);
    });

    it("should handle complex IDs with special characters", () => {
      const complexId = "test-123_abc.xyz";
      const pk = KeyBuilder.groupPK(complexId);
      const extracted = KeyBuilder.extractGroupId(pk);

      expect(extracted).toBe(complexId);
    });
  });

  describe("type safety", () => {
    it("should return correct type for groupPK", () => {
      const pk = KeyBuilder.groupPK("test");
      expect(pk.startsWith("GROUP#")).toBe(true);
    });

    it("should return correct type for groupSK", () => {
      const sk = KeyBuilder.groupSK();
      expect(sk).toBe("METADATA");
    });

    it("should return correct type for memberSK", () => {
      const sk = KeyBuilder.memberSK("test");
      expect(sk.startsWith("MEMBER#")).toBe(true);
    });

    it("should return correct type for expenseSK", () => {
      const sk = KeyBuilder.expenseSK("test");
      expect(sk.startsWith("EXPENSE#")).toBe(true);
    });
  });
});
