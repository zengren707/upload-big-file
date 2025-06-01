import { InboxOutlined } from "@ant-design/icons";
import "./FileUploader.css";
import { useRef } from "react";
import useDrag from "./useDrag";
import { Button } from "antd";
import axiosInstance from "./axiosInstance";

function FileUploader() {
  const uploadContainerRef = useRef(null);
  const { selecteFile, filePreview } = useDrag(uploadContainerRef);
  const handlerUpload = async () => {
    if (!selecteFile) {
      console.log("not choose file still");
      return;
    }

    const fileName = await getFileName(selecteFile);
    await uploadFile(selecteFile, fileName);
  };
  function renderButton() {
    return <Button onClick={handlerUpload}>upload</Button>;
  }
  return (
    <>
      {" "}
      <div className="upload-container" ref={uploadContainerRef}>
        {!selecteFile ? <InboxOutlined></InboxOutlined> : null}
        {renderFilePreview(filePreview)}
      </div>
      {renderButton()}
    </>
  );
}
async function uploadFile(file, fileName) {
  const chunks = await createFileChunks(file, fileName);
  const requests = chunks.map(({ chunk, chunkName }) => {
    return createReuest(chunk, chunkName);
  });
  try {
    await Promise.all(requests);
    await axiosInstance.get("/merge");
    console.log("upload successly");
  } catch (error) {
    console.log("upload failed");
  }
}
function createReuest(chunk, chunkName) {
  return axiosInstance.post("/upload", chunk, {
    headers: {
      "Content-Type": "application/octet-stream",
    },
  });
}
async function createFileChunks(file, fileName, size = 1024 * 1024 * 2) {
  let chunks = [];
  for (let i = 0; i < file.size; i += size) {
    chunks.push({ chunk: file.slice(i, i + size), chunkName: `${i}` });
  }
  return chunks;
}
async function getFileName(file) {
  const fileHash = await caculateFileHash(file);
  const fileExtension = file.name.split(".").pop();
  return `${fileHash}.${fileExtension}`;
}
async function caculateFileHash(file) {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  return bufferToHex(hashBuffer);
}
function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
function renderFilePreview(filePreview) {
  const { url, type } = filePreview;
  if (type?.startsWith("video/")) {
    return <video src={url} controls></video>;
  } else if (type?.startsWith("image/")) {
    return <img src={url}></img>;
  } else {
    return url;
  }
}

export default FileUploader;
