import { Injectable } from "@nestjs/common";
import {
  DynamoDBDocumentClient,
  PutCommand,
  DeleteCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { Member } from "@domain/entities/member";
import { MemberID, GroupID } from "@domain/types/types";
import { TABLE_NAME } from "../database/dynamodb.config";
import { KeyBuilder, DynamoDBMemberItem } from "../database/dynamodb.types";
import { IMemberRepository } from "./interface/memberRepository";

@Injectable()
export class DynamoDBMemberRepository implements IMemberRepository {
  constructor(private readonly dynamoDb: DynamoDBDocumentClient) {}

  async findByGroupId(groupId: GroupID): Promise<Member[]> {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": KeyBuilder.groupPK(groupId),
        ":sk": "MEMBER#",
      },
    });

    const result = await this.dynamoDb.send(command);

    if (!result.Items || result.Items.length === 0) {
      return [];
    }

    return result.Items.map(
      (item) => new Member(item.memberId as string, item.name as string),
    );
  }

  async save(member: Member, groupId: GroupID): Promise<Member> {
    const timestamp = new Date().toISOString();

    const item: DynamoDBMemberItem = {
      PK: KeyBuilder.groupPK(groupId),
      SK: KeyBuilder.memberSK(member.id),
      type: "Member",
      memberId: member.id,
      name: member.name,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await this.dynamoDb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
      }),
    );

    return member;
  }

  async delete(id: MemberID, groupId: GroupID): Promise<boolean> {
    const command = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: KeyBuilder.groupPK(groupId),
        SK: KeyBuilder.memberSK(id),
      },
      ReturnValues: "ALL_OLD",
    });

    const result = await this.dynamoDb.send(command);
    return !!result.Attributes;
  }

  exists(): Promise<boolean> {
    // Same limitation as findById - needs groupId context
    throw new Error("exists requires groupId context in single-table design.");
  }
}
