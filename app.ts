import express from "express";
import { homeRoute } from "./routes/home";
import { imageRoute } from "./routes/image";
import { urlRoute } from "./routes/url";
import path from "path";
import dotenv from "dotenv-flow";
dotenv.config();

const app = express();
const port = process.env.PORT;

app.get("/", homeRoute);
app.get("/favicon.ico", (req, res) => {
  return res.sendFile(path.join(__dirname, "assets/favicon.ico"));
});
app.get("/img/*", imageRoute);
app.get("/*", urlRoute);

app.listen(port, () => {
  console.log(`Launched on port ${port}`);
});
