"use client";

import React, { useEffect, useState } from "react";
import styles from "./addOffice.module.scss";
import "@/styles/main.scss";
import Image from "next/image";
import TextInput from "@/components/textInput/TextInput";
import TextAreaInput from "@/components/textAreaInput/TextAreaInput";
import Loader from "@/components/loader/Loader";
import OfficeIcon from "@/public/assets/images/office.png";
import { convertPersianDigitsToEnglish } from "@/lib/convertPersianDigitsToEnglish";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Restriction from "@/components/restriction/Restriction";
import { toast } from "react-toastify";
import { useSocket } from "@/context/SocketContext";

const AddOffice = ({ style = {} }) => {
  const { user, loading, loggedIn, accessToken } = useAuth();
  const router = useRouter();
  const { socket } = useSocket();

  const [formData, setFormData] = useState({
    officeName: "",
    email: "",
    faName: "",
    enName: "",
    password: "",
    rePassword: "",
    phoneNo: "",
    slang: "",
  });

  const [formErrors, setFormErrors] = useState({});
  const allowedRoles = ["Admin"];

  useEffect(() => {
    if (!loading && !loggedIn) {
      router.push("/auth/login");
    }
  }, [loading, loggedIn]);

  useEffect(() => {
    if (!loading && user) {
      setFormData((prev) => ({ ...prev, officeId: user.officeId }));
    }
  }, [user, loading]);

  useEffect(() => {
    if (!socket || !accessToken) return;

    if (!socket.connected) {
      socket.io.opts.extraHeaders = {
        Authorization: `Bearer ${accessToken}`,
      };
      socket.connect();
    }

    const handleCreated = ({ message }) => {
      toast.success(message || "دارالترجمه با موفقیت ایجاد شد");
      setFormData({
        officeName: "",
        email: "",
        faName: "",
        enName: "",
        password: "",
        rePassword: "",
        phoneNo: "",
        slang: "",
      });
    };

    const handleError = ({ code, message }) => {
      if (code === "duplicate-email") {
        toast.error("ایمیل تکراری است.");
      } else if (code === "duplicate-phone" || code === "duplicate-mobile") {
        toast.error("شماره موبایل تکراری است.");
      } else {
        toast.error(message || "خطای ناشناخته.");
      }
    };

    socket.on("office:created", handleCreated);
    socket.on("office:error", handleError);

    return () => {
      socket.off("office:created", handleCreated);
      socket.off("office:error", handleError);
    };
  }, [socket, accessToken]);

  const handleChange = (field, value) => {
    const numericFields = ["phoneNo"];
    const correctedValue = numericFields.includes(field)
      ? convertPersianDigitsToEnglish(value)
      : value;

    setFormData((prev) => ({ ...prev, [field]: correctedValue }));
    setFormErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const errors = {};

    if (!formData.officeName.trim()) {
      errors.officeName = "عنوان دارالترجمه الزامی است.";
    }

    if (!/^[\u0600-\u06FF\s]{3,}$/.test(formData.faName.trim())) {
      errors.faName = "نام فارسی معتبر نیست (حداقل ۳ حرف فارسی).";
    }

    if (!/^[a-zA-Z\s]{3,}$/.test(formData.enName.trim())) {
      errors.enName = "نام انگلیسی معتبر نیست.";
    }

    const normalizedPhone = convertPersianDigitsToEnglish(formData.phoneNo.trim());
    if (!/^09\d{9}$/.test(normalizedPhone)) {
      errors.phoneNo = "شماره همراه باید با 09 شروع شده و 11 رقم باشد.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "آدرس ایمیل معتبر نیست.";
    }

    if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(formData.password)
    ) {
      errors.password = "رمز عبور باید حداقل ۸ کاراکتر و شامل حروف بزرگ، کوچک، عدد و نماد باشد.";
    }

    if (formData.password !== formData.rePassword) {
      errors.rePassword = "رمز عبور و تکرار آن یکسان نیستند.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!socket || !accessToken) return;

    if (!socket.connected) {
      socket.io.opts.extraHeaders = {
        Authorization: `Bearer ${accessToken}`,
      };
      socket.connect();
    }

    if (!validate()) {
      console.log("❌ فرم دارای خطا است");
      return;
    }

    const normalizedPhone = convertPersianDigitsToEnglish(formData.phoneNo.trim());

    const officeData = {
      name: formData.officeName.trim(),
      slang: formData.slang?.trim() || "",
    };

    const userData = {
      faName: formData.faName.trim(),
      enName: formData.enName.trim(),
      email: formData.email.trim(),
      password: formData.password,
      mobile: normalizedPhone,
      role: "Manager",
    };

    socket.emit("office:add", { officeData, userData });
  };

  if (!loading && loggedIn && !allowedRoles.includes(user?.role || "")) {
    return (
      <div className={styles.addUser}>
        <Restriction />
      </div>
    );
  }

  return (
    <div className={styles.addUser}>
      {loading ? (
        <Loader />
      ) : (
        <div className={`${styles.containerFrame} AutoHeight`}>
          <div className={styles.iconFrame}>
            <Image src={OfficeIcon} alt="افزودن دارالترجمه" />
          </div>
          <div className={`${styles.title} ISBo`}>افزودن دارالترجمه</div>

          <TextInput
            placeholder="عنوان دارالترجمه"
            value={formData.officeName}
            onChange={(val) => handleChange("officeName", val)}
            hasMessage={!!formErrors.officeName}
            messageType="error"
            messageText={formErrors.officeName}
          />

          <TextInput
            placeholder="نام و نام خانوادگی صاحب امتیاز (فارسی)"
            value={formData.faName}
            onChange={(val) => handleChange("faName", val)}
            hasMessage={!!formErrors.faName}
            messageType="error"
            messageText={formErrors.faName}
          />

          <TextInput
            placeholder="نام و نام خانوادگی صاحب امتیاز (انگلیسی)"
            value={formData.enName}
            onChange={(val) => handleChange("enName", val)}
            hasMessage={!!formErrors.enName}
            messageType="error"
            messageText={formErrors.enName}
          />

          <TextInput
            placeholder="شماره همراه صاحب امتیاز"
            value={formData.phoneNo}
            onChange={(val) => handleChange("phoneNo", val)}
            hasMessage={!!formErrors.phoneNo}
            messageType="error"
            messageText={formErrors.phoneNo}
          />

          <TextInput
            placeholder="آدرس ایمیل صاحب امتیاز"
            value={formData.email}
            onChange={(val) => handleChange("email", val)}
            hasMessage={!!formErrors.email}
            messageType="error"
            messageText={formErrors.email}
          />

          <TextInput
            type="password"
            placeholder="رمز عبور"
            value={formData.password}
            onChange={(val) => handleChange("password", val)}
            hasMessage={!!formErrors.password}
            messageType="error"
            messageText={formErrors.password}
          />

          <TextInput
            type="password"
            placeholder="تکرار رمز عبور"
            value={formData.rePassword}
            onChange={(val) => handleChange("rePassword", val)}
            hasMessage={!!formErrors.rePassword}
            messageType="error"
            messageText={formErrors.rePassword}
          />

          <TextAreaInput
            placeholder="شعار دارالترجمه"
            value={formData.slang}
            onChange={(val) => handleChange("slang", val)}
          />

          <div className={styles.registerButton} onClick={handleSubmit}>
            افزودن دارالترجمه
          </div>
        </div>
      )}
    </div>
  );
};

export default AddOffice;
