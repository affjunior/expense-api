import { ItemType } from "./itemType";

export interface DynamoDBBaseItem {
  PK: string;
  SK: string;
  type: ItemType;
}
