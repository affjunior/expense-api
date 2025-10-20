/* eslint-disable @typescript-eslint/unbound-method */

import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { GroupController } from "./group.controller";
import { CreateGroupUseCase } from "@domain/usecase/createGroup.usecase";
import { AddExpenseUseCase } from "@domain/usecase/addExpense.usecase";
import { AddMemberUseCase } from "@domain/usecase/addMember.usecase";
import { GetBalancesUseCase } from "@domain/usecase/getBalances.usecase";
import { CreateGroupDto } from "@application/dto/in/createGroupDto";
import { CreateExpenseDto } from "@application/dto/in/createExpenseDto";
import { GroupResponseDto } from "@application/dto/out/groupResponseDto";
import { Group } from "@domain/entities/group";

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

    const mockAddMemberUseCase = {
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
          provide: AddMemberUseCase,
          useValue: mockAddMemberUseCase,
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
      expect(createGroupUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          name: dto.name,
        }),
      );
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

      expect(createGroupUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          name: dto.name,
        }),
      );
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
        members: dto.members as Array<{ id: string; name: string }>,
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
            amount: 50,
            amountInCents: 5000,
            currencyCode: "USD",
          },
        ],
      };

      addExpenseUseCase.execute.mockResolvedValue(expectedResponse);

      const result = await controller.addExpense(groupId, dto);

      expect(result).toEqual(expectedResponse);
      expect(addExpenseUseCase.execute).toHaveBeenCalledTimes(1);
      expect(addExpenseUseCase.execute).toHaveBeenCalledWith(
        groupId,
        expect.objectContaining({
          name: dto.name,
        }),
      );
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

      expect(addExpenseUseCase.execute).toHaveBeenCalledWith(
        groupId,
        expect.objectContaining({
          name: dto.name,
        }),
      );
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

    it("should handle expense with large amounts", async () => {
      const dto: CreateExpenseDto = {
        name: "Group Dinner",
        amount: 90,
        currencyCode: "USD",
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
            amount: 90,
            amountInCents: 9000,
            currencyCode: "USD",
          },
        ],
      };

      addExpenseUseCase.execute.mockResolvedValue(response);

      const result = await controller.addExpense(groupId, dto);

      expect(result.expenses[0].amountInCents).toBe(9000);
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
        expect.objectContaining({
          name: dto.name,
        }),
      );
    });
  });

  describe("getBalances", () => {
    const groupId = "group-123";

    it("should get balances for group successfully", async () => {
      const balanceDto = { currencyCode: "USD" };

      const mockGroup = {
        id: groupId,
        name: "Trip",
        members: [
          { id: "m1", name: "Alice" },
          { id: "m2", name: "Bob" },
        ],
        expenses: [
          { id: "e1", name: "Test", amountInCents: 2000, currencyCode: "USD" },
        ],
        getBalances: jest.fn().mockReturnValue(
          new Map([
            ["m1", 1000],
            ["m2", -1000],
          ]),
        ),
      };

      getBalancesUseCase.execute.mockResolvedValue(
        mockGroup as unknown as Group,
      );

      const result = await controller.getBalances(groupId, balanceDto);

      expect(result).toHaveProperty("groupId");
      expect(result).toHaveProperty("balances");
      expect(getBalancesUseCase.execute).toHaveBeenCalledTimes(1);
      expect(getBalancesUseCase.execute).toHaveBeenCalledWith(
        expect.any(Object),
        groupId,
      );
    });

    it("should pass groupId to use case correctly", async () => {
      const balanceDto = { currencyCode: "USD" };
      const mockGroup = {
        id: groupId,
        name: "Trip",
        members: [{ id: "m1", name: "Alice" }],
        expenses: [
          { id: "e1", name: "Test", amountInCents: 2000, currencyCode: "USD" },
        ],
        getBalances: jest.fn().mockReturnValue(new Map([["m1", 0]])),
      };

      getBalancesUseCase.execute.mockResolvedValue(
        mockGroup as unknown as Group,
      );

      await controller.getBalances(groupId, balanceDto);

      expect(getBalancesUseCase.execute).toHaveBeenCalledWith(
        expect.any(Object),
        groupId,
      );
    });

    it("should return GroupBalancesResponseDto", async () => {
      const balanceDto = { currencyCode: "USD" };
      const mockGroup = {
        id: groupId,
        name: "Trip",
        members: [{ id: "m1", name: "Alice" }],
        expenses: [
          { id: "e1", name: "Test", amountInCents: 2000, currencyCode: "USD" },
        ],
        getBalances: jest.fn().mockReturnValue(new Map([["m1", 0]])),
      };

      getBalancesUseCase.execute.mockResolvedValue(
        mockGroup as unknown as Group,
      );

      const result = await controller.getBalances(groupId, balanceDto);

      expect(result).toHaveProperty("groupId");
      expect(result).toHaveProperty("balances");
      expect(Array.isArray(result.balances)).toBe(true);
    });

    it("should throw NotFoundException when group not found", async () => {
      const balanceDto = { currencyCode: "USD" };
      getBalancesUseCase.execute.mockRejectedValue(
        new NotFoundException(`Group with ID ${groupId} not found`),
      );

      await expect(controller.getBalances(groupId, balanceDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should propagate errors from use case", async () => {
      const balanceDto = { currencyCode: "USD" };
      const error = new Error("Database error");
      getBalancesUseCase.execute.mockRejectedValue(error);

      await expect(controller.getBalances(groupId, balanceDto)).rejects.toThrow(
        "Database error",
      );
    });

    it("should handle empty balances", async () => {
      const balanceDto = { currencyCode: "USD" };
      const mockGroup = {
        id: groupId,
        name: "Trip",
        members: [{ id: "m1", name: "Alice" }],
        expenses: [
          { id: "e1", name: "Test", amountInCents: 2000, currencyCode: "USD" },
        ],
        getBalances: jest.fn().mockReturnValue(new Map([["m1", 0]])),
      };

      getBalancesUseCase.execute.mockResolvedValue(
        mockGroup as unknown as Group,
      );

      const result = await controller.getBalances(groupId, balanceDto);

      expect(result.balances).toBeDefined();
    });

    it("should handle multiple balances", async () => {
      const balanceDto = { currencyCode: "USD" };
      const mockGroup = {
        id: groupId,
        name: "Trip",
        members: [
          { id: "m1", name: "Alice" },
          { id: "m2", name: "Bob" },
          { id: "m3", name: "Charlie" },
        ],
        expenses: [
          { id: "e1", name: "Test", amountInCents: 2000, currencyCode: "USD" },
        ],
        getBalances: jest.fn().mockReturnValue(
          new Map([
            ["m1", 2000],
            ["m2", -400],
            ["m3", -1600],
          ]),
        ),
      };

      getBalancesUseCase.execute.mockResolvedValue(
        mockGroup as unknown as Group,
      );

      const result = await controller.getBalances(groupId, balanceDto);

      expect(result.balances).toHaveLength(3);
    });

    it("should include all balance properties", async () => {
      const balanceDto = { currencyCode: "USD" };
      const mockGroup = {
        id: groupId,
        name: "Trip",
        members: [{ id: "m1", name: "Alice" }],
        expenses: [
          { id: "e1", name: "Test", amountInCents: 2000, currencyCode: "USD" },
        ],
        getBalances: jest.fn().mockReturnValue(new Map([["m1", 500]])),
      };

      getBalancesUseCase.execute.mockResolvedValue(
        mockGroup as unknown as Group,
      );

      const result = await controller.getBalances(groupId, balanceDto);

      expect(result.balances[0]).toHaveProperty("memberId");
      expect(result.balances[0]).toHaveProperty("memberName");
      expect(result.balances[0]).toHaveProperty("balance");
    });

    it("should handle different group IDs", async () => {
      const balanceDto = { currencyCode: "USD" };
      const differentGroupId = "different-group-456";
      const mockGroup = {
        id: differentGroupId,
        name: "Trip",
        members: [{ id: "m1", name: "Alice" }],
        expenses: [
          { id: "e1", name: "Test", amountInCents: 2000, currencyCode: "USD" },
        ],
        getBalances: jest.fn().mockReturnValue(new Map([["m1", 0]])),
      };

      getBalancesUseCase.execute.mockResolvedValue(
        mockGroup as unknown as Group,
      );

      await controller.getBalances(differentGroupId, balanceDto);

      expect(getBalancesUseCase.execute).toHaveBeenCalledWith(
        expect.any(Object),
        differentGroupId,
      );
    });

    it("should handle positive and negative balances", async () => {
      const balanceDto = { currencyCode: "USD" };
      const mockGroup = {
        id: groupId,
        name: "Trip",
        members: [
          { id: "m1", name: "Alice" },
          { id: "m2", name: "Bob" },
          { id: "m3", name: "Charlie" },
        ],
        expenses: [
          { id: "e1", name: "Test", amountInCents: 2000, currencyCode: "USD" },
        ],
        getBalances: jest.fn().mockReturnValue(
          new Map([
            ["m1", 1000],
            ["m2", -500],
            ["m3", -500],
          ]),
        ),
      };

      getBalancesUseCase.execute.mockResolvedValue(
        mockGroup as unknown as Group,
      );

      const result = await controller.getBalances(groupId, balanceDto);

      const positiveBalances = result.balances.filter((b) => b.balance > 0);
      const negativeBalances = result.balances.filter((b) => b.balance < 0);

      expect(positiveBalances).toHaveLength(1);
      expect(negativeBalances).toHaveLength(2);
    });

    it("should handle zero balances", async () => {
      const balanceDto = { currencyCode: "USD" };
      const mockGroup = {
        id: groupId,
        name: "Trip",
        members: [
          { id: "m1", name: "Alice" },
          { id: "m2", name: "Bob" },
        ],
        expenses: [
          { id: "e1", name: "Test", amountInCents: 2000, currencyCode: "USD" },
        ],
        getBalances: jest.fn().mockReturnValue(
          new Map([
            ["m1", 0],
            ["m2", 0],
          ]),
        ),
      };

      getBalancesUseCase.execute.mockResolvedValue(
        mockGroup as unknown as Group,
      );

      const result = await controller.getBalances(groupId, balanceDto);

      result.balances.forEach((balance) => {
        expect(balance.balance).toBe(0);
      });
    });
  });
});
