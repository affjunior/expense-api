import { MemberID } from "@domain/types/types";

export class Member {
  constructor(
    public id: MemberID,
    public name: string,
  ) {}
}
