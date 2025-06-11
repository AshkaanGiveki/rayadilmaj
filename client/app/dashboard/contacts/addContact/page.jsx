"use client";

import React, { useEffect, useState } from "react";
import styles from "./addContact.module.scss";
import "@/styles/main.scss";
import Image from "next/image";
import TextInput from "@/components/textInput/TextInput";
import SelectInput from "@/components/selectInput/SelectInput";
import TextAreaInput from "@/components/textAreaInput/TextAreaInput";
import Loader from "@/components/loader/Loader";
import UserIcon from "@/public/assets/images/profile.png";
import { convertPersianDigitsToEnglish } from "@/lib/convertPersianDigitsToEnglish";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Restriction from "@/components/restriction/Restriction";
import { toast } from "react-toastify";
import { useSocket } from "@/context/SocketContext";

const AddContact = ({ style = {} }) => {
  const { user, accessToken, loading, loggedIn } = useAuth();
  const { socket, connected } = useSocket();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    nationalId: "",
    phone: "",
    mobile: "",
    email: "",
    address: "",
    customerGroup: "",
    description: "",
    officeId: "",
  });

  const [formErrors, setFormErrors] = useState({});
  const [customerGroups, setCustomerGroups] = useState([]);

  const allowedRoles = ["Admin", "Manager", "User"];

  // 🚫 Redirect if not logged in
  useEffect(() => {
    if (!loading && !loggedIn) {
      router.push("/auth/login");
    }
  }, [loading, loggedIn]);

  // ✅ Set office ID
  useEffect(() => {
    if (!loading && user) {
      setFormData((prev) => ({ ...prev, officeId: user.officeId }));
    }
  }, [user, loading]);

  // ✅ Load customer groups via socket
  useEffect(() => {
    if (!socket || !socket.connected) return;
    socket.emit("meta:contactsGroupRequest");

    const handleResponse = (groups) => {
      setCustomerGroups(groups.map((g) => ({ id: g.id, value: g.name })));
    };

    socket.on("meta:contactsGroupResponse", handleResponse);

    socket.on("meta:contactsGroupError", (err) => {
      console.error("❌ Error loading customer groups:", err);
    });

    return () => {
      socket.off("meta:contactsGroupResponse", handleResponse);
      socket.off("meta:contactsGroupError");
    };
  }, [socket, connected]);

  const handleChange = (field, value) => {
    const numericFields = ["nationalId", "phone", "mobile"];
    const correctedValue = numericFields.includes(field)
      ? convertPersianDigitsToEnglish(value)
      : value;

    setFormData((prev) => ({ ...prev, [field]: correctedValue }));
    setFormErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const errors = {};

    if (!/^\s*[\u0600-\u06FF]+\s+[\u0600-\u06FF]+.*$/.test(formData.name)) {
      errors.name = "نام باید شامل نام و نام خانوادگی فارسی باشد.";
    }

    if (!/^\d{10}$/.test(formData.nationalId)) {
      errors.nationalId = "کد ملی باید ۱۰ رقم باشد.";
    }

    if (!/^0\d{10}$/.test(formData.phone)) {
      errors.phone = "تلفن ثابت باید با 0 شروع شده و ۱۱ رقم باشد.";
    }

    if (!/^09\d{9}$/.test(formData.mobile)) {
      errors.mobile = "تلفن همراه باید با 09 شروع شده و ۱۱ رقم باشد.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "آدرس ایمیل معتبر نیست.";
    }

    if (formData.address.trim().length < 10) {
      errors.address = "آدرس باید حداقل ۱۰ کاراکتر باشد.";
    }

    if (!formData.customerGroup) {
      errors.customerGroup = "لطفاً گروه مشتری را انتخاب کنید.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!socket || !socket.connected) {
      toast.error("اتصال به سرور برقرار نیست.");
      return;
    }

    if (!validate()) {
      console.log("❌ Form has errors");
      return;
    }

    const newFormData = {
      name: formData.name.trim(),
      nationalId: convertPersianDigitsToEnglish(formData.nationalId.trim()),
      phone: convertPersianDigitsToEnglish(formData.phone.trim()),
      mobile: convertPersianDigitsToEnglish(formData.mobile.trim()),
      email: formData.email.trim(),
      address: formData.address.trim(),
      customerGroup: formData.customerGroup,
      description: formData.description.trim(),
      officeId: formData.officeId,
    };

    socket.emit("customer:add", newFormData);

    socket.once("customer:added", () => {
      toast.success("مشتری جدید با موفقیت افزوده شد.");
      setFormData({
        name: "",
        nationalId: "",
        phone: "",
        mobile: "",
        email: "",
        address: "",
        customerGroup: "",
        description: "",
        officeId: user?.officeId ?? "",
      });
    });
  };

  // 🔐 Restrict access
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
            <Image src={UserIcon} alt="افزودن مشتری" />
          </div>
          <div className={`${styles.title} ISBo`}>افزودن مشتری</div>

          <div className={styles.selectFrame}>
            <TextInput
              placeholder="نام و نام خانوادگی"
              value={formData.name}
              onChange={(value) => handleChange("name", value)}
              hasMessage={!!formErrors.name}
              messageType="error"
              messageText={formErrors.name}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.halfSelectFrame}>
              <TextInput
                placeholder="کد ملی"
                value={formData.nationalId}
                onChange={(value) => handleChange("nationalId", value)}
                hasMessage={!!formErrors.nationalId}
                messageType="error"
                messageText={formErrors.nationalId}
              />
            </div>

            <div className={styles.halfSelectFrame}>
              <SelectInput
                options={customerGroups}
                searchable={true}
                title="گروه مشتری"
                value={formData.customerGroup}
                onChange={(value) => handleChange("customerGroup", value)}
                hasMessage={!!formErrors.customerGroup}
                messageType="error"
                messageText={formErrors.customerGroup}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.halfSelectFrame}>
              <TextInput
                placeholder="تلفن ثابت"
                value={formData.phone}
                onChange={(value) => handleChange("phone", value)}
                hasMessage={!!formErrors.phone}
                messageType="error"
                messageText={formErrors.phone}
              />
            </div>

            <div className={styles.halfSelectFrame}>
              <TextInput
                placeholder="تلفن همراه"
                value={formData.mobile}
                onChange={(value) => handleChange("mobile", value)}
                hasMessage={!!formErrors.mobile}
                messageType="error"
                messageText={formErrors.mobile}
              />
            </div>
          </div>

          <div className={styles.selectFrame}>
            <TextInput
              placeholder="آدرس ایمیل"
              value={formData.email}
              onChange={(value) => handleChange("email", value)}
              hasMessage={!!formErrors.email}
              messageType="error"
              messageText={formErrors.email}
            />
          </div>

          <div className={styles.selectFrame}>
            <TextAreaInput
              placeholder="آدرس پستی"
              value={formData.address}
              onChange={(value) => handleChange("address", value)}
              hasMessage={!!formErrors.address}
              messageType="error"
              messageText={formErrors.address}
            />
          </div>

          <div className={styles.selectFrame}>
            <TextInput
              placeholder="توضیحات"
              value={formData.description}
              onChange={(value) => handleChange("description", value)}
            />
          </div>

          <div className={styles.registerButton} onClick={handleSubmit}>
            افزودن مشتری
          </div>
        </div>
      )}
    </div>
  );
};

export default AddContact;
