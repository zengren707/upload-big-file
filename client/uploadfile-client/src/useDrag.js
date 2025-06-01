import { useEffect,useCallback, useState } from "react";
import {message} from 'antd'
function useDrag(uploadContainerRef) {
  const [selecteFile,setSelectFile]=useState(null)
  const [filePreview,setFilePreview]=useState({url:null,type:null})
  const handleDrag = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
  },[]);
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const {files}=e.dataTransfer
    checkFile(files)
  },[]);
  const checkFile=(files)=>{
    const file=files[0]
    if(!file){
      console.log('not choose file')
      return
    }
    if(file.size>1024*1024*1024){
      console.log('file size over 1G')
    }
    if(!(file.type.startsWith('image/')||file.type.startsWith('video/'))){
      console.error('file type must is image or video')
      return
    }
    setSelectFile(file)
  }
  useEffect(() => {
    const uploadContainer = uploadContainerRef.current;
    uploadContainer.addEventListener("dragenter", handleDrag);
    uploadContainer.addEventListener("dragover", handleDrag);
    uploadContainer.addEventListener("drop", handleDrop);
    uploadContainer.addEventListener("dragleave", handleDrag);
    return () => {
      uploadContainer.removeEventListener("dragenter", handleDrag);
      uploadContainer.removeEventListener("dragover", handleDrag);
      uploadContainer.removeEventListener("drop", handleDrop);
      uploadContainer.removeEventListener("dragleave", handleDrag);
    };
  }, []);
  useEffect(()=>{
    if(!selecteFile)return
    const url =URL.createObjectURL(selecteFile)
    setFilePreview({url,type:selecteFile.type}) 
    return()=>{
      URL.revokeObjectURL(url)
    }
  },[selecteFile])

  return {filePreview,selecteFile}
}
export default useDrag;
