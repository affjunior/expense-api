import { NotFoundException } from "@nestjs/common";

export class GroupHasNoMembersError extends NotFoundException {
  constructor(groupId: string) {
    super(`Group with ID ${groupId} has no members`);
  }
}
