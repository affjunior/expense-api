/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { GetBalancesUseCase } from "./getBalances.usecase";
import type { IGroupRepository } from "@infrastructure/repository/interface/groupRepository";
import { Group } from "@domain/entities/group";
import { Member } from "@domain/entities/member";
import { Expense } from "@domain/entities/expense";
import { Balance } from "@domain/entities/balance";

describe("GetBalancesUseCase", () => {
  let useCase: GetBalancesUseCase;
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
        GetBalancesUseCase,
        {
          provide: "IGroupRepository",
          useValue: mockGroupRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetBalancesUseCase>(GetBalancesUseCase);
    groupRepository = module.get("IGroupRepository");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("execute", () => {
    it("should return balances for group successfully", async () => {
      const balance = new Balance("USD", 0);
      const group = new Group(groupId, "Trip");
      group.addMember(new Member("m1", "Alice"));
      group.addMember(new Member("m2", "Bob"));
      group.addExpense(new Expense("e1", "Dinner", 2000, "USD"));

      groupRepository.findById.mockResolvedValue(group);

      const result = await useCase.execute(balance, groupId);

      expect(result).toBeDefined();
      expect(result.id).toBe(groupId);
    });

    it("should throw NotFoundException when group does not exist", async () => {
      const balance = new Balance("USD", 0);
      groupRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(balance, groupId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw NotFoundException with correct message", async () => {
      const balance = new Balance("USD", 0);
      groupRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(balance, groupId)).rejects.toThrow(
        `Group with id ${groupId} does not exist`,
      );
    });

    it("should call findById with correct groupId", async () => {
      const balance = new Balance("USD", 0);
      const group = new Group(groupId, "Trip");
      group.addMember(new Member("m1", "Alice"));
      group.addExpense(new Expense("e1", "Dinner", 2000, "USD"));

      groupRepository.findById.mockResolvedValue(group);

      await useCase.execute(balance, groupId);

      expect(groupRepository.findById).toHaveBeenCalledTimes(1);
      expect(groupRepository.findById).toHaveBeenCalledWith(groupId);
    });

    it("should return correct balance calculations", async () => {
      const balance = new Balance("USD", 0);
      const group = new Group(groupId, "Trip");
      group.addMember(new Member("m1", "Alice"));
      group.addMember(new Member("m2", "Bob"));
      group.addExpense(new Expense("e1", "Dinner", 2000, "USD"));

      groupRepository.findById.mockResolvedValue(group);

      const result = await useCase.execute(balance, groupId);

      expect(result).toBeDefined();
      expect(result.id).toBe(groupId);
    });

    it("should include member names in response", async () => {
      const balance = new Balance("USD", 0);
      const group = new Group(groupId, "Trip");
      group.addMember(new Member("m1", "Alice"));
      group.addMember(new Member("m2", "Bob"));
      group.addExpense(new Expense("e1", "Dinner", 2000, "USD"));

      groupRepository.findById.mockResolvedValue(group);

      const result = await useCase.execute(balance, groupId);

      expect(result.members[0].name).toBe("Alice");
      expect(result.members[1].name).toBe("Bob");
    });

    it("should return zero balances when no expenses", async () => {
      const balance = new Balance("USD", 0);
      const group = new Group(groupId, "Trip");
      group.addMember(new Member("m1", "Alice"));
      group.addMember(new Member("m2", "Bob"));

      groupRepository.findById.mockResolvedValue(group);

      await expect(useCase.execute(balance, groupId)).rejects.toThrow(
        `Expenses not found for group ${groupId}`,
      );
    });

    it("should handle group with single member", async () => {
      const balance = new Balance("USD", 0);
      const group = new Group(groupId, "Solo Trip");
      group.addMember(new Member("m1", "Alice"));
      group.addExpense(new Expense("e1", "Coffee", 500, "USD"));

      groupRepository.findById.mockResolvedValue(group);

      const result = await useCase.execute(balance, groupId);

      expect(result.members).toHaveLength(1);
    });

    it("should handle complex multi-expense scenario", async () => {
      const balance = new Balance("USD", 0);
      const group = new Group(groupId, "Trip");
      group.addMember(new Member("m1", "Alice"));
      group.addMember(new Member("m2", "Bob"));
      group.addMember(new Member("m3", "Charlie"));

      // Alice pays 3000 for all 3
      group.addExpense(new Expense("e1", "Dinner", 3000, "USD"));
      // Bob pays 1200 for Bob and Charlie
      group.addExpense(new Expense("e2", "Lunch", 1200, "USD"));

      groupRepository.findById.mockResolvedValue(group);

      const result = await useCase.execute(balance, groupId);

      expect(result.members).toHaveLength(3);
    });

    it("should return GroupBalancesResponseDto with correct structure", async () => {
      const balance = new Balance("USD", 0);
      const group = new Group(groupId, "Trip");
      group.addMember(new Member("m1", "Alice"));
      group.addExpense(new Expense("e1", "Dinner", 2000, "USD"));

      groupRepository.findById.mockResolvedValue(group);

      const result = await useCase.execute(balance, groupId);

      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("members");
      expect(Array.isArray(result.members)).toBe(true);
    });

    it("should include all balance properties", async () => {
      const balance = new Balance("USD", 0);
      const group = new Group(groupId, "Trip");
      group.addMember(new Member("m1", "Alice"));
      group.addExpense(new Expense("e1", "Dinner", 2000, "USD"));

      groupRepository.findById.mockResolvedValue(group);

      const result = await useCase.execute(balance, groupId);

      expect(result.members[0]).toHaveProperty("id");
      expect(result.members[0]).toHaveProperty("name");
    });

    it("should propagate repository errors", async () => {
      const balance = new Balance("USD", 0);
      const error = new Error("Database connection failed");
      groupRepository.findById.mockRejectedValue(error);

      await expect(useCase.execute(balance, groupId)).rejects.toThrow(
        "Database connection failed",
      );
    });

    it("should handle group with many members", async () => {
      const balance = new Balance("USD", 0);
      const group = new Group(groupId, "Large Group");

      for (let i = 1; i <= 10; i++) {
        group.addMember(new Member(`m${i}`, `Member ${i}`));
      }
      group.addExpense(new Expense("e1", "Dinner", 10000, "USD"));

      groupRepository.findById.mockResolvedValue(group);

      const result = await useCase.execute(balance, groupId);

      expect(result.members).toHaveLength(10);
    });

    it("should handle expenses with uneven splits", async () => {
      const balance = new Balance("USD", 0);
      const group = new Group(groupId, "Trip");
      group.addMember(new Member("m1", "Alice"));
      group.addMember(new Member("m2", "Bob"));
      group.addMember(new Member("m3", "Charlie"));

      // 1000 cents divided by 3 = 333 each, with 1 cent remainder
      group.addExpense(new Expense("e1", "Coffee", 1000, "USD"));

      groupRepository.findById.mockResolvedValue(group);

      const result = await useCase.execute(balance, groupId);

      expect(result.members).toHaveLength(3);
    });

    it("should handle expense where payer is not a participant", async () => {
      const balance = new Balance("USD", 0);
      const group = new Group(groupId, "Trip");
      group.addMember(new Member("m1", "Alice"));
      group.addMember(new Member("m2", "Bob"));
      group.addMember(new Member("m3", "Charlie"));

      // Alice pays
      group.addExpense(new Expense("e1", "Gift", 1000, "USD"));

      groupRepository.findById.mockResolvedValue(group);

      const result = await useCase.execute(balance, groupId);

      expect(result.members).toHaveLength(3);
    });

    it("should handle different group IDs correctly", async () => {
      const balance = new Balance("USD", 0);
      const differentGroupId = "different-group-456";
      const group = new Group(differentGroupId, "Different Trip");
      group.addMember(new Member("m1", "Alice"));
      group.addExpense(new Expense("e1", "Dinner", 2000, "USD"));

      groupRepository.findById.mockResolvedValue(group);

      const result = await useCase.execute(balance, differentGroupId);

      expect(result.id).toBe(differentGroupId);
      expect(groupRepository.findById).toHaveBeenCalledWith(differentGroupId);
    });

    it("should not modify the group when calculating balances", async () => {
      const balance = new Balance("USD", 0);
      const group = new Group(groupId, "Trip");
      group.addMember(new Member("m1", "Alice"));
      group.addMember(new Member("m2", "Bob"));
      group.addExpense(new Expense("e1", "Dinner", 2000, "USD"));

      const originalMemberCount = group.members.length;
      const originalExpenseCount = group.expenses.length;

      groupRepository.findById.mockResolvedValue(group);

      await useCase.execute(balance, groupId);

      expect(group.members).toHaveLength(originalMemberCount);
      expect(group.expenses).toHaveLength(originalExpenseCount);
    });
  });
});
