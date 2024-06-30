import "dotenv/config";
import express from "express";
import { Request, Response } from "express";
import bodyParser from "body-parser";
import cors from "cors";

import dbRouter from "./routes/mongoAPI";
import llmRouter from "./routes/llmAPI";
import userRouter from "./routes/userAPI";
import authenticateToken from "./middlewares/authenticateToken";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

app.use("/db", authenticateToken, dbRouter);
app.use("/llm", authenticateToken, llmRouter);
app.use("/user", userRouter);

app.get("/", (req: Request, res: Response) => {
  res.send("Chat ITP server is running!");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
