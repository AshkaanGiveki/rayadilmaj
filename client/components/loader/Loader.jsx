import React, { useState } from "react";
import Image from "next/image";
import styles from "./Loader.module.scss";
import logo from "@/public/assets/images/logo.svg";


const Loader = ({ style }) => {
  
  return (
    <div className={styles.loaderContainer} style={{ ...style }}>
         <div className={styles.loader}></div>
    </div>
  );
};

export default Loader;
