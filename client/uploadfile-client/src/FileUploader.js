import { InboxOutlined } from "@ant-design/icons";
import "./FileUploader.css";
import { useRef, useState } from "react";
import useDrag from "./useDrag";
import { Button, Progress } from "antd";
import axiosInstance from "./axiosInstance";
import axios from "axios";
const UploadStatus = {
  NOS_START: "NOS_START",
  UPLOADING: "UPLOADING",
  PAUSE: "PAUSE",
};

function FileUploader() {
  const uploadContainerRef = useRef(null);
  const { selecteFile, filePreview } = useDrag(uploadContainerRef);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadStatus, setUploadStatus] = useState(UploadStatus.NOS_START);
  const [cancelTokens, setCancelTokens] = useState([]);
  const handlerUpload = async () => {
    if (!selecteFile) {
      console.log("not choose file yet");
      return;
    }
    setUploadStatus(UploadStatus.UPLOADING);
    const fileName = await getFileName(selecteFile);
    await uploadFile(selecteFile, fileName, setUploadProgress, setCancelTokens);
  };
  const pauseUpload = async () => {
    setUploadStatus(UploadStatus.PAUSE);
    cancelTokens.forEach((cancelToken) =>
      cancelToken.cancel("user execute pause")
    );
  };
  const resumeUpload = async () => {
    setUploadStatus(UploadStatus.UPLOADING);
  };
  function renderButton() {
    switch (uploadStatus) {
      case UploadStatus.NOS_START:
        return <Button onClick={handlerUpload}>upload</Button>;
      case UploadStatus.UPLOADING:
        return <Button onClick={pauseUpload}>pause</Button>;
      case UploadStatus.PAUSE:
        return <Button onClick={handlerUpload}>resume</Button>;
    }
  }
  function renderProgress() {
    // if (Object.keys(uploadProgress).length) return null;
    return Object.keys(uploadProgress).map((chunkName, index) => (
      <div>
        <span>{index}</span>
        <Progress percent={uploadProgress[chunkName]} key={index}></Progress>
      </div>
    ));
  }
  return (
    <>
      <div className="upload-container" ref={uploadContainerRef}>
        {!selecteFile ? <InboxOutlined></InboxOutlined> : null}
        {renderFilePreview(filePreview)}
      </div>
      {uploadStatus ? renderButton() : null}
      {renderProgress()}
    </>
  );
}
async function uploadFile(file, fileName, setUploadProgress, setCancelTokens) {
  const { needUpload, uploadedList } = await axiosInstance.get(
    `/verify/${fileName}`
  );
  if (!needUpload) {
    console.log("this file have existed");
    return;
  }
  const chunks = await createFileChunks(file);
  const newCancelTokens = [];
  const requests = chunks.map(({ chunk, chunkName }) => {
    const cancelToken = axios.CancelToken.source();
    newCancelTokens.push(cancelToken);

    const existChunk = uploadedList.find(({ chunkFileName }) => {
      return chunkFileName == fileName;
    });
    if (existChunk) {
      const uploadedSize = existChunk.size;
      const remainChunk = chunk.slice(uploadedSize);
      console.log("uploadedSize", uploadedSize);
      if (remainChunk.size) {
        return Promise.resolve();
      } else {
        return createReuest(
          chunk,
          chunkName,
          setUploadProgress,
          cancelToken,
          uploadedSize
        );
      }
    }
    return createReuest(chunk, chunkName, setUploadProgress, cancelToken);
  });
  setCancelTokens(newCancelTokens);
  try {
    await Promise.all(requests);
    console.log("upload successly");
    await axiosInstance.get(`/merge/${fileName}`);
    console.log("merge successly");
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log("pause");
    } else {
      console.error(error);
      console.log("failed");
    }
  }
}
function createReuest(
  chunk,
  chunkName,
  setUploadProgress,
  cancelToken,
  start = 0
) {
  return axiosInstance.post("/upload", chunk, {
    headers: {
      "Content-Type": "application/octet-stream",
    },
    params: {
      chunkName,
      start,
    },
    onUploadProgress: (processEvent) => {
      const percentCompleted = Math.round(
        (processEvent.loaded * 100) / processEvent.total
      );
      setUploadProgress((prevProgress) => ({
        ...prevProgress,
        [chunkName]: percentCompleted,
      }));
    },
    cancelToken: cancelToken.token,
  });
}
async function createFileChunks(file, size = 1024 * 1024 * 2) {
  let chunks = [];
  for (let i = 0; i < file.size; i += size) {
    chunks.push({
      chunk: file.slice(i, i + size),
      chunkName: `${i}`,
    });
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
