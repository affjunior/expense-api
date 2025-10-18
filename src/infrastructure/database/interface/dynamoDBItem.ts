import { DynamoDBExpenseItem } from "./dynamoDBExpenseItem";
import { DynamoDBGroupItem } from "./dynamoDBGroupItem";
import { DynamoDBMemberItem } from "./dynamoDBMemberItem";

export type DynamoDBItem =
  | DynamoDBGroupItem
  | DynamoDBMemberItem
  | DynamoDBExpenseItem;
