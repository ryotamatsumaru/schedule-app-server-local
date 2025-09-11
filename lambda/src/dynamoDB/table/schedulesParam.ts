import {
  KeyType,
  ScalarAttributeType,
  ProjectionType
} from "@aws-sdk/client-dynamodb";

export const schedulesParams = {
    TableName: "Schedules",
    KeySchema: [{AttributeName: "id", KeyType: KeyType.HASH}],
    AttributeDefinitions:[
      {AttributeName: "id", AttributeType: ScalarAttributeType.S},
      {AttributeName: "yearmonth", AttributeType: ScalarAttributeType.S}
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
    GlobalSecondaryIndexes: [
      {
        IndexName: "YearMonthIndex",
        KeySchema: [{AttributeName: "yearmonth", KeyType: KeyType.HASH}],
        Projection: {ProjectionType: ProjectionType.ALL},
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
    ],
  };