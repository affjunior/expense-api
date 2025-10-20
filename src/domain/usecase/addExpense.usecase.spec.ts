/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// @ts-nocheck

import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { AddExpenseUseCase } from "./addExpense.usecase";
import type { IGroupRepository } from "@infrastructure/repository/interface/groupRepository";
import { CreateExpenseDto } from "@application/dto/in/createExpenseDto";
import { Group } from "@domain/entities/group";
import { Member } from "@domain/entities/member";
import { Expense } from "@domain/entities/expense";

describe("AddExpenseUseCase", () => {
  let useCase: AddExpenseUseCase;
  let groupRepository: jest.Mocked<IGroupRepository>;

  const groupId = "group-123";

  beforeEach(async () => {
    const mockGroupRepository: Partial<jest.Mocked<IGroupRepository>> = {
      save: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddExpenseUseCase,
        {
          provide: "IGroupRepository",
          useValue: mockGroupRepository,
        },
      ],
    }).compile();

    useCase = module.get<AddExpenseUseCase>(AddExpenseUseCase);
    groupRepository = module.get("IGroupRepository");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("execute", () => {
    it("should add expense to group successfully", async () => {
      const group = new Group(groupId, "Trip");
      group.addMember(new Member("m1", "Alice"));
      group.addMember(new Member("m2", "Bob"));

      const dto: CreateExpenseDto = {
        name: "Dinner",
        amount: 50.0,
        currencyCode: "USD",
      };

      groupRepository.findById.mockResolvedValue(group);
      groupRepository.save.mockResolvedValue(group);

      const result = await useCase.execute(groupId, dto, "m1", ["m1", "m2"]);

      expect(result).toBeDefined();
      expect(result.expenses).toHaveLength(1);
      expect(result.expenses[0].name).toBe("Dinner");
      expect(result.expenses[0].amount).toBe(50.0);
      expect(result.expenses[0].amountInCents).toBe(5000);
      expect(result.expenses[0].currencyCode).toBe("USD");
      expect(result.expenses[0].payerId).toBe("m1");
      expect(result.expenses[0].participants).toEqual(["m1", "m2"]);
    });

    it("should throw NotFoundException when group does not exist", async () => {
      const dto: CreateExpenseDto = {
        name: "Dinner",
        amount: 50.0,
        currencyCode: "USD",
      };

      groupRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(groupId, dto, "m1", ["m1"])).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should call findById with correct groupId", async () => {
      const group = new Group(groupId, "Trip");
      group.addMember(new Member("m1", "Alice"));

      const dto: CreateExpenseDto = {
        name: "Lunch",
        amount: 30.0,
        currencyCode: "USD",
      };

      groupRepository.findById.mockResolvedValue(group);
      groupRepository.save.mockResolvedValue(group);

      await useCase.execute(groupId, dto, "m1", ["m1"]);

      expect(groupRepository.findById).toHaveBeenCalledTimes(1);
      expect(groupRepository.findById).toHaveBeenCalledWith(groupId);
    });
  });
});
