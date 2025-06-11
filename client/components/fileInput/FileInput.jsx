import React, { useRef, useState } from "react";
import styles from "./FileInput.module.scss";
import "@/styles/main.scss";
import axios from "axios";

const FileInput = ({
  fileName = "",
  onUploadComplete,
  placeholder = "یک فایل انتخاب کنید",
  style = {},
  backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/upload-tariff`,
  allowedTypes = [],           // required for file format check
  maxSizeMB = 5,               // default: 5MB
  onValidationError,           // optional: send error to parent if you want
  hasMessage = false,
  messageType = "alert",
  messageText = "",
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [status, setStatus] = useState("idle"); // idle | uploading | success | error
  const inputRef = useRef(null);

  const handleChange = async (e) => {
    const file = e.target.files[0];
    if (file) await handleUpload(file);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) await handleUpload(file);
  };

  const handleUpload = async (file) => {
    const isValidType = allowedTypes.length === 0 || allowedTypes.includes(file.type);
    const isValidSize = file.size / 1024 / 1024 <= maxSizeMB;

    if (!isValidType) {
      onValidationError?.("فرمت فایل مجاز نیست.");
      setStatus("error");
      return;
    }

    if (!isValidSize) {
      onValidationError?.(`حجم فایل نباید بیشتر از ${maxSizeMB} مگابایت باشد.`);
      setStatus("error");
      return;
    }

    setStatus("uploading");

    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(backendUrl, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (e) => {
          const percent = Math.round((e.loaded * 100) / e.total);
          setUploadProgress(percent);
        },
      });

      if (res.data.success) {
        setStatus("success");
        onUploadComplete?.(file.name, res.data.filename);
      } else {
        setStatus("error");
      }
    } catch (err) {
      console.error("Upload failed:", err);
      setStatus("error");
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  return (
    <div
      className={`${styles.inputContainer} ${dragActive ? styles.dragActive : ""} ${(hasMessage && status !== "uploading") ? styles[messageType] : ""
        }`}
      onDrop={handleDrop}
      onDragOver={handleDrag}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      style={style}
    >
      <label className={`nowrap ${styles.fileInputLabel}`} onClick={() => inputRef.current?.click()}>
        {status === "error"
          ? placeholder
          : status === "uploading"
          ? "در حال آپلود فایل..."
          : fileName
            ? `فایل انتخاب‌شده: ${fileName}`
            : placeholder}

        <input
          ref={inputRef}
          type="file"
          className={styles.fileInput}
          onChange={handleChange}
        />

        {status === "uploading" && (
          <div className={styles.progressCircle}>
            <svg viewBox="0 0 36 36">
              <path
                className={styles.circleBg}
                d="M18 2.0845
                   a 15.9155 15.9155 0 0 1 0 31.831
                   a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={styles.circle}
                strokeDasharray={`${uploadProgress}, 100`}
                d="M18 2.0845
                   a 15.9155 15.9155 0 0 1 0 31.831
                   a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <text x="18" y="20.35" className={styles.percent}>
                {uploadProgress}%
              </text>
            </svg>
          </div>
        )}

      </label>

      {status !== "uploading" && hasMessage && messageText && (
        <div className={`${styles.message} ${styles[messageType] || ""}`}>
          {messageText}
        </div>
      )}

    </div>
  );
};

export default FileInput;
