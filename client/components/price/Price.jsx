// import React, { useState } from "react";
// import Image from "next/image";
// import styles from "./Price.module.scss";
// import toman from "@/public/assets/images/riyal.svg";

// const formatPrice = (value) => {
//   if (!value && value !== 0) return "";
//   return Number(value).toLocaleString("en-US");
// };

// const Price = ({ value, style = {}, editable = false, onChange, onBlur }) => {
//   const [inputValue, setInputValue] = useState(value?.toString() || "");

//   const handleChange = (e) => {
//     const raw = e.target.value.replace(/\D/g, ""); // Remove non-digit characters
//     if (raw === "") {
//       setInputValue("");
//       onChange?.(0);
//     } else {
//       const cleaned = raw.replace(/^0+/, "") || "0"; // Remove leading zeros
//       setInputValue(cleaned);
//       onChange?.(cleaned);
//     }
//   };

//   const handleBlur = () => {
//     if (inputValue === "") {
//       onChange?.(0); // fallback to 0 on blur if empty
//       setInputValue("0");
//     }
//     onBlur?.();
//   };

//   const handleKeyDown = (e) => {
//     if (e.key === "Enter") {
//       e.preventDefault();
//       e.target.blur(); // triggers blur and ends edit
//     }
//   };

//   return (
//     <div className={styles.container} style={{ ...style }}>
//       {editable ? (
//         <input
//           className={`${styles.value} ${styles.input}`}
//           type="text"
//           inputMode="numeric"
//           value={inputValue}
//           onChange={handleChange}
//           onKeyDown={handleKeyDown}
//           onBlur={handleBlur}
//           autoFocus
//         />
//       ) : (
//         <div className={`${styles.value} ISRe`}>{formatPrice(value)}</div>
//       )}
//       <Image className={styles.toman} src={toman} alt="تومان" />
//     </div>
//   );
// };

// export default Price;


import React, { useState, useEffect } from "react";
import Image from "next/image";
import styles from "./Price.module.scss";
import toman from "@/public/assets/images/riyal.svg";

// Convert Persian digits to English digits
const toEnglishDigits = (input) => {
  const persianNumbers = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return input.replace(/[۰-۹]/g, (w) => persianNumbers.indexOf(w).toString());
};

// Format with commas
const formatPrice = (value) => {
  if (!value && value !== 0) return "";
  return Number(value).toLocaleString("en-US");
};

const Price = ({ value, style = {}, editable = false, onChange, onBlur }) => {
  const [inputValue, setInputValue] = useState(value?.toString() || "");

  useEffect(() => {
    setInputValue(value?.toString() || "");
  }, [value]);

  const handleChange = (e) => {
    const raw = toEnglishDigits(e.target.value);
    const cleaned = raw.replace(/\D/g, ""); // remove non-digits
    setInputValue(cleaned);
    onChange?.(cleaned === "" ? 0 : Number(cleaned));
  };

  const handleBlur = () => {
    if (inputValue === "") {
      setInputValue("0");
      onChange?.(0);
    }
    onBlur?.();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.target.blur();
    }
  };

  return (
    <div className={styles.container} style={{ ...style }}>
      {editable ? (
        <input
          className={`${styles.value} ${styles.input}`}
          type="text"
          inputMode="numeric"
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          autoFocus
        />
      ) : (
        <div className={`${styles.value} ISRe`}>{formatPrice(value)}</div>
      )}
      <Image className={styles.toman} src={toman} alt="تومان" />
    </div>
  );
};

export default Price;
