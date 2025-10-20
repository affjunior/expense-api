import { Injectable, Inject } from "@nestjs/common";
import type { IGroupRepository } from "@infrastructure/repository/interface/groupRepository";
import { CreateGroupDto } from "@application/dto/in/createGroupDto";
import { GroupMapper } from "@application/mapper/group.mapper";
import { v4 as uuidv4 } from "uuid";
import { Group } from "@domain/entities/group";

@Injectable()
export class CreateGroupUseCase {
  constructor(
    @Inject("IGroupRepository")
    private readonly groupRepository: IGroupRepository,
  ) {}

  async execute(dto: CreateGroupDto): Promise<Group> {
    const groupId = uuidv4();
    const group = GroupMapper.toDomain(dto, groupId);

    const savedGroup = await this.groupRepository.save(group);

    return savedGroup;
  }
}
