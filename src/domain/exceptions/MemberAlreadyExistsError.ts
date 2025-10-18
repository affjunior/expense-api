export class MemberAlreadyExistsError extends Error {
  constructor(memberId: string) {
    super(`Member with ID ${memberId} already exists in this group.`);
    this.name = "MemberAlreadyExistsError";
  }
}
