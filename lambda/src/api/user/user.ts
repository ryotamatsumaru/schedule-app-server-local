import { Hono } from "hono";
import { 
  PutCommand,
  GetCommand,
  QueryCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import {z} from "zod";
import { zValidator } from "@hono/zod-validator";
import { docClient } from "../../dynamoDB/client";

const TABLE_NAME = "User";
const PASS_INDEX = "PassIndex";

//カスタムZodスキーマ for YYYY-MM-DD形式の日付
const dateSchema = z.string().refine(
  (val) => {
    return /^\d{4}-\d{2}-\d{2}$/.test(val) && !isNaN(Date.parse(val));
  },
  {
    message: "Invalid date format. Use YYYY-MM-DD",
  }
);

//Zodスキーマの定義
const UserSchema = z.object({
  id: z.string().min(1).max(30),
  password: z.string().min(60).max(70),
  name: z.string().min(1).max(40),
  registdate: dateSchema.optional(),
});

const user = new Hono()
  .post("/", zValidator("json", UserSchema), async (c) => {
    const validateData = c.req.valid("json");
    const params = {
      TableName: TABLE_NAME,
      Item: {
        ...validateData,
      }
    }

    try {
      await docClient.send(new PutCommand(params));
      return c.json(
       {message: "user created successfully", user: params.Item},
      201);
    } catch(error) {
      console.log(error);
      return c.json({error: "Failed to create user"}, 500);
    }
  })
  .get("my/:password", async (c) =>{
    const password = c.req.param("password");
    const params = {
      TableName: TABLE_NAME,
      IndexName: PASS_INDEX,
      KeyConditionExpression: "password = :password",
      ExpressionAttributeValues: {
        ":password": password,
      }
    };

    try{
      const data = await docClient.send(new QueryCommand(params));
      return c.json(data.Items)
    } catch (error) {
      console.log(error);
      return c.json({error: "Failed to retrieve user"}, 500)
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
        return c.json({ error: "user not found" }, 404);
      }
    } catch (error) {
      console.log(error);
      return c.json({ error: "Failed to retrieve user" }, 500);
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
      return c.json({message: "user delete successfully"});
    } catch (error) {
      return c.json({error: "Failed to delete user"})
    }
  });

export {user};


