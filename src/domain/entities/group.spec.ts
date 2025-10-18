import { Group } from "./group";
import { Member } from "./member";
import { Expense } from "./expense";
import { GroupID, MemberID } from "@domain/types/types";
import { MemberAlreadyExistsError } from "@domain/exceptions/MemberAlreadyExistsError";
import { ParticipantNotMemberError } from "@domain/exceptions/ParticipantNotMemberError";
import { PayerNotMemberError } from "@domain/exceptions/PayerNotMemberError";

describe("Group", () => {
  const groupId: GroupID = "group-1";
  const groupName = "Trip to Europe";

  let member1: Member;
  let member2: Member;
  let member3: Member;

  beforeEach(() => {
    member1 = new Member("member-1", "Alice");
    member2 = new Member("member-2", "Bob");
    member3 = new Member("member-3", "Charlie");
  });

  describe("constructor", () => {
    it("should create a group with id and name", () => {
      const group = new Group(groupId, groupName);

      expect(group.id).toBe(groupId);
      expect(group.name).toBe(groupName);
      expect(group.members).toEqual([]);
      expect(group.expenses).toEqual([]);
    });

    it("should create a group with empty members and expenses arrays", () => {
      const group = new Group(groupId, groupName);

      expect(group.members).toHaveLength(0);
      expect(group.expenses).toHaveLength(0);
    });

    it("should create groups with different IDs", () => {
      const group1 = new Group("group-1", "Group 1");
      const group2 = new Group("group-2", "Group 2");

      expect(group1.id).not.toBe(group2.id);
    });
  });

  describe("properties", () => {
    it("should allow name to be modified", () => {
      const group = new Group(groupId, "Original Name");
      const newName = "Updated Name";

      group.name = newName;

      expect(group.name).toBe(newName);
    });

    it("should allow members array to be accessed", () => {
      const group = new Group(groupId, groupName);

      expect(Array.isArray(group.members)).toBe(true);
      expect(group.members).toBeDefined();
    });

    it("should allow expenses array to be accessed", () => {
      const group = new Group(groupId, groupName);

      expect(Array.isArray(group.expenses)).toBe(true);
      expect(group.expenses).toBeDefined();
    });
  });

  describe("addMember", () => {
    it("should add a member to the group", () => {
      const group = new Group(groupId, groupName);

      group.addMember(member1);

      expect(group.members).toHaveLength(1);
      expect(group.members[0]).toBe(member1);
    });

    it("should add multiple members to the group", () => {
      const group = new Group(groupId, groupName);

      group.addMember(member1);
      group.addMember(member2);
      group.addMember(member3);

      expect(group.members).toHaveLength(3);
      expect(group.members).toContain(member1);
      expect(group.members).toContain(member2);
      expect(group.members).toContain(member3);
    });

    it("should throw MemberAlreadyExistsError when adding duplicate member", () => {
      const group = new Group(groupId, groupName);
      group.addMember(member1);

      expect(() => {
        group.addMember(member1);
      }).toThrow(MemberAlreadyExistsError);
    });

    it("should throw MemberAlreadyExistsError with member id in message", () => {
      const group = new Group(groupId, groupName);
      group.addMember(member1);

      expect(() => {
        group.addMember(member1);
      }).toThrow(`Member with ID ${member1.id} already exists in this group.`);
    });

    it("should prevent adding member with same id but different instance", () => {
      const group = new Group(groupId, groupName);
      const duplicateMember = new Member(member1.id, "Different Name");

      group.addMember(member1);

      expect(() => {
        group.addMember(duplicateMember);
      }).toThrow(MemberAlreadyExistsError);
    });

    it("should allow members with same name but different ids", () => {
      const group = new Group(groupId, groupName);
      const member1 = new Member("member-1", "John");
      const member2 = new Member("member-2", "John");

      group.addMember(member1);
      group.addMember(member2);

      expect(group.members).toHaveLength(2);
    });
  });

  describe("addExpense", () => {
    let group: Group;
    let expense: Expense;

    beforeEach(() => {
      group = new Group(groupId, groupName);
      group.addMember(member1);
      group.addMember(member2);
      group.addMember(member3);

      expense = new Expense("expense-1", "Dinner", 9000, member1.id, [
        member1.id,
        member2.id,
        member3.id,
      ]);
    });

    it("should add an expense to the group", () => {
      group.addExpense(expense);

      expect(group.expenses).toHaveLength(1);
      expect(group.expenses[0]).toBe(expense);
    });

    it("should add multiple expenses to the group", () => {
      const expense2 = new Expense("expense-2", "Lunch", 3000, member2.id, [
        member1.id,
        member2.id,
      ]);

      group.addExpense(expense);
      group.addExpense(expense2);

      expect(group.expenses).toHaveLength(2);
      expect(group.expenses).toContain(expense);
      expect(group.expenses).toContain(expense2);
    });

    it("should throw PayerNotMemberError when payer is not in group", () => {
      const nonMember: MemberID = "non-member";
      const invalidExpense = new Expense(
        "expense-2",
        "Invalid",
        1000,
        nonMember,
        [member1.id],
      );

      expect(() => {
        group.addExpense(invalidExpense);
      }).toThrow(PayerNotMemberError);
    });

    it("should throw PayerNotMemberError with payer id in message", () => {
      const nonMember: MemberID = "non-member";
      const invalidExpense = new Expense(
        "expense-2",
        "Invalid",
        1000,
        nonMember,
        [member1.id],
      );

      expect(() => {
        group.addExpense(invalidExpense);
      }).toThrow(`Payer with ID ${nonMember} is not a member of this group.`);
    });

    it("should throw ParticipantNotMemberError when participant is not in group", () => {
      const nonMember: MemberID = "non-member";
      const invalidExpense = new Expense(
        "expense-2",
        "Invalid",
        1000,
        member1.id,
        [member1.id, nonMember],
      );

      expect(() => {
        group.addExpense(invalidExpense);
      }).toThrow(ParticipantNotMemberError);
    });

    it("should throw ParticipantNotMemberError with participant id in message", () => {
      const nonMember: MemberID = "non-member";
      const invalidExpense = new Expense(
        "expense-2",
        "Invalid",
        1000,
        member1.id,
        [member1.id, nonMember],
      );

      expect(() => {
        group.addExpense(invalidExpense);
      }).toThrow(
        `Participant with ID ${nonMember} is not a member of this group.`,
      );
    });

    it("should allow expense where payer is also a participant", () => {
      const validExpense = new Expense("expense-2", "Coffee", 600, member1.id, [
        member1.id,
        member2.id,
      ]);

      expect(() => {
        group.addExpense(validExpense);
      }).not.toThrow();

      expect(group.expenses).toContain(validExpense);
    });

    it("should allow expense with single participant", () => {
      const singleExpense = new Expense(
        "expense-2",
        "Solo Coffee",
        300,
        member1.id,
        [member1.id],
      );

      group.addExpense(singleExpense);

      expect(group.expenses).toContain(singleExpense);
    });

    it("should validate all participants before adding expense", () => {
      const invalidExpense = new Expense(
        "expense-2",
        "Invalid",
        1000,
        member1.id,
        [member1.id, member2.id, "non-member"],
      );

      expect(() => {
        group.addExpense(invalidExpense);
      }).toThrow(ParticipantNotMemberError);

      expect(group.expenses).toHaveLength(0);
    });
  });

  describe("getBalances", () => {
    let group: Group;

    beforeEach(() => {
      group = new Group(groupId, groupName);
      group.addMember(member1);
      group.addMember(member2);
      group.addMember(member3);
    });

    it("should return zero balances for all members when no expenses", () => {
      const balances = group.getBalances();

      expect(balances.size).toBe(3);
      expect(balances.get(member1.id)).toBe(0);
      expect(balances.get(member2.id)).toBe(0);
      expect(balances.get(member3.id)).toBe(0);
    });

    it("should calculate correct balance for single expense with equal split", () => {
      // Alice pays 3000 cents for 3 people (1000 each)
      const expense = new Expense("expense-1", "Lunch", 3000, member1.id, [
        member1.id,
        member2.id,
        member3.id,
      ]);
      group.addExpense(expense);

      const balances = group.getBalances();

      // Alice paid 3000, owes 1000, net = +2000
      expect(balances.get(member1.id)).toBe(2000);
      // Bob owes 1000, net = -1000
      expect(balances.get(member2.id)).toBe(-1000);
      // Charlie owes 1000, net = -1000
      expect(balances.get(member3.id)).toBe(-1000);
    });

    it("should handle expenses that don't divide evenly", () => {
      // 1000 cents divided by 3 = 333 each, with 1 cent remainder
      const expense = new Expense("expense-1", "Coffee", 1000, member1.id, [
        member1.id,
        member2.id,
        member3.id,
      ]);
      group.addExpense(expense);

      const balances = group.getBalances();

      // First participant gets the extra cent
      // Alice: paid 1000, owes 334, net = +666
      expect(balances.get(member1.id)).toBe(666);
      // Bob: owes 333, net = -333
      expect(balances.get(member2.id)).toBe(-333);
      // Charlie: owes 333, net = -333
      expect(balances.get(member3.id)).toBe(-333);
    });

    it("should handle remainder distribution correctly", () => {
      // 100 cents divided by 3 = 33 each, with 1 cent remainder
      const expense = new Expense("expense-1", "Snack", 100, member2.id, [
        member1.id,
        member2.id,
        member3.id,
      ]);
      group.addExpense(expense);

      const balances = group.getBalances();

      // Total should still sum to 0
      const total =
        balances.get(member1.id)! +
        balances.get(member2.id)! +
        balances.get(member3.id)!;
      expect(total).toBe(0);
    });

    it("should calculate balances for multiple expenses", () => {
      // Expense 1: Alice pays 3000 for all 3
      const expense1 = new Expense("expense-1", "Dinner", 3000, member1.id, [
        member1.id,
        member2.id,
        member3.id,
      ]);
      // Expense 2: Bob pays 1200 for Bob and Charlie
      const expense2 = new Expense("expense-2", "Lunch", 1200, member2.id, [
        member2.id,
        member3.id,
      ]);

      group.addExpense(expense1);
      group.addExpense(expense2);

      const balances = group.getBalances();

      // Alice: paid 3000, owes 1000, net = +2000
      expect(balances.get(member1.id)).toBe(2000);
      // Bob: paid 1200, owes 1000 + 600 = 1600, net = -400
      expect(balances.get(member2.id)).toBe(-400);
      // Charlie: owes 1000 + 600 = 1600, net = -1600
      expect(balances.get(member3.id)).toBe(-1600);
    });

    it("should handle expense with only one participant", () => {
      const expense = new Expense("expense-1", "Solo Coffee", 500, member1.id, [
        member1.id,
      ]);
      group.addExpense(expense);

      const balances = group.getBalances();

      // Alice pays and owes for herself, net = 0
      expect(balances.get(member1.id)).toBe(0);
      expect(balances.get(member2.id)).toBe(0);
      expect(balances.get(member3.id)).toBe(0);
    });

    it("should handle expense where payer is not a participant", () => {
      // Alice pays but only Bob and Charlie participate
      const expense = new Expense("expense-1", "Gift", 1000, member1.id, [
        member2.id,
        member3.id,
      ]);
      group.addExpense(expense);

      const balances = group.getBalances();

      // Alice paid 1000, owes 0, net = +1000
      expect(balances.get(member1.id)).toBe(1000);
      // Bob owes 500, net = -500
      expect(balances.get(member2.id)).toBe(-500);
      // Charlie owes 500, net = -500
      expect(balances.get(member3.id)).toBe(-500);
    });

    it("should ensure total balance always sums to zero", () => {
      const expense1 = new Expense("expense-1", "Dinner", 5000, member1.id, [
        member1.id,
        member2.id,
      ]);
      const expense2 = new Expense("expense-2", "Taxi", 1500, member3.id, [
        member1.id,
        member2.id,
        member3.id,
      ]);

      group.addExpense(expense1);
      group.addExpense(expense2);

      const balances = group.getBalances();

      const total =
        balances.get(member1.id)! +
        balances.get(member2.id)! +
        balances.get(member3.id)!;

      expect(total).toBe(0);
    });

    it("should handle zero amount expense", () => {
      const expense = new Expense("expense-1", "Free Item", 0, member1.id, [
        member1.id,
        member2.id,
      ]);
      group.addExpense(expense);

      const balances = group.getBalances();

      expect(balances.get(member1.id)).toBe(0);
      expect(balances.get(member2.id)).toBe(0);
      expect(balances.get(member3.id)).toBe(0);
    });

    it("should handle large amounts correctly", () => {
      const largeAmount = 1000000; // $10,000.00
      const expense = new Expense(
        "expense-1",
        "Expensive Item",
        largeAmount,
        member1.id,
        [member1.id, member2.id],
      );
      group.addExpense(expense);

      const balances = group.getBalances();

      expect(balances.get(member1.id)).toBe(500000);
      expect(balances.get(member2.id)).toBe(-500000);
    });
  });

  describe("complex scenarios", () => {
    it("should handle adding members and expenses in sequence", () => {
      const group = new Group(groupId, groupName);

      group.addMember(member1);
      group.addMember(member2);

      const expense1 = new Expense("expense-1", "Lunch", 2000, member1.id, [
        member1.id,
        member2.id,
      ]);
      group.addExpense(expense1);

      group.addMember(member3);

      const expense2 = new Expense("expense-2", "Dinner", 3000, member2.id, [
        member1.id,
        member2.id,
        member3.id,
      ]);
      group.addExpense(expense2);

      expect(group.members).toHaveLength(3);
      expect(group.expenses).toHaveLength(2);

      const balances = group.getBalances();
      expect(balances.size).toBe(3);
    });

    it("should maintain data integrity across operations", () => {
      const group = new Group(groupId, "Original Name");
      group.addMember(member1);

      const expense = new Expense("expense-1", "Test", 1000, member1.id, [
        member1.id,
      ]);
      group.addExpense(expense);

      group.name = "Updated Name";

      expect(group.name).toBe("Updated Name");
      expect(group.members).toHaveLength(1);
      expect(group.expenses).toHaveLength(1);
    });

    it("should create independent group instances", () => {
      const group1 = new Group("group-1", "Group 1");
      const group2 = new Group("group-2", "Group 2");

      group1.addMember(member1);
      group2.addMember(member2);

      expect(group1.members).toHaveLength(1);
      expect(group2.members).toHaveLength(1);
      expect(group1.members[0]).toBe(member1);
      expect(group2.members[0]).toBe(member2);
    });
  });

  describe("edge cases", () => {
    it("should handle empty group name", () => {
      const group = new Group(groupId, "");

      expect(group.name).toBe("");
    });

    it("should handle group with many members", () => {
      const group = new Group(groupId, groupName);
      const members = Array.from(
        { length: 100 },
        (_, i) => new Member(`member-${i}`, `Member ${i}`),
      );

      members.forEach((m) => group.addMember(m));

      expect(group.members).toHaveLength(100);
    });

    it("should handle group with many expenses", () => {
      const group = new Group(groupId, groupName);
      group.addMember(member1);
      group.addMember(member2);

      for (let i = 0; i < 50; i++) {
        const expense = new Expense(
          `expense-${i}`,
          `Expense ${i}`,
          1000,
          member1.id,
          [member1.id, member2.id],
        );
        group.addExpense(expense);
      }

      expect(group.expenses).toHaveLength(50);

      const balances = group.getBalances();
      expect(balances.get(member1.id)).toBe(25000); // 50 * 500
      expect(balances.get(member2.id)).toBe(-25000);
    });
  });
});
