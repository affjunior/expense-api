import { Injectable, NotFoundException, Inject } from "@nestjs/common";
import type { IGroupRepository } from "@infrastructure/repository/interface/groupRepository";
import { GroupBalancesResponseDto } from "@application/dto/out/groupBalancesResponseDto";
import { GroupMapper } from "@application/mapper/group.mapper";

@Injectable()
export class GetBalancesUseCase {
  constructor(
    @Inject("IGroupRepository")
    private readonly groupRepository: IGroupRepository,
  ) {}

  async execute(groupId: string): Promise<GroupBalancesResponseDto> {
    const group = await this.groupRepository.findById(groupId);

    if (!group) {
      throw new NotFoundException(`Group with ID ${groupId} not found`);
    }

    return GroupMapper.toBalancesResponseDto(group);
  }
}
