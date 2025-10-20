import { NotFoundException } from "@nestjs/common";

export class ExpensesNoExistsError extends NotFoundException {
  constructor(groupId: string) {
    super(`Expenses not found for group ${groupId}`);
  }
}
