import React, { useState } from "react";
import styles from "./TextInput.module.scss";
import "@/styles/main.scss";
import Image from "next/image";
import eyeImage from "@/public/assets/images/eye.png";
import hiddenImage from "@/public/assets/images/hidden.png";

const TextInput = ({ title, value, onChange, hasMessage = false, messageType = "alert", messageText = "", placeholder = "", style = {}, type = "text" }) => {
  const [passwordShown, setPasswordShown] = useState(false);

  return (
    <div className={styles.inputContainer} style={{ ...style }}>
      {type === "password" ?
        <>
          <input
            className={hasMessage ? `${styles.textInput} ${styles[messageType]}` : styles.textInput}
            type={passwordShown ? "text" : "password"}
            value={value}
            onChange={(e) => onChange && onChange(e.target.value)}
            placeholder={placeholder}
          />
          <Image className={styles.passwordShown} src={passwordShown ? hiddenImage : eyeImage} alt="نمایش رمز عبور" onClick={() => setPasswordShown(!passwordShown)}></Image>
          {hasMessage &&
            <div className={`${styles.message} ${styles[messageType]}`}>{messageText}</div>
          }
        </>
        :
        <>
          <input
            className={hasMessage ? `${styles.textInput} ${styles[messageType]}` : styles.textInput}
            type={type}
            value={value}
            onChange={(e) => onChange && onChange(e.target.value)}
            placeholder={placeholder}
          />
          {hasMessage &&
            <div className={`${styles.message} ${styles[messageType]}`}>{messageText}</div>
          }

        </>
      }
    </div>
  );
};

export default TextInput;
