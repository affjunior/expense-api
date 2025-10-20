import { Injectable, Inject } from "@nestjs/common";
import type { IGroupRepository } from "@infrastructure/repository/interface/groupRepository";
import { Expense } from "@domain/entities/expense";
import { GroupHasNoMembersError } from "@domain/exceptions/GroupHasNoMembersError";
import { GroupNoExistsError } from "@domain/exceptions/GroupNoExistsError";
import { Group } from "@domain/entities/group";

@Injectable()
export class AddExpenseUseCase {
  constructor(
    @Inject("IGroupRepository")
    private readonly groupRepository: IGroupRepository,
  ) {}

  async execute(groupId: string, expense: Expense): Promise<Group> {
    const group = await this.groupRepository.findById(groupId);

    if (!group) {
      throw new GroupNoExistsError(groupId);
    }

    if (group.members.length === 0) {
      throw new GroupHasNoMembersError(groupId);
    }

    group.addExpense(expense, group);

    const savedGroup = await this.groupRepository.save(group);

    return savedGroup;
  }
}
