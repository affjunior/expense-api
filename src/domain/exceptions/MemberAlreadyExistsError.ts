import { ConflictException } from "@nestjs/common";

export class MemberAlreadyExistsError extends ConflictException {
  constructor(name: string) {
    super(`Member ${name} already exists`);
  }
}
