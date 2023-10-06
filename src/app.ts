import express from "express";
import { imageRoute } from "./routes/image";
import { urlRoute } from "./routes/url";
import path from "path";
import dotenv from "dotenv-flow";
import { withTiming } from "./util/logger";
dotenv.config();

const app = express();
const port = process.env.PORT;

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../assets/index.html"));
});
app.use("/assets", express.static(path.join(__dirname, "../assets")));
app.get("/favicon.ico", (req, res) => {
  return res.sendFile(path.join(__dirname, "../assets/favicon.ico"));
});
app.get("/img/*", withTiming("imageRoute", imageRoute));
app.get("/*", withTiming("urlRoute", urlRoute));

app.listen(port, () => {
  console.log(`Launched on port ${port}`);
});
