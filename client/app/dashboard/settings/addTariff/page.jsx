"use client";

import React, { useEffect, useState } from "react";
import styles from "./addTariff.module.scss";
import "@/styles/main.scss";
import TextInput from "@/components/textInput/TextInput";
import FileInput from "@/components/fileInput/FileInput";
import Image from "next/image";
import ExcelIcon from '@/public/assets/images/excel.png';
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import Loader from '@/components/loader/Loader';
import { useSocket } from "@/context/SocketContext";

const AddTariff = ({ style = {} }) => {
  const router = useRouter();
  const { socket } = useSocket();
  const { loading, user, accessToken } = useAuth();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    officeId: "",
    file: null,
    fileName: "",
  });

  const [formErrors, setFormErrors] = useState({
    title: "",
    description: "",
    file: "",
  });

  const [fileName, setFileName] = useState("");
  const [fileMessageType, setFileMessageType] = useState("alert");
  const [fileInfoMessage, setFileInfoMessage] = useState("فرمت مجاز: XLSX | حداکثر حجم: ۵ مگابایت");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      setFormData((prev) => ({ ...prev, officeId: user.officeId }));
    }
  }, [user, loading]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    let errors = {};
    if (!formData.title.trim()) {
      errors.title = "عنوان تعرفه را وارد کنید.";
    }
    if (!formData.description.trim()) {
      errors.description = "توضیحات تعرفه را وارد کنید.";
    }
    if (!formData.file) {
      errors.file = "لطفاً یک فایل XLSX معتبر انتخاب کنید.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    if (!socket.connected && accessToken) {
      socket.io.opts.extraHeaders = {
        Authorization: `Bearer ${accessToken}`,
      };
      socket.connect();
    }

    setIsSubmitting(true);

    const payload = {
      title: formData.title,
      description: formData.description,
      officeId: user.officeId,
      fileName: formData.fileName,
    };

    const handleSuccess = () => {
      toast.success("فایل تعرفه با موفقیت افزوده شد.");
      setFormData({
        title: "",
        description: "",
        officeId: user.officeId,
        file: null,
        fileName: "",
      });
      setFileName("");
      setIsSubmitting(false);
      setTimeout(() => {
        window.location.reload();
      }, 4000);
    };

    const handleError = () => {
      toast.error("متاسفانه فرآیند افزودن فایل تعرفه با مشکل مواجه شد!");
      setIsSubmitting(false);
    };

    socket.once("tariff:added", handleSuccess);
    socket.once("tariff:error", handleError);

    socket.emit("tariff:add", payload);
  };

  return (
    <div className={styles.addTariff} style={style}>
      <div className={`${styles.containerFrame} AutoHeight`}>
        <div className={styles.iconFrame}>
          <Image src={ExcelIcon} alt="افزودن فایل تعرفه" />
        </div>

        <div className={`${styles.title} ISBo`}>افزودن فایل تعرفه</div>

        <div className={styles.selectFrame}>
          <TextInput
            placeholder="عنوان تعرفه"
            value={formData.title}
            onChange={(value) => handleChange("title", value)}
            hasMessage={!!formErrors.title}
            messageType="error"
            messageText={formErrors.title}
          />
        </div>

        <div className={styles.selectFrame}>
          <TextInput
            placeholder="توضیحات تعرفه"
            value={formData.description}
            onChange={(value) => handleChange("description", value)}
            hasMessage={!!formErrors.description}
            messageType="error"
            messageText={formErrors.description}
          />
        </div>

        <div className={styles.selectFrame}>
          <FileInput
            fileName={fileName}
            allowedTypes={[
              "application/vnd.ms-excel",
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ]}
            maxSizeMB={5}
            onValidationError={(msg) => {
              setFormErrors((prev) => ({ ...prev, file: msg }));
              setFileMessageType("error");
              setFileInfoMessage("");
            }}
            onUploadComplete={(shownName, savedName) => {
              setFileName(shownName);
              setFormData((prev) => ({
                ...prev,
                file: shownName,
                fileName: savedName,
              }));
              setFormErrors((prev) => ({ ...prev, file: "" }));
              setFileMessageType("success");
              setFileInfoMessage("آپلود با موفقیت انجام شد.");
            }}
            hasMessage={!!formErrors.file || !!fileInfoMessage}
            messageType={fileMessageType}
            messageText={formErrors.file || fileInfoMessage}
          />
        </div>

        {fileMessageType === "info" && fileInfoMessage.includes('%') && (
          <div className={styles.progressBarWrapper}>
            <div className={styles.progressBar} style={{ width: `${parseInt(fileInfoMessage)}%` }} />
          </div>
        )}

        {isSubmitting ? (
          <div className={`${styles.loadingWrapper} ISBo`}>
            <Loader />
            <span>فرآیند ممکن است دقایقی به طول بیانجامد. لطفاً صبر کنید!</span>
          </div>
        ) : (
          <div className={styles.registerButton} onClick={handleSubmit}>
            افزودن فایل تعرفه
          </div>
        )}
      </div>
    </div>
  );
};

export default AddTariff;
