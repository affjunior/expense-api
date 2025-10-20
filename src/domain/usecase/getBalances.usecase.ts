import { Injectable, Inject } from "@nestjs/common";
import type { IGroupRepository } from "@infrastructure/repository/interface/groupRepository";
import { Balance } from "@domain/entities/balance";
import { GroupNoExistsError } from "@domain/exceptions/GroupNoExistsError";
import { ExpensesNoExistsError } from "@domain/exceptions/ExpensesNoExistsError";
import { GroupHasNoMembersError } from "@domain/exceptions/GroupHasNoMembersError";
import { Group } from "@domain/entities/group";

@Injectable()
export class GetBalancesUseCase {
  constructor(
    @Inject("IGroupRepository")
    private readonly groupRepository: IGroupRepository,
  ) {}

  async execute(balance: Balance, groupId: string): Promise<Group> {
    const group = await this.groupRepository.findById(groupId);

    if (!group) {
      throw new GroupNoExistsError(groupId);
    }

    if (!group.members.length) {
      throw new GroupHasNoMembersError(groupId);
    }

    if (!group.expenses.length) {
      throw new ExpensesNoExistsError(groupId);
    }

    group.getBalances();

    return group;
  }
}
