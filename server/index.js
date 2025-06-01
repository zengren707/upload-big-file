import express from "express";
import logger from "morgan";
import { StatusCodes } from "http-status-codes";
import cors from "cors";
import path, { resolve } from "node:path";
import fs from "fs-extra";
import { rejects } from "node:assert";

const app = express();
fs.ensureDirSync(path.resolve(process.cwd(), "public"));
app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.resolve(process.cwd(), "public")));

app.post("/upload", async (req, res, next) => {
  const { chunkName } = req.query;
  const { start } = req.query;
  console.log(start);
  const chunkDir = path.resolve(process.cwd(), "temp");
  fs.ensureDirSync(chunkDir);
  const chunkFilePath = path.resolve(chunkDir, chunkName);
  const ws = fs.createWriteStream(chunkFilePath, {
    start: Number(start),
    flags: "a",
  });
  req.on("aborted", () => {
    ws.close();
  });
  try {
    await pipeStream(req, ws);
  } catch (error) {
    next(error);
  }
  res.send("upload ok");
});
app.get("/merge/:fileName", async (req, res, next) => {
  const { fileName } = req.params;
  try {
    await mergeChunks(fileName);
  } catch (error) {
    next(error);
  }

  res.send("merge ok");
});
app.get("/verify/:fileName", async (req, res, next) => {
  const { fileName } = req.params;
  const filePath = path.resolve(process.cwd(), "public", fileName);
  const isExist = await fs.pathExists(filePath);
  let uploadedList = [];
  if (isExist) {
    return res.json({ success: true, needUpload: false });
  }
  const chunksDir = path.resolve(process.cwd(), "temp");
  const isExitsTemp = await fs.pathExists(chunksDir);
  if (isExitsTemp) {
    const chunks = await fs.readdir(chunksDir);

    uploadedList = await Promise.all(
      chunks.map(async function (chunk) {
        const { size } = await fs.stat(path.resolve(chunksDir, chunk));
        console.log("size", size);
        return { chunkFileName: chunk, size };
      })
    );
  }
  res.json({ success: true, needUpload: true, uploadedList });
});
app.listen(8080, () => {
  console.log("start on 8080...");
});
function pipeStream(req, ws) {
  return new Promise((resolve, reject) => {
    req.pipe(ws).on("finish", resolve).on("error", reject);
  });
}
async function mergeChunks(fileName) {
  const mergedFilePath = path.resolve(process.cwd(), "public", `${fileName}`);
  const chunkDir = path.resolve(process.cwd(), "temp");
  const chunks = await fs.readdir(chunkDir);
  chunks.sort((a, b) => a - b);
  try {
    const pipes = chunks.map((chunk, idx) => {
      return pipeStream(
        fs.createReadStream(path.resolve(chunkDir, chunk), { autoClose: true }),
        fs.createWriteStream(mergedFilePath, { start: idx * 1024 * 1024 * 2 })
      );
    });
    await Promise.all(pipes);
    await fs.rm(chunkDir, { recursive: true });
  } catch (error) {
    return error;
  }
}
