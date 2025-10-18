import { DynamoDBBaseItem } from "./dynamoDBBaseItem";

export interface DynamoDBMemberItem extends DynamoDBBaseItem {
  type: "Member";
  PK: `GROUP#${string}`;
  SK: `MEMBER#${string}`;
  memberId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}
