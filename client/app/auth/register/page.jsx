"use client";
import { useState } from "react";
import axios from "axios";
import styles from "./register.module.scss";
import SelectInput from "@/components/selectInput/SelectInput";
import TextInput from "@/components/textInput/TextInput";
import DateInput from "@/components/dateInput/DateInput";

export default function Register() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedOption, setSelectedOption] = useState("");

  const options = [
    { id: 1, value: "گزینه ۱"},
    { id: 2, value: "گزینه ۲"},
    { id: 3, value: "گزینه ۳"},
    { id: 4, value: "گزینه ۴"},
    { id: 5, value: "گزینه ۵"},
    { id: 6, value: "گزینه ۶"},
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/register`, formData);
      setSuccess("Registration successful! You can now log in.");
    } catch (err) {
      setError("Registration failed");
    }
  };

  return (
    <div className={styles.registerContainer}>
      <form onSubmit={handleSubmit}>
        <h2>Register</h2>
        {error && <p className={styles.error}>{error}</p>}
        {success && <p className={styles.success}>{success}</p>}
        <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
        <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
        <div className={styles.selectFrame}>
          <SelectInput title={"گزینه ها"} options={options} multiSelect />
        </div>
        <div className={styles.textFrame}>
          <TextInput placeholder="تیتر متن" />
        </div>        
        <div className={styles.dateFrame}>
          <DateInput placeholder="عنوان تقویم" />
        </div>
        <button type="submit">Register</button>
      </form>
    </div>
  );
}
