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
        amountInCents: 5000,
        payerId: "m1",
        participants: ["m1", "m2"],
      };

      groupRepository.findById.mockResolvedValue(group);
      groupRepository.save.mockResolvedValue(group);

      const result = await useCase.execute(groupId, dto);

      expect(result).toBeDefined();
      expect(result.expenses).toHaveLength(1);
      expect(result.expenses[0].name).toBe("Dinner");
      expect(result.expenses[0].amountInCents).toBe(5000);
      expect(result.expenses[0].payerId).toBe("m1");
      expect(result.expenses[0].participants).toEqual(["m1", "m2"]);
    });

    it("should throw NotFoundException when group does not exist", async () => {
      const dto: CreateExpenseDto = {
        name: "Dinner",
        amountInCents: 5000,
        payerId: "m1",
        participants: ["m1"],
      };

      groupRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(groupId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw NotFoundException with correct message", async () => {
      const dto: CreateExpenseDto = {
        name: "Dinner",
        amountInCents: 5000,
        payerId: "m1",
        participants: ["m1"],
      };

      groupRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(groupId, dto)).rejects.toThrow(
        `Group with ID ${groupId} not found`,
      );
    });

    it("should call findById with correct groupId", async () => {
      const group = new Group(groupId, "Trip");
      group.addMember(new Member("m1", "Alice"));

      const dto: CreateExpenseDto = {
        name: "Lunch",
        amountInCents: 3000,
        payerId: "m1",
        participants: ["m1"],
      };

      groupRepository.findById.mockResolvedValue(group);
      groupRepository.save.mockResolvedValue(group);

      await useCase.execute(groupId, dto);

      expect(groupRepository.findById).toHaveBeenCalledTimes(1);
      expect(groupRepository.findById).toHaveBeenCalledWith(groupId);
    });

    it("should call save with updated group", async () => {
      const group = new Group(groupId, "Trip");
      group.addMember(new Member("m1", "Alice"));

      const dto: CreateExpenseDto = {
        name: "Coffee",
        amountInCents: 500,
        payerId: "m1",
        participants: ["m1"],
      };

      groupRepository.findById.mockResolvedValue(group);
      groupRepository.save.mockResolvedValue(group);

      await useCase.execute(groupId, dto);

      expect(groupRepository.save).toHaveBeenCalledTimes(1);
      expect(groupRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: groupId,
          expenses: expect.arrayContaining([
            expect.objectContaining({
              name: "Coffee",
              amountInCents: 500,
            }),
          ]),
        }),
      );
    });

    it("should generate UUID for new expense", async () => {
      const group = new Group(groupId, "Trip");
      group.addMember(new Member("m1", "Alice"));

      const dto: CreateExpenseDto = {
        name: "Test Expense",
        amountInCents: 1000,
        payerId: "m1",
        participants: ["m1"],
      };

      groupRepository.findById.mockResolvedValue(group);
      groupRepository.save.mockResolvedValue(group);

      const result = await useCase.execute(groupId, dto);

      expect(result.expenses[0].id).toBeDefined();
      expect(typeof result.expenses[0].id).toBe("string");
    });

    it("should add expense with multiple participants", async () => {
      const group = new Group(groupId, "Trip");
      group.addMember(new Member("m1", "Alice"));
      group.addMember(new Member("m2", "Bob"));
      group.addMember(new Member("m3", "Charlie"));

      const dto: CreateExpenseDto = {
        name: "Group Dinner",
        amountInCents: 9000,
        payerId: "m1",
        participants: ["m1", "m2", "m3"],
      };

      groupRepository.findById.mockResolvedValue(group);
      groupRepository.save.mockResolvedValue(group);

      const result = await useCase.execute(groupId, dto);

      expect(result.expenses[0].participants).toHaveLength(3);
      expect(result.expenses[0].participants).toEqual(["m1", "m2", "m3"]);
    });

    it("should add expense to group with existing expenses", async () => {
      const group = new Group(groupId, "Trip");
      group.addMember(new Member("m1", "Alice"));
      group.addMember(new Member("m2", "Bob"));
      group.addExpense(
        new Expense("e1", "First Expense", 3000, "m1", ["m1", "m2"]),
      );

      const dto: CreateExpenseDto = {
        name: "Second Expense",
        amountInCents: 2000,
        payerId: "m2",
        participants: ["m1", "m2"],
      };

      groupRepository.findById.mockResolvedValue(group);
      groupRepository.save.mockResolvedValue(group);

      const result = await useCase.execute(groupId, dto);

      expect(result.expenses).toHaveLength(2);
      expect(result.expenses[1].name).toBe("Second Expense");
    });

    it("should handle expense with single participant", async () => {
      const group = new Group(groupId, "Trip");
      group.addMember(new Member("m1", "Alice"));
      group.addMember(new Member("m2", "Bob"));

      const dto: CreateExpenseDto = {
        name: "Solo Coffee",
        amountInCents: 300,
        payerId: "m1",
        participants: ["m1"],
      };

      groupRepository.findById.mockResolvedValue(group);
      groupRepository.save.mockResolvedValue(group);

      const result = await useCase.execute(groupId, dto);

      expect(result.expenses[0].participants).toHaveLength(1);
      expect(result.expenses[0].participants[0]).toBe("m1");
    });

    it("should return GroupResponseDto with correct structure", async () => {
      const group = new Group(groupId, "Trip");
      group.addMember(new Member("m1", "Alice"));

      const dto: CreateExpenseDto = {
        name: "Test",
        amountInCents: 1000,
        payerId: "m1",
        participants: ["m1"],
      };

      groupRepository.findById.mockResolvedValue(group);
      groupRepository.save.mockResolvedValue(group);

      const result = await useCase.execute(groupId, dto);

      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("name");
      expect(result).toHaveProperty("members");
      expect(result).toHaveProperty("expenses");
    });

    it("should propagate repository errors on findById", async () => {
      const dto: CreateExpenseDto = {
        name: "Test",
        amountInCents: 1000,
        payerId: "m1",
        participants: ["m1"],
      };

      const error = new Error("Database connection failed");
      groupRepository.findById.mockRejectedValue(error);

      await expect(useCase.execute(groupId, dto)).rejects.toThrow(
        "Database connection failed",
      );
    });

    it("should propagate repository errors on save", async () => {
      const group = new Group(groupId, "Trip");
      group.addMember(new Member("m1", "Alice"));

      const dto: CreateExpenseDto = {
        name: "Test",
        amountInCents: 1000,
        payerId: "m1",
        participants: ["m1"],
      };

      groupRepository.findById.mockResolvedValue(group);
      const error = new Error("Save failed");
      groupRepository.save.mockRejectedValue(error);

      await expect(useCase.execute(groupId, dto)).rejects.toThrow(
        "Save failed",
      );
    });

    it("should handle large expense amounts", async () => {
      const group = new Group(groupId, "Trip");
      group.addMember(new Member("m1", "Alice"));

      const dto: CreateExpenseDto = {
        name: "Expensive Item",
        amountInCents: 1000000, // $10,000
        payerId: "m1",
        participants: ["m1"],
      };

      groupRepository.findById.mockResolvedValue(group);
      groupRepository.save.mockResolvedValue(group);

      const result = await useCase.execute(groupId, dto);

      expect(result.expenses[0].amountInCents).toBe(1000000);
    });

    it("should handle zero amount expenses", async () => {
      const group = new Group(groupId, "Trip");
      group.addMember(new Member("m1", "Alice"));

      const dto: CreateExpenseDto = {
        name: "Free Item",
        amountInCents: 0,
        payerId: "m1",
        participants: ["m1"],
      };

      groupRepository.findById.mockResolvedValue(group);
      groupRepository.save.mockResolvedValue(group);

      const result = await useCase.execute(groupId, dto);

      expect(result.expenses[0].amountInCents).toBe(0);
    });

    it("should handle special characters in expense name", async () => {
      const group = new Group(groupId, "Trip");
      group.addMember(new Member("m1", "Alice"));

      const dto: CreateExpenseDto = {
        name: "Café & Baguette (Paris)",
        amountInCents: 1500,
        payerId: "m1",
        participants: ["m1"],
      };

      groupRepository.findById.mockResolvedValue(group);
      groupRepository.save.mockResolvedValue(group);

      const result = await useCase.execute(groupId, dto);

      expect(result.expenses[0].name).toBe("Café & Baguette (Paris)");
    });

    it("should preserve all existing group data", async () => {
      const group = new Group(groupId, "Original Trip");
      group.addMember(new Member("m1", "Alice"));
      group.addMember(new Member("m2", "Bob"));

      const dto: CreateExpenseDto = {
        name: "New Expense",
        amountInCents: 2000,
        payerId: "m1",
        participants: ["m1"],
      };

      groupRepository.findById.mockResolvedValue(group);
      groupRepository.save.mockResolvedValue(group);

      const result = await useCase.execute(groupId, dto);

      expect(result.id).toBe(groupId);
      expect(result.name).toBe("Original Trip");
      expect(result.members).toHaveLength(2);
    });
  });
});
