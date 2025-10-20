import { Module } from "@nestjs/common";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClientFactory } from "./database/config/dynamodb.config";
import { DynamoDBGroupRepository } from "./repository/dynamodbGroup";
import { DynamoDBMemberRepository } from "./repository/dynamodbMember";
import { IGroupRepository } from "./repository/interface/groupRepository";
import { IMemberRepository } from "./repository/interface/memberRepository";
import { GroupController } from "@application/controller/group.controller";
import { CreateGroupUseCase } from "@domain/usecase/createGroup.usecase";
import { AddExpenseUseCase } from "@domain/usecase/addExpense.usecase";
import { GetBalancesUseCase } from "@domain/usecase/getBalances.usecase";
import { AddMemberUseCase } from "@domain/usecase/addMember.usecase";

@Module({
  controllers: [GroupController],
  providers: [
    {
      provide: DynamoDBDocumentClient,
      useFactory: () => {
        return DynamoDBClientFactory.create({
          region: process.env.AWS_REGION || "us-east-1",
          endpoint: process.env.DYNAMODB_ENDPOINT || "http://localhost:8000",
        });
      },
    },
    {
      provide: "IGroupRepository",
      useClass: DynamoDBGroupRepository,
    },
    {
      provide: "IMemberRepository",
      useClass: DynamoDBMemberRepository,
    },
    {
      provide: CreateGroupUseCase,

      useFactory: (groupRepository: IGroupRepository): CreateGroupUseCase => {
        return new CreateGroupUseCase(groupRepository);
      },
      inject: ["IGroupRepository"],
    },
    {
      provide: AddExpenseUseCase,

      useFactory: (groupRepository: IGroupRepository): AddExpenseUseCase => {
        return new AddExpenseUseCase(groupRepository);
      },
      inject: ["IGroupRepository"],
    },
    {
      provide: GetBalancesUseCase,

      useFactory: (groupRepository: IGroupRepository): GetBalancesUseCase => {
        return new GetBalancesUseCase(groupRepository);
      },
      inject: ["IGroupRepository"],
    },
    {
      provide: AddMemberUseCase,

      useFactory: (
        groupRepository: IGroupRepository,
        memberRepository: IMemberRepository,
      ): AddMemberUseCase => {
        return new AddMemberUseCase(groupRepository, memberRepository);
      },
      inject: ["IGroupRepository", "IMemberRepository"],
    },
  ],
})
export class AppModule {}
