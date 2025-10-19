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
      const group = new Group(groupId, "Trip");
      group.addMember(new Member("m1", "Alice"));
      group.addMember(new Member("m2", "Bob"));
      group.addExpense(new Expense("e1", "Dinner", 2000, "m1", ["m1", "m2"]));

      groupRepository.findById.mockResolvedValue(group);

      const result = await useCase.execute(groupId);

      expect(result).toBeDefined();
      expect(result.groupId).toBe(groupId);
      expect(result.balances).toHaveLength(2);
    });

    it("should throw NotFoundException when group does not exist", async () => {
      groupRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(groupId)).rejects.toThrow(NotFoundException);
    });

    it("should throw NotFoundException with correct message", async () => {
      groupRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(groupId)).rejects.toThrow(
        `Group with ID ${groupId} not found`,
      );
    });

    it("should call findById with correct groupId", async () => {
      const group = new Group(groupId, "Trip");
      group.addMember(new Member("m1", "Alice"));

      groupRepository.findById.mockResolvedValue(group);

      await useCase.execute(groupId);

      expect(groupRepository.findById).toHaveBeenCalledTimes(1);
      expect(groupRepository.findById).toHaveBeenCalledWith(groupId);
    });

    it("should return correct balance calculations", async () => {
      const group = new Group(groupId, "Trip");
      group.addMember(new Member("m1", "Alice"));
      group.addMember(new Member("m2", "Bob"));
      group.addExpense(new Expense("e1", "Dinner", 2000, "m1", ["m1", "m2"]));

      groupRepository.findById.mockResolvedValue(group);

      const result = await useCase.execute(groupId);

      const aliceBalance = result.balances.find((b) => b.memberId === "m1");
      expect(aliceBalance?.balance).toBe(1000); // paid 2000, owes 1000

      const bobBalance = result.balances.find((b) => b.memberId === "m2");
      expect(bobBalance?.balance).toBe(-1000); // owes 1000
    });

    it("should include member names in response", async () => {
      const group = new Group(groupId, "Trip");
      group.addMember(new Member("m1", "Alice"));
      group.addMember(new Member("m2", "Bob"));

      groupRepository.findById.mockResolvedValue(group);

      const result = await useCase.execute(groupId);

      const aliceBalance = result.balances.find((b) => b.memberId === "m1");
      expect(aliceBalance?.memberName).toBe("Alice");

      const bobBalance = result.balances.find((b) => b.memberId === "m2");
      expect(bobBalance?.memberName).toBe("Bob");
    });

    it("should return zero balances when no expenses", async () => {
      const group = new Group(groupId, "Trip");
      group.addMember(new Member("m1", "Alice"));
      group.addMember(new Member("m2", "Bob"));

      groupRepository.findById.mockResolvedValue(group);

      const result = await useCase.execute(groupId);

      expect(result.balances).toHaveLength(2);
      result.balances.forEach((balance) => {
        expect(balance.balance).toBe(0);
      });
    });

    it("should handle group with single member", async () => {
      const group = new Group(groupId, "Solo Trip");
      group.addMember(new Member("m1", "Alice"));
      group.addExpense(new Expense("e1", "Coffee", 500, "m1", ["m1"]));

      groupRepository.findById.mockResolvedValue(group);

      const result = await useCase.execute(groupId);

      expect(result.balances).toHaveLength(1);
      expect(result.balances[0].balance).toBe(0); // paid and owes for self
    });

    it("should handle complex multi-expense scenario", async () => {
      const group = new Group(groupId, "Trip");
      group.addMember(new Member("m1", "Alice"));
      group.addMember(new Member("m2", "Bob"));
      group.addMember(new Member("m3", "Charlie"));

      // Alice pays 3000 for all 3
      group.addExpense(
        new Expense("e1", "Dinner", 3000, "m1", ["m1", "m2", "m3"]),
      );
      // Bob pays 1200 for Bob and Charlie
      group.addExpense(new Expense("e2", "Lunch", 1200, "m2", ["m2", "m3"]));

      groupRepository.findById.mockResolvedValue(group);

      const result = await useCase.execute(groupId);

      expect(result.balances).toHaveLength(3);

      const aliceBalance = result.balances.find((b) => b.memberId === "m1");
      expect(aliceBalance?.balance).toBe(2000); // paid 3000, owes 1000

      const bobBalance = result.balances.find((b) => b.memberId === "m2");
      expect(bobBalance?.balance).toBe(-400); // paid 1200, owes 1600

      const charlieBalance = result.balances.find((b) => b.memberId === "m3");
      expect(charlieBalance?.balance).toBe(-1600); // owes 1600
    });

    it("should return GroupBalancesResponseDto with correct structure", async () => {
      const group = new Group(groupId, "Trip");
      group.addMember(new Member("m1", "Alice"));

      groupRepository.findById.mockResolvedValue(group);

      const result = await useCase.execute(groupId);

      expect(result).toHaveProperty("groupId");
      expect(result).toHaveProperty("balances");
      expect(Array.isArray(result.balances)).toBe(true);
    });

    it("should include all balance properties", async () => {
      const group = new Group(groupId, "Trip");
      group.addMember(new Member("m1", "Alice"));

      groupRepository.findById.mockResolvedValue(group);

      const result = await useCase.execute(groupId);

      expect(result.balances[0]).toHaveProperty("memberId");
      expect(result.balances[0]).toHaveProperty("memberName");
      expect(result.balances[0]).toHaveProperty("balance");
    });

    it("should propagate repository errors", async () => {
      const error = new Error("Database connection failed");
      groupRepository.findById.mockRejectedValue(error);

      await expect(useCase.execute(groupId)).rejects.toThrow(
        "Database connection failed",
      );
    });

    it("should handle group with many members", async () => {
      const group = new Group(groupId, "Large Group");

      for (let i = 1; i <= 10; i++) {
        group.addMember(new Member(`m${i}`, `Member ${i}`));
      }

      groupRepository.findById.mockResolvedValue(group);

      const result = await useCase.execute(groupId);

      expect(result.balances).toHaveLength(10);
    });

    it("should handle expenses with uneven splits", async () => {
      const group = new Group(groupId, "Trip");
      group.addMember(new Member("m1", "Alice"));
      group.addMember(new Member("m2", "Bob"));
      group.addMember(new Member("m3", "Charlie"));

      // 1000 cents divided by 3 = 333 each, with 1 cent remainder
      group.addExpense(
        new Expense("e1", "Coffee", 1000, "m1", ["m1", "m2", "m3"]),
      );

      groupRepository.findById.mockResolvedValue(group);

      const result = await useCase.execute(groupId);

      // Total should still sum to 0
      const totalBalance = result.balances.reduce(
        (sum, b) => sum + b.balance,
        0,
      );
      expect(totalBalance).toBe(0);
    });

    it("should handle expense where payer is not a participant", async () => {
      const group = new Group(groupId, "Trip");
      group.addMember(new Member("m1", "Alice"));
      group.addMember(new Member("m2", "Bob"));
      group.addMember(new Member("m3", "Charlie"));

      // Alice pays but only Bob and Charlie participate
      group.addExpense(new Expense("e1", "Gift", 1000, "m1", ["m2", "m3"]));

      groupRepository.findById.mockResolvedValue(group);

      const result = await useCase.execute(groupId);

      const aliceBalance = result.balances.find((b) => b.memberId === "m1");
      expect(aliceBalance?.balance).toBe(1000); // paid 1000, owes 0

      const bobBalance = result.balances.find((b) => b.memberId === "m2");
      expect(bobBalance?.balance).toBe(-500); // owes 500

      const charlieBalance = result.balances.find((b) => b.memberId === "m3");
      expect(charlieBalance?.balance).toBe(-500); // owes 500
    });

    it("should handle different group IDs correctly", async () => {
      const differentGroupId = "different-group-456";
      const group = new Group(differentGroupId, "Different Trip");
      group.addMember(new Member("m1", "Alice"));

      groupRepository.findById.mockResolvedValue(group);

      const result = await useCase.execute(differentGroupId);

      expect(result.groupId).toBe(differentGroupId);
      expect(groupRepository.findById).toHaveBeenCalledWith(differentGroupId);
    });

    it("should not modify the group when calculating balances", async () => {
      const group = new Group(groupId, "Trip");
      group.addMember(new Member("m1", "Alice"));
      group.addMember(new Member("m2", "Bob"));
      group.addExpense(new Expense("e1", "Dinner", 2000, "m1", ["m1", "m2"]));

      const originalMemberCount = group.members.length;
      const originalExpenseCount = group.expenses.length;

      groupRepository.findById.mockResolvedValue(group);

      await useCase.execute(groupId);

      expect(group.members).toHaveLength(originalMemberCount);
      expect(group.expenses).toHaveLength(originalExpenseCount);
    });
  });
});
