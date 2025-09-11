import {
  KeyType,
  ScalarAttributeType,
  ProjectionType
} from "@aws-sdk/client-dynamodb";

  export const userParams = {
    TableName: "User",
    KeySchema: [{AttributeName: "id", KeyType: KeyType.HASH}],
    AttributeDefinitions:[
      {AttributeName: "id", AttributeType: ScalarAttributeType.S}
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 2,
      WriteCapacityUnits: 2,
    }
  };