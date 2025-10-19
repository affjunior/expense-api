import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { CreateGroupDto } from "@application/dto/in/createGroupDto";
import { CreateExpenseDto } from "@application/dto/in/createExpenseDto";
import { GroupResponseDto } from "@application/dto/out/groupResponseDto";
import { GroupBalancesResponseDto } from "@application/dto/out/groupBalancesResponseDto";
import { CreateGroupUseCase } from "@domain/usecase/createGroup.usecase";
import { AddExpenseUseCase } from "@domain/usecase/addExpense.usecase";
import { GetBalancesUseCase } from "@domain/usecase/getBalances.usecase";

@Controller("groups")
export class GroupController {
  constructor(
    private readonly createGroupUseCase: CreateGroupUseCase,
    private readonly addExpenseUseCase: AddExpenseUseCase,
    private readonly getBalancesUseCase: GetBalancesUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createGroup(
    @Body() createGroupDto: CreateGroupDto,
  ): Promise<GroupResponseDto> {
    return this.createGroupUseCase.execute(createGroupDto);
  }

  @Post(":groupId/expenses")
  @HttpCode(HttpStatus.CREATED)
  async addExpense(
    @Param("groupId") groupId: string,
    @Body() createExpenseDto: CreateExpenseDto,
  ): Promise<GroupResponseDto> {
    return this.addExpenseUseCase.execute(groupId, createExpenseDto);
  }

  @Get(":groupId/balances")
  @HttpCode(HttpStatus.OK)
  async getBalances(
    @Param("groupId") groupId: string,
  ): Promise<GroupBalancesResponseDto> {
    return this.getBalancesUseCase.execute(groupId);
  }
}
