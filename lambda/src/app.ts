import {Hono} from "hono";
import {logger} from "hono/logger";
import { basicAuth } from "hono/basic-auth";
import { schedules } from "./api/schedules/schedules";
import { user } from "./api/user/user";
import { cors } from "hono/cors";
// import { secureHeaders } from "hono/secure-headers";

const app = new Hono();

//ログの設定
app.use("*", logger())

app.use(
  "*",
	cors({
		origin: "*",
		allowHeaders: ["Content-Type", "Authorization"],
		allowMethods: ["POST", "GET", "OPTIONS", "PUT", "DELETE"],
		exposeHeaders: ["Content-Length"],
		maxAge: 600,
		credentials: true,
	}),
);

app.use(
  "*",
  basicAuth({
    username: process.env.BASIC_USERNAME ? process.env.BASIC_USERNAME : "",
    password: process.env.BASIC_PASSWORD ? process.env.BASIC_PASSWORD : "",
  })
);


app.options('*', cors({
  origin: '*'
}))

app.route("/api/schedules", schedules);
app.route("/api/user", user);

export default app;