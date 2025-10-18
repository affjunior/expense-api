import { Member } from "./member";
import { MemberID } from "@domain/types/types";

describe("Member", () => {
  const memberId: MemberID = "member-1";
  const memberName = "John Doe";

  describe("constructor", () => {
    it("should create a member with id and name", () => {
      const member = new Member(memberId, memberName);

      expect(member.id).toBe(memberId);
      expect(member.name).toBe(memberName);
    });

    it("should create a member with a single character name", () => {
      const member = new Member(memberId, "J");

      expect(member.id).toBe(memberId);
      expect(member.name).toBe("J");
    });

    it("should create a member with a long name", () => {
      const longName = "John Michael Christopher Alexander Smith-Johnson III";
      const member = new Member(memberId, longName);

      expect(member.name).toBe(longName);
    });

    it("should create members with different IDs", () => {
      const member1 = new Member("member-1", "Alice");
      const member2 = new Member("member-2", "Bob");

      expect(member1.id).not.toBe(member2.id);
      expect(member1.id).toBe("member-1");
      expect(member2.id).toBe("member-2");
    });
  });

  describe("properties", () => {
    it("should allow name to be modified", () => {
      const member = new Member(memberId, "Original Name");
      const newName = "Updated Name";

      member.name = newName;

      expect(member.name).toBe(newName);
    });

    it("should maintain id after name modification", () => {
      const member = new Member(memberId, memberName);
      const originalId = member.id;

      member.name = "New Name";

      expect(member.id).toBe(originalId);
    });
  });

  describe("edge cases", () => {
    it("should handle empty name", () => {
      const member = new Member(memberId, "");

      expect(member.id).toBe(memberId);
      expect(member.name).toBe("");
    });

    it("should handle name with special characters", () => {
      const specialName = "José María O'Brien-García";
      const member = new Member(memberId, specialName);

      expect(member.name).toBe(specialName);
    });

    it("should handle name with numbers", () => {
      const nameWithNumbers = "John Doe 123";
      const member = new Member(memberId, nameWithNumbers);

      expect(member.name).toBe(nameWithNumbers);
    });

    it("should handle name with emojis", () => {
      const nameWithEmoji = "John 🎉 Doe";
      const member = new Member(memberId, nameWithEmoji);

      expect(member.name).toBe(nameWithEmoji);
    });

    it("should handle name with leading/trailing spaces", () => {
      const nameWithSpaces = "  John Doe  ";
      const member = new Member(memberId, nameWithSpaces);

      expect(member.name).toBe(nameWithSpaces);
    });

    it("should handle name with multiple spaces", () => {
      const nameWithMultipleSpaces = "John    Doe";
      const member = new Member(memberId, nameWithMultipleSpaces);

      expect(member.name).toBe(nameWithMultipleSpaces);
    });

    it("should handle very long names", () => {
      const veryLongName = "A".repeat(1000);
      const member = new Member(memberId, veryLongName);

      expect(member.name).toBe(veryLongName);
      expect(member.name.length).toBe(1000);
    });

    it("should handle names with newlines", () => {
      const nameWithNewline = "John\nDoe";
      const member = new Member(memberId, nameWithNewline);

      expect(member.name).toBe(nameWithNewline);
    });

    it("should handle names with tabs", () => {
      const nameWithTab = "John\tDoe";
      const member = new Member(memberId, nameWithTab);

      expect(member.name).toBe(nameWithTab);
    });
  });

  describe("identity", () => {
    it("should distinguish between members with different IDs", () => {
      const member1 = new Member("member-1", "John Doe");
      const member2 = new Member("member-2", "John Doe");

      expect(member1.id).not.toBe(member2.id);
      expect(member1.name).toBe(member2.name);
    });

    it("should allow same name for different members", () => {
      const member1 = new Member("member-1", "John Doe");
      const member2 = new Member("member-2", "John Doe");
      const member3 = new Member("member-3", "John Doe");

      expect(member1.name).toBe(member2.name);
      expect(member2.name).toBe(member3.name);
      expect(member1.id).not.toBe(member2.id);
      expect(member2.id).not.toBe(member3.id);
    });

    it("should create independent instances", () => {
      const member1 = new Member("member-1", "Alice");
      const member2 = new Member("member-2", "Bob");

      member1.name = "Alice Updated";

      expect(member1.name).toBe("Alice Updated");
      expect(member2.name).toBe("Bob");
    });
  });

  describe("data integrity", () => {
    it("should maintain member data across multiple operations", () => {
      const member = new Member(memberId, "Original Name");
      const originalId = member.id;

      member.name = "First Update";
      member.name = "Second Update";
      member.name = "Final Name";

      expect(member.id).toBe(originalId);
      expect(member.name).toBe("Final Name");
    });

    it("should handle repeated name changes", () => {
      const member = new Member(memberId, "Alice");

      member.name = "Bob";
      expect(member.name).toBe("Bob");

      member.name = "Charlie";
      expect(member.name).toBe("Charlie");

      member.name = "Alice";
      expect(member.name).toBe("Alice");
    });
  });

  describe("type compatibility", () => {
    it("should accept string as MemberID", () => {
      const stringId = "member-123";
      const member = new Member(stringId, memberName);

      expect(member.id).toBe(stringId);
    });

    it("should handle UUID-like IDs", () => {
      const uuidId = "550e8400-e29b-41d4-a716-446655440000";
      const member = new Member(uuidId, memberName);

      expect(member.id).toBe(uuidId);
    });

    it("should handle numeric string IDs", () => {
      const numericId = "12345";
      const member = new Member(numericId, memberName);

      expect(member.id).toBe(numericId);
    });
  });

  describe("comparison and equality", () => {
    it("should create distinct objects even with same data", () => {
      const member1 = new Member(memberId, memberName);
      const member2 = new Member(memberId, memberName);

      expect(member1).not.toBe(member2);
      expect(member1.id).toBe(member2.id);
      expect(member1.name).toBe(member2.name);
    });

    it("should allow comparison by id", () => {
      const member1 = new Member("member-1", "Alice");
      const member2 = new Member("member-2", "Bob");
      const member3 = new Member("member-1", "Charlie");

      expect(member1.id === member3.id).toBe(true);
      expect(member1.id === member2.id).toBe(false);
    });
  });
});
