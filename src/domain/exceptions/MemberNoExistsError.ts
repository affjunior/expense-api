import { NotFoundException } from "@nestjs/common";

export class MemberNoExistsError extends NotFoundException {
  constructor(memberId: string) {
    super(`Member with id ${memberId} does not exist`);
  }
}
