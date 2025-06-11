"use client";

import React, { useEffect, useState } from "react";
import styles from "./addUser.module.scss";
import "@/styles/main.scss";
import Image from "next/image";
import TextInput from "@/components/textInput/TextInput";
import UserIcon from "@/public/assets/images/user.png";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useSocket } from "@/context/SocketContext";
import { createSocket } from "@/lib/createSocket";

const AddUser = ({ style = {} }) => {
  const { loggedIn, user, loading, accessToken } = useAuth();
  const router = useRouter();
  const { socket, connected, setSocket} = useSocket();

  const [formData, setFormData] = useState({
    officeId: "",
    nameFa: "",
    nameEn: "",
    email: "",
    password: "",
    passwordRepeat: "",
    phone: "",
  });

  const [formErrors, setFormErrors] = useState({
    nameFa: "",
    nameEn: "",
    email: "",
    password: "",
    passwordRepeat: "",
    phone: "",
  });

  const convertPersianDigitsToEnglish = (str) =>
    str.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));

  const validate = () => {
    const errors = {};

    if (!/^[\u0600-\u06FF\s]+$/.test(formData.nameFa.trim())) {
      errors.nameFa = "نام فارسی فقط باید شامل حروف فارسی باشد.";
    }

    if (!/^[a-zA-Z\s]+$/.test(formData.nameEn.trim())) {
      errors.nameEn = "نام انگلیسی فقط باید شامل حروف انگلیسی باشد.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = "آدرس ایمیل معتبر نیست.";
    }

    const normalizedPhone = convertPersianDigitsToEnglish(formData.phone.trim());
    if (!/^0\d{10}$/.test(normalizedPhone)) {
      errors.phone = "تلفن باید با 0 شروع شده و ۱۱ رقم باشد.";
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/.test(formData.password)) {
      errors.password = "رمز باید حداقل ۸ کاراکتر و شامل حروف بزرگ، کوچک، عدد و نماد باشد.";
    }

    if (formData.passwordRepeat !== formData.password) {
      errors.passwordRepeat = "تکرار رمز با رمز عبور مطابقت ندارد.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (field, value) => {
    const cleanValue = field === "phone" ? convertPersianDigitsToEnglish(value) : value;
    setFormData((prev) => ({ ...prev, [field]: cleanValue }));
    setFormErrors((prev) => ({ ...prev, [field]: "" }));
  };

  // const handleSubmit = () => {
  //   if (!validate()) return;

  //   if (!connected && socket && accessToken) {
  //     socket.io.opts.extraHeaders = {
  //       Authorization: `Bearer ${accessToken}`,
  //     };
  //     socket.connect();
  //   }

  //   const normalizedPhone = convertPersianDigitsToEnglish(formData.phone.trim());

  //   const clientData = {
  //     officeId: formData.officeId,
  //     nameEn: formData.nameEn.trim(),
  //     nameFa: formData.nameFa.trim(),
  //     password: formData.password,
  //     phone: normalizedPhone,
  //     email: formData.email.trim(),
  //     role: "User",
  //   };

  //   if (connected && socket) {
  //     socket.emit("client:add", clientData);
  //   } else {
  //     toast.error("اتصال به سرور برقرار نیست.");
  //   }
  // };

  const handleSubmit = () => {
    if (!validate()) return;
  
    if (!accessToken) {
      toast.error("دسترسی نامعتبر. لطفاً دوباره وارد شوید.");
      return;
    }
  
    const normalizedPhone = convertPersianDigitsToEnglish(formData.phone.trim());
  
    const clientData = {
      officeId: formData.officeId,
      nameEn: formData.nameEn.trim(),
      nameFa: formData.nameFa.trim(),
      password: formData.password,
      phone: normalizedPhone,
      email: formData.email.trim(),
      role: "User",
    };
  
    // ✅ Recreate socket with new token if not connected
    if (!connected) {
      const newSocket = createSocket(accessToken);
      newSocket.connect();
      newSocket.once("connect", () => {
        setSocket(newSocket);
        newSocket.emit("client:add", clientData);
      });
      newSocket.once("connect_error", () => {
        toast.error("اتصال به سرور برقرار نشد.");
      });
    } else {
      socket.emit("client:add", clientData);
    }
  };

  
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
    const handleCreated = ({ message }) => {
      toast.success(message || "کاربر با موفقیت اضافه شد");
      setFormData({
        officeId: user?.officeId ?? "",
        nameFa: "",
        nameEn: "",
        email: "",
        password: "",
        passwordRepeat: "",
        phone: "",
      });
    };

    const handleError = (error) => {
      const code = error?.code;
      if (code === "duplicate-email") {
        toast.error("ایمیل قبلاً ثبت شده است.");
      } else if (code === "duplicate-phone" || code === "duplicate-mobile") {
        toast.error("شماره تماس قبلاً استفاده شده است.");
      } else {
        toast.error(error.message || "خطا در افزودن کاربر.");
      }
    };

    if (socket) {
      socket.on("client:added", handleCreated);
      socket.on("client:error", handleError);
    }

    return () => {
      if (socket) {
        socket.off("client:added", handleCreated);
        socket.off("client:error", handleError);
      }
    };
  }, [socket, user]);

  return (
    <div className={styles.addUser}>
      <div className={`${styles.containerFrame} AutoHeight`}>
        <div className={styles.iconFrame}>
          <Image src={UserIcon} alt="افزودن کاربر" />
        </div>
        <div className={`${styles.title} ISBo`}>افزودن کاربر</div>

        <div className={styles.selectFrame}>
          <TextInput
            placeholder="نام و نام خانوادگی به فارسی"
            value={formData.nameFa}
            onChange={(val) => handleChange("nameFa", val)}
            hasMessage={!!formErrors.nameFa}
            messageType="error"
            messageText={formErrors.nameFa}
          />
        </div>

        <div className={styles.selectFrame}>
          <TextInput
            placeholder="نام و نام خانوادگی به انگلیسی"
            value={formData.nameEn}
            onChange={(val) => handleChange("nameEn", val)}
            hasMessage={!!formErrors.nameEn}
            messageType="error"
            messageText={formErrors.nameEn}
          />
        </div>

        <div className={styles.selectFrame}>
          <TextInput
            placeholder="آدرس ایمیل"
            value={formData.email}
            onChange={(val) => handleChange("email", val)}
            hasMessage={!!formErrors.email}
            messageType="error"
            messageText={formErrors.email}
          />
        </div>

        <div className={styles.selectFrame}>
          <TextInput
            placeholder="شماره همراه"
            value={formData.phone}
            onChange={(val) => handleChange("phone", val)}
            hasMessage={!!formErrors.phone}
            messageType="error"
            messageText={formErrors.phone}
          />
        </div>

        <div className={styles.selectFrame}>
          <TextInput
            type="password"
            placeholder="رمز عبور"
            value={formData.password}
            onChange={(val) => handleChange("password", val)}
            hasMessage={!!formErrors.password}
            messageType="error"
            messageText={formErrors.password}
          />
        </div>

        <div className={styles.selectFrame}>
          <TextInput
            type="password"
            placeholder="تکرار رمز عبور"
            value={formData.passwordRepeat}
            onChange={(val) => handleChange("passwordRepeat", val)}
            hasMessage={!!formErrors.passwordRepeat}
            messageType="error"
            messageText={formErrors.passwordRepeat}
          />
        </div>

        <div className={styles.registerButton} onClick={handleSubmit}>
          افزودن کاربر
        </div>
      </div>
    </div>
  );
};

export default AddUser;
