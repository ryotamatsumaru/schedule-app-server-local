import { Hono } from "hono";
import { ReturnValue } from "@aws-sdk/client-dynamodb";
import { 
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import {z} from "zod";
import { zValidator } from "@hono/zod-validator";
import { v4 as uuidv4} from "uuid";
import { docClient } from "../../dynamoDB/client";

type ExpressionAttributeValues = { [key: string]: any };
type ExpressionAttributeNames = { [key: string]: string };

const TABLE_NAME = "Schedules";
const YEAR_MONTH_INDEX = "YearMonthIndex";

//カスタムZodスキーマ for YYYY-MM-DD形式の日付
const dateSchema = z.string().refine(
  (val) => {
    return /^\d{4}-\d{2}-\d{2}$/.test(val) && !isNaN(Date.parse(val));
  },
  {
    message: "Invalid date format. Use YYYY-MM-DD",
  }
);

const yearMonthSchema = z.string().refine(
  (val) => {
    return /^\d{4}-\d{2}$/.test(val) && !isNaN(Date.parse(val));
  },
  {
    message: "Invalid date format. Use YYYY-MM",
  }
);

const timeSchema = z.string().refine(
  (val) => {
    return /^\d{2}:\d{2}$/.test(val);
  },
  {
    message: "Invalid time format. Use HH:MM",
  }
);

//Zodスキーマの定義
const SchedulesSchema = z.object({
  title: z.string().min(1).max(40),
  yearmonth: yearMonthSchema.optional(),
  starttime: timeSchema.optional(),
  startindex: z.number().int().max(48),
  endtime: timeSchema.optional(),
  endindex: z.number().int().max(48),
  registdate: dateSchema.optional(),
  memo: z.string().max(400),
  type: z.string().max(10)
});

const ScheduleUpdateSchema = SchedulesSchema

const schedules = new Hono()
  .post("/", zValidator("json", SchedulesSchema), async (c) => {
    const validateData = c.req.valid("json");
    const params = {
      TableName: TABLE_NAME,
      Item: {
        id: uuidv4(),
        ...validateData,
      }
    }

    try {
      await docClient.send(new PutCommand(params));
      return c.json(
       {message: "schedule created successfully", schedule: params.Item},
      201);
    } catch(error) {
      console.log(error);
      return c.json({error: "Failed to create scheduel"}, 500);
    }
  })
  .get("ym/:yearmonth", async (c) =>{
    const yearMonth = c.req.param("yearmonth");
    const params = {
      TableName: TABLE_NAME,
      IndexName: YEAR_MONTH_INDEX,
      KeyConditionExpression: "yearmonth = :yearmonth",
      ExpressionAttributeValues: {
        ":yearmonth": yearMonth,
      }
    };

    try{
      const data = await docClient.send(new QueryCommand(params));
      return c.json(data.Items)
    } catch (error) {
      console.log(error);
      return c.json({error: "Failed to retrieve schedule"}, 500)
    }
  })
  .get("/:id", async (c) => {
    const id = c.req.param("id");
    const params = {
      TableName: TABLE_NAME,
      Key: { id },
    };

    try {
      const data = await docClient.send(new GetCommand(params));
      if (data.Item) {
        return c.json(data.Item);
      } else {
        return c.json({ error: "schedule not found" }, 404);
      }
    } catch (error) {
      console.log(error);
      return c.json({ error: "Failed to retrieve schedule" }, 500);
    }
  })
  .put("/:id", zValidator("json", ScheduleUpdateSchema), async (c) => {
    const id = c.req.param("id");
    const validatedData = c.req.valid("json");

    const updateExpressions: string[] = [];
    const expressionAttributeValues: ExpressionAttributeValues = {};
    const expressionAttributeNames: ExpressionAttributeNames = {};

    Object.entries(validatedData).forEach(([key, value]) => {
      updateExpressions.push(`#${key} = :${key}`);
      expressionAttributeValues[`:${key}`] = value;
      expressionAttributeNames[`#${key}`] = key;
    });

    const params = {
      TableName: TABLE_NAME,
      Key: { id },
      UpdateExpression: `set ${updateExpressions.join(", ")}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: expressionAttributeNames,
      ReturnValues: ReturnValue.ALL_NEW,
    };

    try {
      const data = await docClient.send(new UpdateCommand(params));
      return c.json(data.Attributes);
    } catch (error) {
      console.log(error);
      return c.json({ error: "Failed to update todo" }, 500);
    }
  })
  .delete("/:id", async (c) => {
    const id = c.req.param("id");
    const params = {
      TableName: TABLE_NAME,
      Key: {id},
    };

    try {
      await docClient.send(new DeleteCommand(params));
      return c.json({message: "schedule delete successfully"});
    } catch (error) {
      return c.json({error: "Failed to delete schedule"})
    }
  });

export {schedules};


