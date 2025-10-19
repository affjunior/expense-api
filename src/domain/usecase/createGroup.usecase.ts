import { Injectable, Inject } from "@nestjs/common";
import type { IGroupRepository } from "@infrastructure/repository/interface/groupRepository";
import { CreateGroupDto } from "@application/dto/in/createGroupDto";
import { GroupResponseDto } from "@application/dto/out/groupResponseDto";
import { GroupMapper } from "@application/mapper/group.mapper";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class CreateGroupUseCase {
  constructor(
    @Inject("IGroupRepository")
    private readonly groupRepository: IGroupRepository,
  ) {}

  async execute(dto: CreateGroupDto): Promise<GroupResponseDto> {
    const groupId = uuidv4();
    const group = GroupMapper.toDomain(dto, groupId);

    const savedGroup = await this.groupRepository.save(group);

    return GroupMapper.toResponseDto(savedGroup);
  }
}
