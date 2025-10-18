import { Injectable } from "@nestjs/common";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { Group } from "@domain/entities/group";
import { Member } from "@domain/entities/member";
import { Expense } from "@domain/entities/expense";
import { GroupID } from "@domain/types/types";
import { TABLE_NAME } from "../database/dynamodb.config";
import {
  KeyBuilder,
  DynamoDBGroupItem,
  DynamoDBMemberItem,
  DynamoDBExpenseItem,
} from "../database/dynamodb.types";
import { IGroupRepository } from "./interface/groupRepository";

@Injectable()
export class DynamoDBGroupRepository implements IGroupRepository {
  constructor(private readonly dynamoDb: DynamoDBDocumentClient) {}

  async findById(id: GroupID): Promise<Group | null> {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: {
        ":pk": KeyBuilder.groupPK(id),
      },
    });

    const result = await this.dynamoDb.send(command);

    if (!result.Items || result.Items.length === 0) {
      return null;
    }

    return this.mapItemsToGroup(result.Items, id);
  }

  async save(group: Group): Promise<Group> {
    const timestamp = new Date().toISOString();
    const pk = KeyBuilder.groupPK(group.id);

    const items: any[] = [];

    const groupItem: DynamoDBGroupItem = {
      PK: pk,
      SK: KeyBuilder.groupSK(),
      type: "Group",
      groupId: group.id,
      name: group.name,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    items.push(groupItem);

    for (const member of group.members) {
      const memberItem: DynamoDBMemberItem = {
        PK: pk,
        SK: KeyBuilder.memberSK(member.id),
        type: "Member",
        memberId: member.id,
        name: member.name,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      items.push(memberItem);
    }

    // Expense items
    for (const expense of group.expenses) {
      const expenseItem: DynamoDBExpenseItem = {
        PK: pk,
        SK: KeyBuilder.expenseSK(expense.id),
        type: "Expense",
        expenseId: expense.id,
        name: expense.name,
        amountInCents: expense.amountInCents,
        payerId: expense.payerId,
        participants: expense.participants,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      items.push(expenseItem);
    }

    // Write all items (batch write if more than 1 item)
    if (items.length === 1) {
      await this.dynamoDb.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: items[0] as Record<string, any>,
        }),
      );
    } else {
      // Batch write in chunks of 25 (DynamoDB limit)
      const chunks = this.chunkArray(items, 25);
      for (const chunk of chunks) {
        const putRequests = chunk.map((item: Record<string, any>) => ({
          PutRequest: { Item: item },
        }));

        await this.dynamoDb.send(
          new BatchWriteCommand({
            RequestItems: {
              [TABLE_NAME]: putRequests,
            },
          }),
        );
      }
    }

    return group;
  }

  async delete(id: GroupID): Promise<boolean> {
    const group = await this.findById(id);
    if (!group) {
      return false;
    }

    const pk = KeyBuilder.groupPK(id);

    // Collect all sort keys to delete
    const sortKeys: string[] = [KeyBuilder.groupSK()];

    group.members.forEach((member) => {
      sortKeys.push(KeyBuilder.memberSK(member.id));
    });

    group.expenses.forEach((expense) => {
      sortKeys.push(KeyBuilder.expenseSK(expense.id));
    });

    // Delete in batches of 25
    const chunks = this.chunkArray(sortKeys, 25);
    for (const chunk of chunks) {
      const deleteRequests = chunk.map((sk) => ({
        DeleteRequest: {
          Key: { PK: pk, SK: sk },
        },
      }));

      await this.dynamoDb.send(
        new BatchWriteCommand({
          RequestItems: {
            [TABLE_NAME]: deleteRequests,
          },
        }),
      );
    }

    return true;
  }

  private mapItemsToGroup(
    items: Record<string, any>[],
    groupId: GroupID,
  ): Group {
    let groupName = "";
    const members: Member[] = [];
    const expenses: Expense[] = [];

    for (const item of items) {
      switch (item.type) {
        case "Group":
          groupName = item.name as string;
          break;
        case "Member":
          members.push(
            new Member(item.memberId as string, item.name as string),
          );
          break;
        case "Expense":
          expenses.push(
            new Expense(
              item.expenseId as string,
              item.name as string,
              item.amountInCents as number,
              item.payerId as string,
              item.participants as string[],
            ),
          );
          break;
      }
    }

    const group = new Group(groupId, groupName);
    group.members = members;
    group.expenses = expenses;

    return group;
  }

  async exists(id: GroupID): Promise<boolean> {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND SK = :sk",
      ExpressionAttributeValues: {
        ":pk": KeyBuilder.groupPK(id),
        ":sk": KeyBuilder.groupSK(),
      },
      ProjectionExpression: "PK",
      Limit: 1,
    });

    const result = await this.dynamoDb.send(command);
    return !!result.Items && result.Items.length > 0;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
