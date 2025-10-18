import { DynamoDBBaseItem } from "./dynamoDBBaseItem";

export interface DynamoDBExpenseItem extends DynamoDBBaseItem {
  type: "Expense";
  PK: `GROUP#${string}`;
  SK: `EXPENSE#${string}`;
  expenseId: string;
  name: string;
  amountInCents: number;
  payerId: string;
  participants: string[];
  createdAt: string;
  updatedAt: string;
}
