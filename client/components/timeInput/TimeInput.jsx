import DatePicker from "react-multi-date-picker";
import TimePicker from "react-multi-date-picker/plugins/time_picker";
import React, { useState } from "react";
import styles from "./TimeInput.module.scss";
import "@/styles/main.scss";
import persian from "react-date-object/calendars/persian"
import persian_fa from "react-date-object/locales/persian_fa"
import calendarIcon from "@/public/assets/images/calendar1.png";
import Image from "next/image";
import "react-multi-date-picker/styles/layouts/mobile.css";

const TimeInput = ({ title, value, onChange, placeholder = "", style = {}, position = "auto", type = "text" }) => {

    return (
        <div className={styles.inputContainer}>
            <DatePicker
                format="D MMMM YYYY، HH:mm"
                locale={persian_fa}
                calendar={persian}
                placeholder={placeholder}
                onChange={onChange} 
                value={value} 
                className="rmdp-mobile"
                plugins={[
                    <TimePicker hideSeconds />
                ]}
            />
            <Image src={calendarIcon} alt="تقویم"></Image>
        </div>
    );
};

export default TimeInput;
