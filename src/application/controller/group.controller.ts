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
import { GroupMapper } from "@application/mapper/group.mapper";
import { GroupResponseDto } from "@application/dto/out/groupResponseDto";
import { GroupBalancesResponseDto } from "@application/dto/out/groupBalancesResponseDto";
import { CreateGroupUseCase } from "@domain/usecase/createGroup.usecase";
import { AddExpenseUseCase } from "@domain/usecase/addExpense.usecase";
import { AddMemberUseCase } from "@domain/usecase/addMember.usecase";
import { GetBalancesUseCase } from "@domain/usecase/getBalances.usecase";
import { CreateExpenseDto } from "@application/dto/in/createExpenseDto";
import { CreateMemberDto } from "@application/dto/in/createMemberDto";
import { MemberResponseDto } from "@application/dto/out/memberResponseDto";
import { CreateBalancesDto } from "@application/dto/in/CreateBalancesDto";

@Controller("groups")
export class GroupController {
  constructor(
    private readonly createGroupUseCase: CreateGroupUseCase,
    private readonly addExpenseUseCase: AddExpenseUseCase,
    private readonly addMemberUseCase: AddMemberUseCase,
    private readonly getBalancesUseCase: GetBalancesUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createGroup(
    @Body() createGroupDto: CreateGroupDto,
  ): Promise<GroupResponseDto> {
    const group = GroupMapper.toDomain(createGroupDto);

    const savedGroup = await this.createGroupUseCase.execute(group);

    return GroupMapper.toResponseDto(savedGroup);
  }

  @Post(":groupId/expenses")
  @HttpCode(HttpStatus.CREATED)
  async addExpense(
    @Param("groupId") groupId: string,
    @Body() createExpenseDto: CreateExpenseDto,
  ): Promise<GroupResponseDto> {
    const expense = GroupMapper.expenseToDomain(createExpenseDto);

    const group = await this.addExpenseUseCase.execute(groupId, expense);

    return GroupMapper.toResponseDto(group);
  }

  @Post(":groupId/members")
  @HttpCode(HttpStatus.CREATED)
  async addMember(
    @Param("groupId") groupId: string,
    @Body() createMemberDto: CreateMemberDto,
  ): Promise<MemberResponseDto> {
    const member = GroupMapper.memberToDomain(createMemberDto);

    const savedMember = await this.addMemberUseCase.execute(member, groupId);

    return GroupMapper.memberToResponseDto(savedMember);
  }

  @Get(":groupId/balances")
  @HttpCode(HttpStatus.OK)
  async getBalances(
    @Param("groupId") groupId: string,
    @Body() createBalanceDto: CreateBalancesDto,
  ): Promise<GroupBalancesResponseDto> {
    const balance = GroupMapper.balanceToDomain(createBalanceDto);

    const group = await this.getBalancesUseCase.execute(balance, groupId);

    return GroupMapper.toBalancesResponseDto(group);
  }
}
