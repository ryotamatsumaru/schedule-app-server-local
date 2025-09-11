import {
  DynamoDBClient,
  ListTablesCommand,
  CreateTableCommand,
  CreateTableCommandInput,
} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { userParams } from "./table/userParams";
import { schedulesParams } from "./table/schedulesParam";

const devConfig = {
  endpoint: "http://localhost:8000",
  region: "ap-northeast-1",
  credentials: {
    accessKeyId: "fakeAccessKey",
    secretAccessKey: "fakeSecretAccesskey",
  },
};

const client = new DynamoDBClient(
  process.env.ENV === "development" ? devConfig: {}
);

const docClient = DynamoDBDocumentClient.from(client);

//テーブル作成
const createTable = async (param: CreateTableCommandInput, tableName: string) => {
  const params = param;
  try {
    await client.send(new CreateTableCommand(params));
    console.log(`${tableName} table created successfully`);
  } catch (err) {
    console.log(err)
  }
}

const checkTable = async () => {
  const {TableNames} = await client.send(new ListTablesCommand({}));
  let count = 0;
  const tableList = ["Schedule", "User"] 
  for(const list of tableList){
    if(!TableNames?.includes(list)) count++;
  }
  if(tableList.length === count) return true;
  return false;
}

//ローカルデータベース内にテーブル作成
const initializeDynamoDB = async () => {
  if(process.env.ENV === "development") {
    try {
      const {TableNames} = await client.send(new ListTablesCommand({}));
      const check = await checkTable();
      if(TableNames && check) {
        await createTable(userParams, "User");
        await createTable(schedulesParams, "Schedules");
      } else if(TableNames) {
        console.log("tables already exists");
      } else {
        console.log("Unable to list tables, creating tables");
        await createTable(userParams, "User");
        await createTable(schedulesParams, "Schedules");
      }
    } catch(err) {
      console.error("Error initializing DynamoDB:", err);
    }
  }
};

//テーブル初期化を実行
initializeDynamoDB();

export { docClient };