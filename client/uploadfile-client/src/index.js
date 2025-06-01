import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import FileUploader from './FileUploader';
import '@ant-design/v5-patch-for-react-19';
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <FileUploader />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals