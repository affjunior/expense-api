/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClientFactory, TABLE_NAME } from "./dynamodb.config";
import { DynamoDBConfig } from "../interface/dynamoDBConfig";

// Mock AWS SDK
jest.mock("@aws-sdk/client-dynamodb");
jest.mock("@aws-sdk/lib-dynamodb");

describe("DynamoDBClientFactory", () => {
  let mockDynamoDBClient: jest.Mocked<DynamoDBClient>;
  let mockDocumentClient: jest.Mocked<DynamoDBDocumentClient>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDynamoDBClient = {} as jest.Mocked<DynamoDBClient>;
    mockDocumentClient = {} as jest.Mocked<DynamoDBDocumentClient>;

    (
      DynamoDBClient as jest.MockedClass<typeof DynamoDBClient>
    ).mockImplementation(() => mockDynamoDBClient);
    (DynamoDBDocumentClient.from as jest.Mock).mockReturnValue(
      mockDocumentClient,
    );
  });

  describe("create", () => {
    it("should create DynamoDB client with local configuration", () => {
      const config: DynamoDBConfig = {
        region: "us-east-1",
        endpoint: "http://localhost:8000",
      };

      const client = DynamoDBClientFactory.create(config);

      expect(DynamoDBClient).toHaveBeenCalledWith({
        region: "us-east-1",
        endpoint: "http://localhost:8000",
        credentials: {
          accessKeyId: "dummy",
          secretAccessKey: "dummy",
        },
      });
      expect(client).toBe(mockDocumentClient);
    });

    it("should create DynamoDB client with AWS credentials", () => {
      const config: DynamoDBConfig = {
        region: "us-west-2",
        endpoint: "https://dynamodb.us-west-2.amazonaws.com",
        credentials: {
          accessKeyId: "AKIAIOSFODNN7EXAMPLE",
          secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
        },
      };

      const client = DynamoDBClientFactory.create(config);

      expect(DynamoDBClient).toHaveBeenCalledWith({
        region: "us-west-2",
        endpoint: "https://dynamodb.us-west-2.amazonaws.com",
        credentials: {
          accessKeyId: "AKIAIOSFODNN7EXAMPLE",
          secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
        },
      });
      expect(client).toBe(mockDocumentClient);
    });

    it("should use dummy credentials when no credentials provided", () => {
      const config: DynamoDBConfig = {
        region: "eu-west-1",
        endpoint: "https://dynamodb.eu-west-1.amazonaws.com",
      };

      DynamoDBClientFactory.create(config);

      expect(DynamoDBClient).toHaveBeenCalledWith({
        region: "eu-west-1",
        endpoint: "https://dynamodb.eu-west-1.amazonaws.com",
        credentials: {
          accessKeyId: "dummy",
          secretAccessKey: "dummy",
        },
      });
    });

    it("should detect local environment by endpoint", () => {
      const config: DynamoDBConfig = {
        region: "us-east-1",
        endpoint: "http://localhost:8000",
        credentials: {
          accessKeyId: "real-key",
          secretAccessKey: "real-secret",
        },
      };

      DynamoDBClientFactory.create(config);

      // Should use dummy credentials because endpoint is localhost
      expect(DynamoDBClient).toHaveBeenCalledWith({
        region: "us-east-1",
        endpoint: "http://localhost:8000",
        credentials: {
          accessKeyId: "dummy",
          secretAccessKey: "dummy",
        },
      });
    });

    it("should configure DocumentClient with correct marshall options", () => {
      const config: DynamoDBConfig = {
        region: "us-east-1",
        endpoint: "http://localhost:8000",
      };

      DynamoDBClientFactory.create(config);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(DynamoDBDocumentClient.from).toHaveBeenCalledWith(
        mockDynamoDBClient,
        {
          marshallOptions: {
            removeUndefinedValues: true,
            convertEmptyValues: false,
          },
          unmarshallOptions: {
            wrapNumbers: false,
          },
        },
      );
    });

    it("should configure DocumentClient with correct unmarshall options", () => {
      const config: DynamoDBConfig = {
        region: "ap-southeast-1",
        endpoint: "https://dynamodb.ap-southeast-1.amazonaws.com",
        credentials: {
          accessKeyId: "test-key",
          secretAccessKey: "test-secret",
        },
      };

      DynamoDBClientFactory.create(config);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(DynamoDBDocumentClient.from).toHaveBeenCalledWith(
        mockDynamoDBClient,

        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          unmarshallOptions: expect.objectContaining({
            wrapNumbers: false,
          }),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          marshallOptions: expect.objectContaining({
            removeUndefinedValues: true,
            convertEmptyValues: false,
          }),
        }),
      );
    });

    it("should handle different AWS regions", () => {
      const regions = [
        "us-east-1",
        "us-west-2",
        "eu-west-1",
        "ap-southeast-1",
        "sa-east-1",
      ];

      for (const region of regions) {
        jest.clearAllMocks();
        const config: DynamoDBConfig = {
          region,
          endpoint: `https://dynamodb.${region}.amazonaws.com`,
        };

        DynamoDBClientFactory.create(config);

        expect(DynamoDBClient).toHaveBeenCalledWith(
          expect.objectContaining({
            region,
          }),
        );
      }
    });

    it("should create new client instance on each call", () => {
      const config: DynamoDBConfig = {
        region: "us-east-1",
        endpoint: "http://localhost:8000",
      };

      DynamoDBClientFactory.create(config);
      DynamoDBClientFactory.create(config);

      expect(DynamoDBClient).toHaveBeenCalledTimes(2);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(DynamoDBDocumentClient.from).toHaveBeenCalledTimes(2);
    });

    it("should handle custom endpoint formats", () => {
      const config: DynamoDBConfig = {
        region: "us-east-1",
        endpoint: "http://dynamodb-local:8000",
        credentials: {
          accessKeyId: "test",
          secretAccessKey: "test",
        },
      };

      DynamoDBClientFactory.create(config);

      expect(DynamoDBClient).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: "http://dynamodb-local:8000",
        }),
      );
    });

    it("should preserve session token in credentials if provided", () => {
      const config: DynamoDBConfig = {
        region: "us-east-1",
        endpoint: "https://dynamodb.us-east-1.amazonaws.com",
        credentials: {
          accessKeyId: "ASIA...",
          secretAccessKey: "secret",
          sessionToken: "session-token-123",
        },
      };

      DynamoDBClientFactory.create(config);

      expect(DynamoDBClient).toHaveBeenCalledWith(
        expect.objectContaining({
          credentials: {
            accessKeyId: "ASIA...",
            secretAccessKey: "secret",
            sessionToken: "session-token-123",
          },
        }),
      );
    });
  });

  describe("TABLE_NAME", () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it("should use default table name when env var not set", () => {
      delete process.env.DYNAMODB_TABLE_NAME;
      expect(TABLE_NAME).toBeDefined();
    });

    it("should be a non-empty string", () => {
      expect(typeof TABLE_NAME).toBe("string");
      expect(TABLE_NAME.length).toBeGreaterThan(0);
    });
  });
});

describe("DynamoDBConfig Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should handle minimal configuration", () => {
    const config: DynamoDBConfig = {
      region: "us-east-1",
    };

    const client = DynamoDBClientFactory.create(config);

    expect(client).toBeDefined();
    expect(DynamoDBClient).toHaveBeenCalled();
  });

  it("should handle full configuration", () => {
    const config: DynamoDBConfig = {
      region: "us-east-1",
      endpoint: "https://dynamodb.us-east-1.amazonaws.com",
      credentials: {
        accessKeyId: "AKIAIOSFODNN7EXAMPLE",
        secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
        sessionToken: "session-token",
      },
    };

    const client = DynamoDBClientFactory.create(config);

    expect(client).toBeDefined();
    expect(DynamoDBClient).toHaveBeenCalledWith(
      expect.objectContaining({
        region: config.region,
        endpoint: config.endpoint,
        credentials: config.credentials,
      }),
    );
  });
});
