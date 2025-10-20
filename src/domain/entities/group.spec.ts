import { Group } from "./group";
import { Member } from "./member";
import { Expense } from "./expense";
import { GroupID } from "@domain/types/types";
import { MemberAlreadyExistsError } from "@domain/exceptions/MemberAlreadyExistsError";

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
      }).toThrow(`Member ${member1.id} already exists`);
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

      expense = new Expense("expense-1", "Dinner", 9000, "USD");
    });

    it("should add an expense to the group", () => {
      group.addExpense(expense);

      expect(group.expenses).toHaveLength(1);
      expect(group.expenses[0]).toBe(expense);
    });

    it("should add multiple expenses to the group", () => {
      const expense2 = new Expense("expense-2", "Lunch", 3000, "USD");

      group.addExpense(expense);
      group.addExpense(expense2);

      expect(group.expenses).toHaveLength(2);
      expect(group.expenses).toContain(expense);
      expect(group.expenses).toContain(expense2);
    });

    it("should allow expense with different currencies", () => {
      const brlExpense = new Expense("expense-2", "BRL Expense", 600, "BRL");

      expect(() => {
        group.addExpense(brlExpense);
      }).not.toThrow();

      expect(group.expenses).toContain(brlExpense);
    });

    it("should allow expense with zero amount", () => {
      const freeExpense = new Expense("expense-2", "Free Item", 0, "USD");

      group.addExpense(freeExpense);

      expect(group.expenses).toContain(freeExpense);
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

    it("should calculate equal balance for single expense", () => {
      // Simple implementation: divides total expense equally among all members
      const expense = new Expense("expense-1", "Lunch", 3000, "USD");
      group.addExpense(expense);

      const balances = group.getBalances();

      // 3000 / 3 members = 1000 each
      expect(balances.get(member1.id)).toBe(1000);
      expect(balances.get(member2.id)).toBe(1000);
      expect(balances.get(member3.id)).toBe(1000);
    });

    it("should handle expenses that don't divide evenly", () => {
      // 1000 cents divided by 3 = 333 each (floor division)
      const expense = new Expense("expense-1", "Coffee", 1000, "USD");
      group.addExpense(expense);

      const balances = group.getBalances();

      // Floor division: 1000 / 3 = 333
      expect(balances.get(member1.id)).toBe(333);
      expect(balances.get(member2.id)).toBe(333);
      expect(balances.get(member3.id)).toBe(333);
    });

    it("should handle remainder distribution correctly", () => {
      // 100 cents divided by 3 = 33 each (floor division)
      const expense = new Expense("expense-1", "Snack", 100, "USD");
      group.addExpense(expense);

      const balances = group.getBalances();

      // Floor division: 100 / 3 = 33
      expect(balances.get(member1.id)).toBe(33);
      expect(balances.get(member2.id)).toBe(33);
      expect(balances.get(member3.id)).toBe(33);
    });

    it("should calculate balances for multiple expenses", () => {
      // Simple implementation: sums all expenses then divides by members
      const expense1 = new Expense("expense-1", "Dinner", 3000, "USD");
      const expense2 = new Expense("expense-2", "Lunch", 1200, "USD");

      group.addExpense(expense1);
      group.addExpense(expense2);

      const balances = group.getBalances();

      // Total: 4200 / 3 = 1400 each
      expect(balances.get(member1.id)).toBe(1400);
      expect(balances.get(member2.id)).toBe(1400);
      expect(balances.get(member3.id)).toBe(1400);
    });

    it("should handle expense with equal split among members", () => {
      const expense = new Expense("expense-1", "Solo Coffee", 500, "USD");
      group.addExpense(expense);

      const balances = group.getBalances();

      // 500 / 3 = 166
      expect(balances.get(member1.id)).toBe(166);
      expect(balances.get(member2.id)).toBe(166);
      expect(balances.get(member3.id)).toBe(166);
    });

    it("should handle expense split equally", () => {
      const expense = new Expense("expense-1", "Gift", 1000, "USD");
      group.addExpense(expense);

      const balances = group.getBalances();

      // 1000 / 3 = 333
      expect(balances.get(member1.id)).toBe(333);
      expect(balances.get(member2.id)).toBe(333);
      expect(balances.get(member3.id)).toBe(333);
    });

    it("should sum all expenses before dividing", () => {
      const expense1 = new Expense("expense-1", "Dinner", 5000, "USD");
      const expense2 = new Expense("expense-2", "Taxi", 1500, "USD");

      group.addExpense(expense1);
      group.addExpense(expense2);

      const balances = group.getBalances();

      // Total: 6500 / 3 = 2166
      expect(balances.get(member1.id)).toBe(2166);
      expect(balances.get(member2.id)).toBe(2166);
      expect(balances.get(member3.id)).toBe(2166);
    });

    it("should handle zero amount expense", () => {
      const expense = new Expense("expense-1", "Free Item", 0, "USD");
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
        "USD",
      );
      group.addExpense(expense);

      const balances = group.getBalances();

      // 1000000 / 3 = 333333
      expect(balances.get(member1.id)).toBe(333333);
      expect(balances.get(member2.id)).toBe(333333);
      expect(balances.get(member3.id)).toBe(333333);
    });
  });

  describe("complex scenarios", () => {
    it("should handle adding members and expenses in sequence", () => {
      const group = new Group(groupId, groupName);

      group.addMember(member1);
      group.addMember(member2);

      const expense1 = new Expense("expense-1", "Lunch", 2000, "USD");
      group.addExpense(expense1);

      group.addMember(member3);

      const expense2 = new Expense("expense-2", "Dinner", 3000, "USD");
      group.addExpense(expense2);

      expect(group.members).toHaveLength(3);
      expect(group.expenses).toHaveLength(2);

      const balances = group.getBalances();
      expect(balances.size).toBe(3);
    });

    it("should maintain data integrity across operations", () => {
      const group = new Group(groupId, "Original Name");
      group.addMember(member1);

      const expense = new Expense("expense-1", "Test", 1000, "USD");
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
          "USD",
        );
        group.addExpense(expense);
      }

      expect(group.expenses).toHaveLength(50);

      const balances = group.getBalances();
      // 50 * 1000 = 50000 / 2 members = 25000 each
      expect(balances.get(member1.id)).toBe(25000);
      expect(balances.get(member2.id)).toBe(25000);
    });
  });
});
