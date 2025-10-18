import { Injectable } from "@nestjs/common";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { Expense } from "@domain/entities/expense";
import { GroupID } from "@domain/types/types";
import { TABLE_NAME } from "../database/dynamodb.config";
import { KeyBuilder, DynamoDBExpenseItem } from "../database/dynamodb.types";
import { IExpenseRepository } from "./interface/expenseRepository";

@Injectable()
export class DynamoDBExpenseRepository implements IExpenseRepository {
  constructor(private readonly dynamoDb: DynamoDBDocumentClient) {}

  async findByGroupId(groupId: GroupID): Promise<Expense[]> {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": KeyBuilder.groupPK(groupId),
        ":sk": "EXPENSE#",
      },
    });

    const result = await this.dynamoDb.send(command);

    if (!result.Items || result.Items.length === 0) {
      return [];
    }

    return result.Items.map(
      (item) =>
        new Expense(
          item.expenseId as string,
          item.name as string,
          item.amountInCents as number,
          item.payerId as string,
          item.participants as string[],
        ),
    );
  }

  async save(expense: Expense, groupId: GroupID): Promise<Expense> {
    const timestamp = new Date().toISOString();

    const item: DynamoDBExpenseItem = {
      PK: KeyBuilder.groupPK(groupId),
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

    await this.dynamoDb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
      }),
    );

    return expense;
  }

  async delete(id: string, groupId: GroupID): Promise<boolean> {
    const command = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: KeyBuilder.groupPK(groupId),
        SK: KeyBuilder.expenseSK(id),
      },
      ReturnValues: "ALL_OLD",
    });

    const result = await this.dynamoDb.send(command);
    return !!result.Attributes;
  }
}
