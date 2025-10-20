import { Expense } from "./expense";
import { ExpenseID } from "@domain/types/types";
import type { CurrencyCode } from "@domain/utils/currency.util";

describe("Expense", () => {
  const expenseId: ExpenseID = "trip_01";
  const currencyCode: CurrencyCode = "USD";

  describe("constructor", () => {
    it("should create an expense with all required properties", () => {
      const name = "Dinner";
      const amountInCents = 5000;

      const expense = new Expense(expenseId, name, amountInCents, currencyCode);

      expect(expense.id).toBe(expenseId);
      expect(expense.name).toBe(name);
      expect(expense.amountInCents).toBe(amountInCents);
      expect(expense.currencyCode).toBe(currencyCode);
    });

    it("should create an expense with USD currency", () => {
      const expense = new Expense(expenseId, "Coffee", 350, "USD");

      expect(expense.currencyCode).toBe("USD");
      expect(expense.amountInCents).toBe(350);
    });

    it("should create an expense with BRL currency", () => {
      const expense = new Expense(expenseId, "Group Lunch", 10000, "BRL");

      expect(expense.currencyCode).toBe("BRL");
      expect(expense.amountInCents).toBe(10000);
    });

    it("should create an expense with USD currency again", () => {
      const expense = new Expense(expenseId, "Shared Expense", 2000, "USD");

      expect(expense.currencyCode).toBe("USD");
      expect(expense.amountInCents).toBe(2000);
    });
  });

  describe("properties", () => {
    it("should allow name to be modified", () => {
      const expense = new Expense(expenseId, "Original", 1000, currencyCode);
      const newName = "Updated Name";

      expense.name = newName;

      expect(expense.name).toBe(newName);
    });

    it("should allow amountInCents to be modified", () => {
      const expense = new Expense(expenseId, "Test", 1000, currencyCode);
      const newAmount = 2000;

      expense.amountInCents = newAmount;

      expect(expense.amountInCents).toBe(newAmount);
    });

    it("should allow currencyCode to be modified", () => {
      const expense = new Expense(expenseId, "Test", 1000, "USD");
      const newCurrencyCode: CurrencyCode = "BRL";

      expense.currencyCode = newCurrencyCode;

      expect(expense.currencyCode).toBe(newCurrencyCode);
    });

    it("should not allow id to be modified (readonly)", () => {
      const expense = new Expense(expenseId, "Test", 1000, currencyCode);

      expect(expense.id).toBe(expenseId);
      // TypeScript prevents modification: expense.id = "new-id"; would cause compile error
    });
  });

  describe("edge cases", () => {
    it("should handle zero amount", () => {
      const expense = new Expense(expenseId, "Free Item", 0, currencyCode);

      expect(expense.amountInCents).toBe(0);
    });

    it("should handle large amounts", () => {
      const largeAmount = 999999999;
      const expense = new Expense(
        expenseId,
        "Expensive",
        largeAmount,
        currencyCode,
      );

      expect(expense.amountInCents).toBe(largeAmount);
    });

    it("should handle empty expense name", () => {
      const expense = new Expense(expenseId, "", 1000, currencyCode);

      expect(expense.name).toBe("");
    });

    it("should handle expense name with special characters", () => {
      const specialName = "Café & Restaurant - 50% discount!";
      const expense = new Expense(expenseId, specialName, 1000, currencyCode);

      expect(expense.name).toBe(specialName);
    });

    it("should handle very long expense names", () => {
      const longName = "A".repeat(1000);
      const expense = new Expense(expenseId, longName, 1000, currencyCode);

      expect(expense.name).toBe(longName);
      expect(expense.name.length).toBe(1000);
    });

    it("should handle negative amounts", () => {
      const expense = new Expense(expenseId, "Refund", -1000, currencyCode);

      expect(expense.amountInCents).toBe(-1000);
    });
  });

  describe("data integrity", () => {
    it("should maintain separate instances for different expenses", () => {
      const expense1 = new Expense("expense-1", "Expense 1", 1000, "USD");
      const expense2 = new Expense("expense-2", "Expense 2", 2000, "BRL");

      expect(expense1.id).not.toBe(expense2.id);
      expect(expense1.name).not.toBe(expense2.name);
      expect(expense1.amountInCents).not.toBe(expense2.amountInCents);
      expect(expense1.currencyCode).not.toBe(expense2.currencyCode);
    });

    it("should maintain id immutability", () => {
      const expense = new Expense(expenseId, "Test", 1000, currencyCode);
      const originalId = expense.id;

      // Verify id remains constant
      expect(expense.id).toBe(originalId);
      expect(expense.id).toBe(expenseId);
    });
  });

  describe("amount representation", () => {
    it("should correctly represent cents (e.g., $10.00 = 1000 cents)", () => {
      const expense = new Expense(expenseId, "Ten Dollars", 1000, "USD");

      expect(expense.amountInCents).toBe(1000);
      expect(expense.amountInCents / 100).toBe(10.0);
    });

    it("should correctly represent fractional amounts (e.g., $10.99)", () => {
      const expense = new Expense(expenseId, "Ten Ninety-Nine", 1099, "USD");

      expect(expense.amountInCents).toBe(1099);
      expect(expense.amountInCents / 100).toBeCloseTo(10.99, 2);
    });

    it("should handle single cent amounts", () => {
      const expense = new Expense(expenseId, "One Cent", 1, "USD");

      expect(expense.amountInCents).toBe(1);
      expect(expense.amountInCents / 100).toBe(0.01);
    });
  });

  describe("currency support", () => {
    it("should support USD currency", () => {
      const expense = new Expense(expenseId, "USD Expense", 1000, "USD");

      expect(expense.currencyCode).toBe("USD");
    });

    it("should support BRL currency", () => {
      const expense = new Expense(expenseId, "BRL Expense", 1000, "BRL");

      expect(expense.currencyCode).toBe("BRL");
    });

    it("should support USD currency again", () => {
      const expense = new Expense(expenseId, "USD Expense", 1000, "USD");

      expect(expense.currencyCode).toBe("USD");
    });
  });
});
