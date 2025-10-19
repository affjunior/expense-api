/* eslint-disable @typescript-eslint/unbound-method */

import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { GroupController } from "./group.controller";
import { CreateGroupUseCase } from "@domain/usecase/createGroup.usecase";
import { AddExpenseUseCase } from "@domain/usecase/addExpense.usecase";
import { GetBalancesUseCase } from "@domain/usecase/getBalances.usecase";
import { CreateGroupDto } from "@application/dto/in/createGroupDto";
import { CreateExpenseDto } from "@application/dto/in/createExpenseDto";
import { GroupResponseDto } from "@application/dto/out/groupResponseDto";
import { GroupBalancesResponseDto } from "@application/dto/out/groupBalancesResponseDto";

describe("GroupController", () => {
  let controller: GroupController;
  let createGroupUseCase: jest.Mocked<CreateGroupUseCase>;
  let addExpenseUseCase: jest.Mocked<AddExpenseUseCase>;
  let getBalancesUseCase: jest.Mocked<GetBalancesUseCase>;

  beforeEach(async () => {
    const mockCreateGroupUseCase = {
      execute: jest.fn(),
    };

    const mockAddExpenseUseCase = {
      execute: jest.fn(),
    };

    const mockGetBalancesUseCase = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupController],
      providers: [
        {
          provide: CreateGroupUseCase,
          useValue: mockCreateGroupUseCase,
        },
        {
          provide: AddExpenseUseCase,
          useValue: mockAddExpenseUseCase,
        },
        {
          provide: GetBalancesUseCase,
          useValue: mockGetBalancesUseCase,
        },
      ],
    }).compile();

    controller = module.get<GroupController>(GroupController);
    createGroupUseCase = module.get(CreateGroupUseCase);
    addExpenseUseCase = module.get(AddExpenseUseCase);
    getBalancesUseCase = module.get(GetBalancesUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createGroup", () => {
    it("should create a group successfully", async () => {
      const dto: CreateGroupDto = {
        name: "Trip to Europe",
        members: [
          { id: "m1", name: "Alice" },
          { id: "m2", name: "Bob" },
        ],
      };

      const expectedResponse: GroupResponseDto = {
        id: "group-123",
        name: "Trip to Europe",
        members: [
          { id: "m1", name: "Alice" },
          { id: "m2", name: "Bob" },
        ],
        expenses: [],
      };

      createGroupUseCase.execute.mockResolvedValue(expectedResponse);

      const result = await controller.createGroup(dto);

      expect(result).toEqual(expectedResponse);
      expect(createGroupUseCase.execute).toHaveBeenCalledTimes(1);
      expect(createGroupUseCase.execute).toHaveBeenCalledWith(dto);
    });

    it("should pass DTO to use case correctly", async () => {
      const dto: CreateGroupDto = {
        name: "Test Group",
        members: [],
      };

      const response: GroupResponseDto = {
        id: "group-id",
        name: "Test Group",
        members: [],
        expenses: [],
      };

      createGroupUseCase.execute.mockResolvedValue(response);

      await controller.createGroup(dto);

      expect(createGroupUseCase.execute).toHaveBeenCalledWith(dto);
    });

    it("should return GroupResponseDto", async () => {
      const dto: CreateGroupDto = {
        name: "Test",
        members: [],
      };

      const response: GroupResponseDto = {
        id: "group-id",
        name: "Test",
        members: [],
        expenses: [],
      };

      createGroupUseCase.execute.mockResolvedValue(response);

      const result = await controller.createGroup(dto);

      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("name");
      expect(result).toHaveProperty("members");
      expect(result).toHaveProperty("expenses");
    });

    it("should propagate errors from use case", async () => {
      const dto: CreateGroupDto = {
        name: "Test",
        members: [],
      };

      const error = new Error("Database error");
      createGroupUseCase.execute.mockRejectedValue(error);

      await expect(controller.createGroup(dto)).rejects.toThrow(
        "Database error",
      );
    });

    it("should handle group with multiple members", async () => {
      const dto: CreateGroupDto = {
        name: "Large Group",
        members: [
          { id: "m1", name: "Alice" },
          { id: "m2", name: "Bob" },
          { id: "m3", name: "Charlie" },
        ],
      };

      const response: GroupResponseDto = {
        id: "group-id",
        name: "Large Group",
        members: dto.members,
        expenses: [],
      };

      createGroupUseCase.execute.mockResolvedValue(response);

      const result = await controller.createGroup(dto);

      expect(result.members).toHaveLength(3);
    });

    it("should handle empty members array", async () => {
      const dto: CreateGroupDto = {
        name: "Solo Group",
        members: [],
      };

      const response: GroupResponseDto = {
        id: "group-id",
        name: "Solo Group",
        members: [],
        expenses: [],
      };

      createGroupUseCase.execute.mockResolvedValue(response);

      const result = await controller.createGroup(dto);

      expect(result.members).toEqual([]);
    });

    it("should handle special characters in group name", async () => {
      const dto: CreateGroupDto = {
        name: "Trip to Tōkyō & Paris (2024)",
        members: [],
      };

      const response: GroupResponseDto = {
        id: "group-id",
        name: "Trip to Tōkyō & Paris (2024)",
        members: [],
        expenses: [],
      };

      createGroupUseCase.execute.mockResolvedValue(response);

      const result = await controller.createGroup(dto);

      expect(result.name).toBe("Trip to Tōkyō & Paris (2024)");
    });
  });

  describe("addExpense", () => {
    const groupId = "group-123";

    it("should add expense to group successfully", async () => {
      const dto: CreateExpenseDto = {
        name: "Dinner",
        amountInCents: 5000,
        payerId: "m1",
        participants: ["m1", "m2"],
      };

      const expectedResponse: GroupResponseDto = {
        id: groupId,
        name: "Trip",
        members: [
          { id: "m1", name: "Alice" },
          { id: "m2", name: "Bob" },
        ],
        expenses: [
          {
            id: "expense-1",
            name: "Dinner",
            amountInCents: 5000,
            payerId: "m1",
            participants: ["m1", "m2"],
          },
        ],
      };

      addExpenseUseCase.execute.mockResolvedValue(expectedResponse);

      const result = await controller.addExpense(groupId, dto);

      expect(result).toEqual(expectedResponse);
      expect(addExpenseUseCase.execute).toHaveBeenCalledTimes(1);
      expect(addExpenseUseCase.execute).toHaveBeenCalledWith(groupId, dto);
    });

    it("should pass groupId and DTO to use case correctly", async () => {
      const dto: CreateExpenseDto = {
        name: "Lunch",
        amountInCents: 3000,
        payerId: "m1",
        participants: ["m1"],
      };

      const response: GroupResponseDto = {
        id: groupId,
        name: "Trip",
        members: [{ id: "m1", name: "Alice" }],
        expenses: [],
      };

      addExpenseUseCase.execute.mockResolvedValue(response);

      await controller.addExpense(groupId, dto);

      expect(addExpenseUseCase.execute).toHaveBeenCalledWith(groupId, dto);
    });

    it("should return GroupResponseDto", async () => {
      const dto: CreateExpenseDto = {
        name: "Test",
        amountInCents: 1000,
        payerId: "m1",
        participants: ["m1"],
      };

      const response: GroupResponseDto = {
        id: groupId,
        name: "Trip",
        members: [{ id: "m1", name: "Alice" }],
        expenses: [
          {
            id: "e1",
            name: "Test",
            amountInCents: 1000,
            payerId: "m1",
            participants: ["m1"],
          },
        ],
      };

      addExpenseUseCase.execute.mockResolvedValue(response);

      const result = await controller.addExpense(groupId, dto);

      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("name");
      expect(result).toHaveProperty("members");
      expect(result).toHaveProperty("expenses");
    });

    it("should throw NotFoundException when group not found", async () => {
      const dto: CreateExpenseDto = {
        name: "Test",
        amountInCents: 1000,
        payerId: "m1",
        participants: ["m1"],
      };

      addExpenseUseCase.execute.mockRejectedValue(
        new NotFoundException(`Group with ID ${groupId} not found`),
      );

      await expect(controller.addExpense(groupId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should propagate errors from use case", async () => {
      const dto: CreateExpenseDto = {
        name: "Test",
        amountInCents: 1000,
        payerId: "m1",
        participants: ["m1"],
      };

      const error = new Error("Database error");
      addExpenseUseCase.execute.mockRejectedValue(error);

      await expect(controller.addExpense(groupId, dto)).rejects.toThrow(
        "Database error",
      );
    });

    it("should handle expense with multiple participants", async () => {
      const dto: CreateExpenseDto = {
        name: "Group Dinner",
        amountInCents: 9000,
        payerId: "m1",
        participants: ["m1", "m2", "m3"],
      };

      const response: GroupResponseDto = {
        id: groupId,
        name: "Trip",
        members: [
          { id: "m1", name: "Alice" },
          { id: "m2", name: "Bob" },
          { id: "m3", name: "Charlie" },
        ],
        expenses: [
          {
            id: "e1",
            name: "Group Dinner",
            amountInCents: 9000,
            payerId: "m1",
            participants: ["m1", "m2", "m3"],
          },
        ],
      };

      addExpenseUseCase.execute.mockResolvedValue(response);

      const result = await controller.addExpense(groupId, dto);

      expect(result.expenses[0].participants).toHaveLength(3);
    });

    it("should handle large expense amounts", async () => {
      const dto: CreateExpenseDto = {
        name: "Expensive Item",
        amountInCents: 1000000,
        payerId: "m1",
        participants: ["m1"],
      };

      const response: GroupResponseDto = {
        id: groupId,
        name: "Trip",
        members: [{ id: "m1", name: "Alice" }],
        expenses: [
          {
            id: "e1",
            name: "Expensive Item",
            amountInCents: 1000000,
            payerId: "m1",
            participants: ["m1"],
          },
        ],
      };

      addExpenseUseCase.execute.mockResolvedValue(response);

      const result = await controller.addExpense(groupId, dto);

      expect(result.expenses[0].amountInCents).toBe(1000000);
    });

    it("should handle different group IDs", async () => {
      const differentGroupId = "different-group-456";
      const dto: CreateExpenseDto = {
        name: "Test",
        amountInCents: 1000,
        payerId: "m1",
        participants: ["m1"],
      };

      const response: GroupResponseDto = {
        id: differentGroupId,
        name: "Different Trip",
        members: [{ id: "m1", name: "Alice" }],
        expenses: [],
      };

      addExpenseUseCase.execute.mockResolvedValue(response);

      await controller.addExpense(differentGroupId, dto);

      expect(addExpenseUseCase.execute).toHaveBeenCalledWith(
        differentGroupId,
        dto,
      );
    });
  });

  describe("getBalances", () => {
    const groupId = "group-123";

    it("should get balances for group successfully", async () => {
      const expectedResponse: GroupBalancesResponseDto = {
        groupId,
        balances: [
          { memberId: "m1", memberName: "Alice", balance: 1000 },
          { memberId: "m2", memberName: "Bob", balance: -1000 },
        ],
      };

      getBalancesUseCase.execute.mockResolvedValue(expectedResponse);

      const result = await controller.getBalances(groupId);

      expect(result).toEqual(expectedResponse);
      expect(getBalancesUseCase.execute).toHaveBeenCalledTimes(1);
      expect(getBalancesUseCase.execute).toHaveBeenCalledWith(groupId);
    });

    it("should pass groupId to use case correctly", async () => {
      const response: GroupBalancesResponseDto = {
        groupId,
        balances: [],
      };

      getBalancesUseCase.execute.mockResolvedValue(response);

      await controller.getBalances(groupId);

      expect(getBalancesUseCase.execute).toHaveBeenCalledWith(groupId);
    });

    it("should return GroupBalancesResponseDto", async () => {
      const response: GroupBalancesResponseDto = {
        groupId,
        balances: [{ memberId: "m1", memberName: "Alice", balance: 0 }],
      };

      getBalancesUseCase.execute.mockResolvedValue(response);

      const result = await controller.getBalances(groupId);

      expect(result).toHaveProperty("groupId");
      expect(result).toHaveProperty("balances");
      expect(Array.isArray(result.balances)).toBe(true);
    });

    it("should throw NotFoundException when group not found", async () => {
      getBalancesUseCase.execute.mockRejectedValue(
        new NotFoundException(`Group with ID ${groupId} not found`),
      );

      await expect(controller.getBalances(groupId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should propagate errors from use case", async () => {
      const error = new Error("Database error");
      getBalancesUseCase.execute.mockRejectedValue(error);

      await expect(controller.getBalances(groupId)).rejects.toThrow(
        "Database error",
      );
    });

    it("should handle empty balances", async () => {
      const response: GroupBalancesResponseDto = {
        groupId,
        balances: [],
      };

      getBalancesUseCase.execute.mockResolvedValue(response);

      const result = await controller.getBalances(groupId);

      expect(result.balances).toEqual([]);
    });

    it("should handle multiple balances", async () => {
      const response: GroupBalancesResponseDto = {
        groupId,
        balances: [
          { memberId: "m1", memberName: "Alice", balance: 2000 },
          { memberId: "m2", memberName: "Bob", balance: -400 },
          { memberId: "m3", memberName: "Charlie", balance: -1600 },
        ],
      };

      getBalancesUseCase.execute.mockResolvedValue(response);

      const result = await controller.getBalances(groupId);

      expect(result.balances).toHaveLength(3);
    });

    it("should include all balance properties", async () => {
      const response: GroupBalancesResponseDto = {
        groupId,
        balances: [{ memberId: "m1", memberName: "Alice", balance: 500 }],
      };

      getBalancesUseCase.execute.mockResolvedValue(response);

      const result = await controller.getBalances(groupId);

      expect(result.balances[0]).toHaveProperty("memberId");
      expect(result.balances[0]).toHaveProperty("memberName");
      expect(result.balances[0]).toHaveProperty("balance");
    });

    it("should handle different group IDs", async () => {
      const differentGroupId = "different-group-456";
      const response: GroupBalancesResponseDto = {
        groupId: differentGroupId,
        balances: [],
      };

      getBalancesUseCase.execute.mockResolvedValue(response);

      await controller.getBalances(differentGroupId);

      expect(getBalancesUseCase.execute).toHaveBeenCalledWith(differentGroupId);
    });

    it("should handle positive and negative balances", async () => {
      const response: GroupBalancesResponseDto = {
        groupId,
        balances: [
          { memberId: "m1", memberName: "Alice", balance: 1000 },
          { memberId: "m2", memberName: "Bob", balance: -500 },
          { memberId: "m3", memberName: "Charlie", balance: -500 },
        ],
      };

      getBalancesUseCase.execute.mockResolvedValue(response);

      const result = await controller.getBalances(groupId);

      const positiveBalances = result.balances.filter((b) => b.balance > 0);
      const negativeBalances = result.balances.filter((b) => b.balance < 0);

      expect(positiveBalances).toHaveLength(1);
      expect(negativeBalances).toHaveLength(2);
    });

    it("should handle zero balances", async () => {
      const response: GroupBalancesResponseDto = {
        groupId,
        balances: [
          { memberId: "m1", memberName: "Alice", balance: 0 },
          { memberId: "m2", memberName: "Bob", balance: 0 },
        ],
      };

      getBalancesUseCase.execute.mockResolvedValue(response);

      const result = await controller.getBalances(groupId);

      result.balances.forEach((balance) => {
        expect(balance.balance).toBe(0);
      });
    });
  });
});
