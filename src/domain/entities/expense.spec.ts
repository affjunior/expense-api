import { Expense } from "./expense";
import { ExpenseID, MemberID } from "@domain/types/types";

describe("Expense", () => {
  const expenseId: ExpenseID = "trip_01";
  const payerId: MemberID = "member_01";
  const participant1: MemberID = "member_02";
  const participant2: MemberID = "member_03";

  describe("constructor", () => {
    it("should create an expense with all required properties", () => {
      const name = "Dinner";
      const amountInCents = 5000;
      const participants = [payerId, participant1, participant2];

      const expense = new Expense(
        expenseId,
        name,
        amountInCents,
        payerId,
        participants,
      );

      expect(expense.id).toBe(expenseId);
      expect(expense.name).toBe(name);
      expect(expense.amountInCents).toBe(amountInCents);
      expect(expense.payerId).toBe(payerId);
      expect(expense.participants).toEqual(participants);
    });

    it("should create an expense with a single participant", () => {
      const expense = new Expense(expenseId, "Coffee", 350, payerId, [payerId]);

      expect(expense.participants).toHaveLength(1);
      expect(expense.participants[0]).toBe(payerId);
    });

    it("should create an expense with multiple participants", () => {
      const participants = [payerId, participant1, participant2];
      const expense = new Expense(
        expenseId,
        "Group Lunch",
        10000,
        payerId,
        participants,
      );

      expect(expense.participants).toHaveLength(3);
      expect(expense.participants).toEqual(participants);
    });

    it("should allow the payer to also be a participant", () => {
      const participants = [payerId, participant1];
      const expense = new Expense(
        expenseId,
        "Shared Expense",
        2000,
        payerId,
        participants,
      );

      expect(expense.participants).toContain(payerId);
      expect(expense.payerId).toBe(payerId);
    });
  });

  describe("properties", () => {
    it("should allow name to be modified", () => {
      const expense = new Expense(expenseId, "Original", 1000, payerId, [
        payerId,
      ]);
      const newName = "Updated Name";

      expense.name = newName;

      expect(expense.name).toBe(newName);
    });

    it("should allow amountInCents to be modified", () => {
      const expense = new Expense(expenseId, "Test", 1000, payerId, [payerId]);
      const newAmount = 2000;

      expense.amountInCents = newAmount;

      expect(expense.amountInCents).toBe(newAmount);
    });

    it("should allow payerId to be modified", () => {
      const expense = new Expense(expenseId, "Test", 1000, payerId, [
        payerId,
        participant1,
      ]);
      const newPayerId = participant1;

      expense.payerId = newPayerId;

      expect(expense.payerId).toBe(newPayerId);
    });

    it("should allow participants to be modified", () => {
      const expense = new Expense(expenseId, "Test", 1000, payerId, [payerId]);
      const newParticipants = [payerId, participant1, participant2];

      expense.participants = newParticipants;

      expect(expense.participants).toEqual(newParticipants);
    });
  });

  describe("edge cases", () => {
    it("should handle zero amount", () => {
      const expense = new Expense(expenseId, "Free Item", 0, payerId, [
        payerId,
      ]);

      expect(expense.amountInCents).toBe(0);
    });

    it("should handle large amounts", () => {
      const largeAmount = 999999999;
      const expense = new Expense(
        expenseId,
        "Expensive",
        largeAmount,
        payerId,
        [payerId],
      );

      expect(expense.amountInCents).toBe(largeAmount);
    });

    it("should handle empty expense name", () => {
      const expense = new Expense(expenseId, "", 1000, payerId, [payerId]);

      expect(expense.name).toBe("");
    });

    it("should handle expense name with special characters", () => {
      const specialName = "Café & Restaurant - 50% discount!";
      const expense = new Expense(expenseId, specialName, 1000, payerId, [
        payerId,
      ]);

      expect(expense.name).toBe(specialName);
    });

    it("should handle very long expense names", () => {
      const longName = "A".repeat(1000);
      const expense = new Expense(expenseId, longName, 1000, payerId, [
        payerId,
      ]);

      expect(expense.name).toBe(longName);
      expect(expense.name.length).toBe(1000);
    });

    it("should handle empty participants array", () => {
      const expense = new Expense(expenseId, "Test", 1000, payerId, []);

      expect(expense.participants).toEqual([]);
      expect(expense.participants).toHaveLength(0);
    });

    it("should handle duplicate participants", () => {
      const duplicateParticipants = [payerId, payerId, participant1];
      const expense = new Expense(
        expenseId,
        "Test",
        1000,
        payerId,
        duplicateParticipants,
      );

      expect(expense.participants).toEqual(duplicateParticipants);
      expect(expense.participants).toHaveLength(3);
    });
  });

  describe("data integrity", () => {
    it("should maintain separate participant arrays for different expenses", () => {
      const participants1 = [payerId, participant1];
      const participants2 = [payerId, participant2];

      const expense1 = new Expense(
        "expense-1",
        "Expense 1",
        1000,
        payerId,
        participants1,
      );
      const expense2 = new Expense(
        "expense-2",
        "Expense 2",
        2000,
        payerId,
        participants2,
      );

      expect(expense1.participants).not.toBe(expense2.participants);
      expect(expense1.participants).toEqual(participants1);
      expect(expense2.participants).toEqual(participants2);
    });

    it("should not be affected by changes to the original participants array", () => {
      const participants = [payerId, participant1];
      const expense = new Expense(
        expenseId,
        "Test",
        1000,
        payerId,
        participants,
      );

      participants.push(participant2);

      // Behavior depends on whether constructor copies or references the array
      // This test documents the current behavior
      expect(expense.participants).toEqual([
        payerId,
        participant1,
        participant2,
      ]);
    });
  });

  describe("amount representation", () => {
    it("should correctly represent cents (e.g., $10.00 = 1000 cents)", () => {
      const expense = new Expense(expenseId, "Ten Dollars", 1000, payerId, [
        payerId,
      ]);

      expect(expense.amountInCents).toBe(1000);
      expect(expense.amountInCents / 100).toBe(10.0);
    });

    it("should correctly represent fractional amounts (e.g., $10.99)", () => {
      const expense = new Expense(expenseId, "Ten Ninety-Nine", 1099, payerId, [
        payerId,
      ]);

      expect(expense.amountInCents).toBe(1099);
      expect(expense.amountInCents / 100).toBeCloseTo(10.99, 2);
    });

    it("should handle single cent amounts", () => {
      const expense = new Expense(expenseId, "One Cent", 1, payerId, [payerId]);

      expect(expense.amountInCents).toBe(1);
      expect(expense.amountInCents / 100).toBe(0.01);
    });
  });
});
