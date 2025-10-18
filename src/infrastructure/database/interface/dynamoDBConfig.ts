export interface DynamoDBConfig {
  region: string;
  endpoint?: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}
