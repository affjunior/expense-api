import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  DeleteTableCommand,
} from "@aws-sdk/client-dynamodb";

const isLocal =
  process.env.DYNAMODB_ENDPOINT === "http://localhost:8000" ||
  !process.env.AWS_ACCESS_KEY_ID;

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  endpoint: process.env.DYNAMODB_ENDPOINT || "http://localhost:8000",
  ...(isLocal && {
    credentials: {
      accessKeyId: "dummy",
      secretAccessKey: "dummy",
    },
  }),
});

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "ExpenseApp";

async function tableExists(tableName: string): Promise<boolean> {
  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }));
    return true;
  } catch (error: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (error.name === "ResourceNotFoundException") {
      return false;
    }
    throw error;
  }
}

async function deleteTable(tableName: string): Promise<void> {
  console.log(`Deleting table ${tableName}...`);
  await client.send(new DeleteTableCommand({ TableName: tableName }));
  console.log(`Table ${tableName} deleted successfully.`);
}

async function createTable(): Promise<void> {
  const command = new CreateTableCommand({
    TableName: TABLE_NAME,
    KeySchema: [
      { AttributeName: "PK", KeyType: "HASH" }, // Partition key
      { AttributeName: "SK", KeyType: "RANGE" }, // Sort key
    ],
    AttributeDefinitions: [
      { AttributeName: "PK", AttributeType: "S" },
      { AttributeName: "SK", AttributeType: "S" },
    ],
    BillingMode: "PAY_PER_REQUEST", // On-demand pricing
    Tags: [
      { Key: "Environment", Value: process.env.NODE_ENV || "development" },
      { Key: "Application", Value: "ExpenseAPI" },
    ],
  });

  console.log(`Creating table ${TABLE_NAME}...`);
  await client.send(command);
  console.log(`Table ${TABLE_NAME} created successfully!`);
}

async function main() {
  const args = process.argv.slice(2);
  const shouldRecreate = args.includes("--recreate");

  try {
    const exists = await tableExists(TABLE_NAME);

    if (exists) {
      if (shouldRecreate) {
        await deleteTable(TABLE_NAME);
        // Wait a bit for deletion to complete
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await createTable();
      } else {
        console.log(
          `Table ${TABLE_NAME} already exists. Use --recreate to delete and recreate.`,
        );
      }
    } else {
      await createTable();
    }

    console.log("\nTable Details:");
    console.log("==============");
    console.log(`Table Name: ${TABLE_NAME}`);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();
