import React from "react";
import styles from "./CheckInput.module.scss";
import "../../styles/main.scss";
import Image from "next/image";
import check from "@/public/assets/images/check.png";

const CheckInput = ({
  title,
  value,
  onChange,
  disabled = false,
  enabled = false,
  init = false,
  style = {}
}) => {
  // Force value based on mode
  const finalValue = enabled ? true : disabled ? false : value;

  // Only allow toggle if neither enforced
  const clickable = !enabled && !disabled;

  return (
    <div className={styles.inputContainer} style={{ ...style }}>
      <div
        className={`${styles.square} ${finalValue ? styles.active : ""} ${!clickable ? styles.locked : ""}`}
        onClick={() => clickable && onChange(!finalValue)}
      >
        <Image alt="تیک" className={styles.check} src={check} />
      </div>
      <div
        className={styles.text}
        onClick={() => clickable && onChange(!finalValue)}
      >
        {title}
      </div>
    </div>
  );
};

export default CheckInput;
