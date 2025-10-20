import { CurrencyCode } from "@domain/utils/currency.util";
import { DynamoDBBaseItem } from "./dynamoDBBaseItem";

export interface DynamoDBExpenseItem extends DynamoDBBaseItem {
  type: "Expense";
  PK: `GROUP#${string}`;
  SK: `EXPENSE#${string}`;
  expenseId: string;
  name: string;
  amountInCents: number;
  currencyCode: string;
  createdAt: string;
  updatedAt: string;
}
