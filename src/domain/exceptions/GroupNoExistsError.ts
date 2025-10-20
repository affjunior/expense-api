import { NotFoundException } from "@nestjs/common";

export class GroupNoExistsError extends NotFoundException {
  constructor(groupId: string) {
    super(`Group with id ${groupId} does not exist`);
  }
}
