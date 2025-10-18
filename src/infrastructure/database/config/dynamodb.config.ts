import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { DynamoDBConfig } from "../interface/dynamoDBConfig";

export const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "ExpenseApp";

export class DynamoDBClientFactory {
  static create(config: DynamoDBConfig): DynamoDBDocumentClient {
    const isLocal =
      config.endpoint === "http://localhost:8000" || !config.credentials;

    const client = new DynamoDBClient({
      region: config.region,
      endpoint: config.endpoint,
      credentials: isLocal
        ? {
            accessKeyId: "dummy",
            secretAccessKey: "dummy",
          }
        : config.credentials,
    });

    return DynamoDBDocumentClient.from(client, {
      marshallOptions: {
        removeUndefinedValues: true,
        convertEmptyValues: false,
      },
      unmarshallOptions: {
        wrapNumbers: false,
      },
    });
  }
}
