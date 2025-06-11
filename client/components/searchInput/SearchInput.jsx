import React from "react";
import styles from "./SearchInput.module.scss";
import search from "@/public/assets/images/search.png";
import "@/styles/main.scss";
import Image from "next/image";
const SearchInput = ({ value, onChange, placeholder = "", style = {}, type = "text" }) => {

  return (
    <div className={styles.inputContainer} style={{ ...style }}>
            <input
              className={styles.textInput}
              type={type}
              value={value}
              onChange={(e) => onChange && onChange(e.target.value)}
              placeholder={placeholder}
            />
            <Image alt='search' src={search} className={styles.icon}></Image>
    </div>
  );
};

export default SearchInput;
