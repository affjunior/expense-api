import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

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

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "ExpenseApp";

async function seedData() {
  const groupId = randomUUID();
  const aliceId = randomUUID();
  const bobId = randomUUID();
  const charlieId = randomUUID();
  const expense1Id = randomUUID();
  const expense2Id = randomUUID();

  const timestamp = new Date().toISOString();

  console.log("Seeding data...\n");
  console.log(`Group ID: ${groupId}`);
  console.log(`Alice ID: ${aliceId}`);
  console.log(`Bob ID: ${bobId}`);
  console.log(`Charlie ID: ${charlieId}\n`);

  // Group metadata
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `GROUP#${groupId}`,
        SK: "METADATA",
        type: "Group",
        groupId,
        name: "Trip to the Beach",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    }),
  );
  console.log("✓ Created group: Trip to the Beach");

  // Members
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `GROUP#${groupId}`,
        SK: `MEMBER#${aliceId}`,
        type: "Member",
        memberId: aliceId,
        name: "Alice",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    }),
  );
  console.log("✓ Added member: Alice");

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `GROUP#${groupId}`,
        SK: `MEMBER#${bobId}`,
        type: "Member",
        memberId: bobId,
        name: "Bob",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    }),
  );
  console.log("✓ Added member: Bob");

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `GROUP#${groupId}`,
        SK: `MEMBER#${charlieId}`,
        type: "Member",
        memberId: charlieId,
        name: "Charlie",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    }),
  );
  console.log("✓ Added member: Charlie");

  // Expenses
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `GROUP#${groupId}`,
        SK: `EXPENSE#${expense1Id}`,
        type: "Expense",
        expenseId: expense1Id,
        name: "Dinner",
        amountInCents: 9050,
        payerId: aliceId,
        participants: [aliceId, bobId, charlieId],
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    }),
  );
  console.log("✓ Added expense: Dinner ($90.50, paid by Alice)");

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `GROUP#${groupId}`,
        SK: `EXPENSE#${expense2Id}`,
        type: "Expense",
        expenseId: expense2Id,
        name: "Taxi",
        amountInCents: 3000,
        payerId: bobId,
        participants: [aliceId, bobId],
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    }),
  );
  console.log("✓ Added expense: Taxi ($30.00, paid by Bob)");

  console.log("\n✅ Data seeded successfully!");
  console.log(`\nTo query this group, use: GROUP#${groupId}`);
}

seedData().catch((error) => {
  console.error("Error seeding data:", error);
  process.exit(1);
});
