import express from "express";
import logger from "morgan";
import { StatusCodes } from "http-status-codes";
import cors from "cors";
import path from "node:path";
import fs from "fs-extra";

const app = express();
fs.ensureDirSync(path.resolve(process.cwd(), "public"));
app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.resolve(process.cwd(), "public")));

app.post("/upload", (req, res, next) => {
  res.send("upload ok");
});
app.get("/merge", (req, res, next) => {
  res.send("merge ok");
});
app.listen(8080, () => {
  console.log("start on 8080...");
});
