import { Inject, Injectable } from "@nestjs/common";
import { Member } from "@domain/entities/member";
import type { IMemberRepository } from "@infrastructure/repository/interface/memberRepository";
import type { IGroupRepository } from "@infrastructure/repository/interface/groupRepository";
import { GroupNoExistsError } from "@domain/exceptions/GroupNoExistsError";
import { MemberAlreadyExistsError } from "@domain/exceptions/MemberAlreadyExistsError";
import { MemberResponseDto } from "@application/dto/out/memberResponseDto";
import { GroupMapper } from "@application/mapper/group.mapper";

@Injectable()
export class AddMemberUseCase {
  constructor(
    @Inject("IGroupRepository")
    private readonly groupRepository: IGroupRepository,
    @Inject("IMemberRepository")
    private readonly memberRepository: IMemberRepository,
  ) {}

  async execute(member: Member, groupId: string): Promise<Member> {
    const group = await this.groupRepository.findById(groupId);

    if (!group) {
      throw new GroupNoExistsError(groupId);
    }

    const name = member.name.toLowerCase();

    if (group.members.find((m) => m.name.toLowerCase() === name)) {
      throw new MemberAlreadyExistsError(name);
    }

    const savedMember = await this.memberRepository.save(member, groupId);

    return savedMember;
  }
}
