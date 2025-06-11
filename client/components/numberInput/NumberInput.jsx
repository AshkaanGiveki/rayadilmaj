import React, { useEffect, useState } from "react";
import styles from "./NumberInput.module.scss";
import "@/styles/main.scss";

const NumberInput = ({ title, value, onChange, init = 0, min = 0 , max = 1000, step = 1, style = {} }) => {
  const [internalValue, setInternalValue] = useState(init);

  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const handleIncrease = () => {
    const newValue = Math.min(max, internalValue + step);
    setInternalValue(newValue);
    onChange?.(newValue);
  };

  const handleDecrease = () => {
    const newValue = Math.max(min, internalValue - step);
    setInternalValue(newValue);
    onChange?.(newValue);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    if (/^\d*$/.test(val)) {
      const num = val === "" ? "" : parseInt(val, 10);
      setInternalValue(num);
      if (val !== "") onChange?.(num);
    }
  };

  return (
    <div className={styles.inputContainer} style={{ ...style }}>
      <div className={styles.text}>{title}</div>
      <div className={styles.controller}>
        <div className={styles.button} onClick={handleIncrease}>+</div>
        <input
          className={styles.input}
          type="number"
          value={internalValue}
          onChange={handleInputChange}
        />
        <div className={styles.button} onClick={handleDecrease}>-</div>
      </div>
    </div>
  );
};

export default NumberInput;
