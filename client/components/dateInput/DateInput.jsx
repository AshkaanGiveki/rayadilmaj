import React, { useState } from "react";
import styles from "./DateInput.module.scss";
import "@/styles/main.scss";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian"
import persian_fa from "react-date-object/locales/persian_fa"
import calendarIcon from "@/public/assets/images/calendar1.png";
import Image from "next/image";
import "react-multi-date-picker/styles/layouts/mobile.css";

const DateInput = ({ title, value, onChange, placeholder = "", style = {}, position="auto", type = "text", imgTitle = "تقویم" }) => {

  return (
    <div className={styles.inputContainer}>
      <DatePicker value={value} format={"D MMMM YYYY"} className="rmdp-mobile" onChange={onChange} calendar={persian} locale={persian_fa}  calendarPosition={position} placeholder={placeholder} style={{ ...style }} />
      <Image src={calendarIcon} alt="تقویم" title={imgTitle}></Image>
    </div>
  );
};

export default DateInput;
