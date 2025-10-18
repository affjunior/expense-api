import { MemberID } from "@domain/types/types";

export class Member {
  constructor(
    public readonly id: MemberID,
    public name: string,
  ) {}
}
