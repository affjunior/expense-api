import { Injectable, NotFoundException, Inject } from "@nestjs/common";
import type { IGroupRepository } from "@infrastructure/repository/interface/groupRepository";
import { CreateExpenseDto } from "@application/dto/in/createExpenseDto";
import { GroupResponseDto } from "@application/dto/out/groupResponseDto";
import { GroupMapper } from "@application/mapper/group.mapper";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class AddExpenseUseCase {
  constructor(
    @Inject("IGroupRepository")
    private readonly groupRepository: IGroupRepository,
  ) {}

  async execute(
    groupId: string,
    dto: CreateExpenseDto,
  ): Promise<GroupResponseDto> {
    const group = await this.groupRepository.findById(groupId);

    if (!group) {
      throw new NotFoundException(`Group with ID ${groupId} not found`);
    }

    const expenseId = uuidv4();
    const expense = GroupMapper.expenseToDomain(dto, expenseId);

    group.addExpense(expense);

    const savedGroup = await this.groupRepository.save(group);

    return GroupMapper.toResponseDto(savedGroup);
  }
}
