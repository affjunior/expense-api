export class PayerNotMemberError extends Error {
  constructor(payerId: string) {
    super(`Payer with ID ${payerId} is not a member of this group.`);
    this.name = "PayerNotMemberError";
  }
}
