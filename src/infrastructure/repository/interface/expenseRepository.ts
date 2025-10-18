import { Expense } from "@domain/entities/expense";
import { ExpenseID, GroupID } from "@domain/types/types";

export interface IExpenseRepository {
  /**
   * Finds all expenses in a group
   * @param groupId - The group ID
   * @returns Array of expenses in the group
   */
  findByGroupId(groupId: GroupID): Promise<Expense[]>;

  /**
   * Saves an expense (create or update)
   * @param expense - The expense to save
   * @param groupId - The group ID the expense belongs to
   * @returns The saved expense
   */
  save(expense: Expense, groupId: GroupID): Promise<Expense>;

  /**
   * Deletes an expense by its ID
   * @param id - The expense ID
   * @param groupId - The group ID
   * @returns True if deleted, false if not found
   */
  delete(id: ExpenseID, groupId: GroupID): Promise<boolean>;
}
