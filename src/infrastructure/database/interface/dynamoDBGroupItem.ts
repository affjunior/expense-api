import { DynamoDBBaseItem } from "./dynamoDBBaseItem";

export interface DynamoDBGroupItem extends DynamoDBBaseItem {
  type: "Group";
  PK: `GROUP#${string}`;
  SK: "METADATA";
  groupId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}
