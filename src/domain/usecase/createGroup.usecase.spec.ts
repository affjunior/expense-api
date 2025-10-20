/* eslint-disable @typescript-eslint/unbound-method */

import { Test, TestingModule } from "@nestjs/testing";
import { CreateGroupUseCase } from "./createGroup.usecase";
import type { IGroupRepository } from "@infrastructure/repository/interface/groupRepository";
import { CreateGroupDto } from "@application/dto/in/createGroupDto";
import { Group } from "@domain/entities/group";
import { Member } from "@domain/entities/member";

describe("CreateGroupUseCase", () => {
  let useCase: CreateGroupUseCase;
  let groupRepository: jest.Mocked<IGroupRepository>;

  beforeEach(async () => {
    const mockGroupRepository: Partial<jest.Mocked<IGroupRepository>> = {
      save: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateGroupUseCase,
        {
          provide: "IGroupRepository",
          useValue: mockGroupRepository,
        },
      ],
    }).compile();

    useCase = module.get<CreateGroupUseCase>(CreateGroupUseCase);
    groupRepository = module.get("IGroupRepository");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("execute", () => {
    it("should create a group successfully", async () => {
      const dto: CreateGroupDto = {
        name: "Trip to Europe",
      };

      const savedGroup = new Group("group-123", "Trip to Europe");
      savedGroup.addMember(new Member("member-1", "Alice"));
      savedGroup.addMember(new Member("member-2", "Bob"));

      groupRepository.save.mockResolvedValue(savedGroup);

      const result = await useCase.execute(dto);

      expect(result).toBeDefined();
      expect(result.name).toBe("Trip to Europe");
      expect(result.members).toHaveLength(2);
      expect(result.members[0].id).toBe("member-1");
      expect(result.members[0].name).toBe("Alice");
      expect(result.members[1].id).toBe("member-2");
      expect(result.members[1].name).toBe("Bob");
    });

    it("should call repository save with correct group", async () => {
      const dto: CreateGroupDto = {
        name: "Test Group",
      };

      const savedGroup = new Group("group-id", "Test Group");

      groupRepository.save.mockResolvedValue(savedGroup);

      await useCase.execute(dto);

      expect(groupRepository.save).toHaveBeenCalledTimes(1);
      expect(groupRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Test Group",
          members: [],
        }),
      );
    });

    it("should generate UUID for new group", async () => {
      const dto: CreateGroupDto = {
        name: "Test Group",
      };

      const savedGroup = new Group("generated-uuid", "Test Group");
      groupRepository.save.mockResolvedValue(savedGroup);

      const result = await useCase.execute(dto);

      expect(result.id).toBeDefined();
      expect(result.id).toBe("generated-uuid");
    });

    it("should handle group with no members", async () => {
      const dto: CreateGroupDto = {
        name: "Solo Group",
      };

      const savedGroup = new Group("group-id", "Solo Group");
      groupRepository.save.mockResolvedValue(savedGroup);

      const result = await useCase.execute(dto);

      expect(result.members).toHaveLength(0);
      expect(result.members).toEqual([]);
    });

    it("should handle group with multiple members", async () => {
      const dto: CreateGroupDto = {
        name: "Large Group",
      };

      const members = [
        { id: "m1", name: "Alice" },
        { id: "m2", name: "Bob" },
        { id: "m3", name: "Charlie" },
        { id: "m4", name: "David" },
      ];

      const savedGroup = new Group("group-id", "Large Group");
      members.forEach((m: { id: string; name: string }) =>
        savedGroup.addMember(new Member(m.id, m.name)),
      );

      groupRepository.save.mockResolvedValue(savedGroup);

      const result = await useCase.execute(dto);

      expect(result.members).toHaveLength(4);
    });

    it("should return GroupResponseDto with correct structure", async () => {
      const dto: CreateGroupDto = {
        name: "Test Group",
      };

      const savedGroup = new Group("group-id", "Test Group");
      savedGroup.addMember(new Member("m1", "Alice"));

      groupRepository.save.mockResolvedValue(savedGroup);

      const result = await useCase.execute(dto);

      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("name");
      expect(result).toHaveProperty("members");
      expect(result).toHaveProperty("expenses");
      expect(result.id).toBe("group-id");
      expect(result.name).toBe("Test Group");
    });

    it("should create group with empty expenses array", async () => {
      const dto: CreateGroupDto = {
        name: "New Group",
      };

      const savedGroup = new Group("group-id", "New Group");
      groupRepository.save.mockResolvedValue(savedGroup);

      const result = await useCase.execute(dto);

      expect(result.expenses).toHaveLength(0);
      expect(result.expenses).toEqual([]);
    });

    it("should propagate repository errors", async () => {
      const dto: CreateGroupDto = {
        name: "Test Group",
      };

      const error = new Error("Database connection failed");
      groupRepository.save.mockRejectedValue(error);

      await expect(useCase.execute(dto)).rejects.toThrow(
        "Database connection failed",
      );
    });

    it("should handle special characters in group name", async () => {
      const dto: CreateGroupDto = {
        name: "Trip to Tōkyō & Paris (2024)",
      };

      const savedGroup = new Group("group-id", "Trip to Tōkyō & Paris (2024)");
      groupRepository.save.mockResolvedValue(savedGroup);

      const result = await useCase.execute(dto);

      expect(result.name).toBe("Trip to Tōkyō & Paris (2024)");
    });

    it("should handle special characters in member names", async () => {
      const dto: CreateGroupDto = {
        name: "Test Group",
      };

      const savedGroup = new Group("group-id", "Test Group");
      savedGroup.addMember(new Member("m1", "José García"));
      savedGroup.addMember(new Member("m2", "François Müller"));

      groupRepository.save.mockResolvedValue(savedGroup);

      const result = await useCase.execute(dto);

      expect(result.members[0].name).toBe("José García");
      expect(result.members[1].name).toBe("François Müller");
    });

    it("should preserve member order", async () => {
      const dto: CreateGroupDto = {
        name: "Test Group",
      };

      const members = [
        { id: "m1", name: "Alice" },
        { id: "m2", name: "Bob" },
        { id: "m3", name: "Charlie" },
      ];

      const savedGroup = new Group("group-id", "Test Group");
      members.forEach((m: { id: string; name: string }) =>
        savedGroup.addMember(new Member(m.id, m.name)),
      );

      groupRepository.save.mockResolvedValue(savedGroup);

      const result = await useCase.execute(dto);

      expect(result.members[0].id).toBe("m1");
      expect(result.members[1].id).toBe("m2");
      expect(result.members[2].id).toBe("m3");
    });
  });
});
