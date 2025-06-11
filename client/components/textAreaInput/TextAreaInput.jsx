import React from "react";
import styles from "./TextAreaInput.module.scss";
import "@/styles/main.scss";

const TextAreaInput = ({
  title,
  value,
  onChange,
  hasMessage = false,
  messageType = "alert",
  messageText = "",
  placeholder = "",
  style = {}
}) => {
  return (
    <div
      className={`${styles.inputContainer} ${
        hasMessage ? styles[messageType] : ""
      }`}
      style={{ ...style }}
    >
      <textarea
        className={`${styles.textAreaInput}  ${hasMessage ? styles[messageType] : ""}`}
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder}
      />

      {hasMessage && (
        <div className={`${styles.message} ${styles[messageType]}`}>
          {messageText}
        </div>
      )}
    </div>
  );
};

export default TextAreaInput;
