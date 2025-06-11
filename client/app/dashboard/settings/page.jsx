"use client";

import React, { useEffect, useState } from "react";
import styles from "./settings.module.scss";
import "@/styles/main.scss";
import Image from "next/image";
import TextInput from "@/components/textInput/TextInput";
import NewItem from '@/public/assets/images/plus.png';
import confirmIcon from '@/public/assets/images/check.png';
import Link from "next/link";
import { useAuth } from '@/context/AuthContext';
import { toast } from "react-toastify";
import Loader from "@/components/loader/Loader";
import { useRouter } from "next/navigation";
import { useSocket } from "@/context/SocketContext";

const Settings = ({ style = {} }) => {
  const { user, loggedIn, loading } = useAuth();
  const { socket } = useSocket();
  const router = useRouter();

  const [tariffs, setTariffs] = useState([]);
  const [officeMeta, setOfficeMeta] = useState({
    name: '',
    slang: '',
    preferredTariffId: '',
  });

  const [initialMeta, setInitialMeta] = useState(null);
  const [formChanged, setFormChanged] = useState(false);

  useEffect(() => {
    if (!loading && loggedIn) {
      if (user?.role !== "Admin" && user?.role !== "Manager") return;
  
      if (!socket) return;

      socket.emit("tariff:fetchAll", { officeId: user.officeId });
      socket.emit("office:fetchMeta", { officeId: user.officeId });

      const handleTariffs = (data) => setTariffs(data);
      const handleMetaFetched = (data) => {
        setOfficeMeta(data);
        setInitialMeta(data);
        setFormChanged(false);
      };
      const handleUpdated = (data) => {
        toast.success(data.message || "تغییرات با موفقیت ثبت شد.");
        setInitialMeta(officeMeta);
        setFormChanged(false);
      };
      const handleError = (error) => {
        toast.error(error.message || "خطایی رخ داده است.");
      };

      socket.on("tariff:list", handleTariffs);
      socket.on("office:metaFetched", handleMetaFetched);
      socket.on("office:updated", handleUpdated);
      socket.on("office:error", handleError);

      return () => {
        socket.off("tariff:list", handleTariffs);
        socket.off("office:metaFetched", handleMetaFetched);
        socket.off("office:updated", handleUpdated);
        socket.off("office:error", handleError);
      };
    }

    if (!loading && !loggedIn) {
      router.push("/auth/login");
    }
  }, [loading, loggedIn, socket, user]);

  const handleInputChange = (field, value) => {
    setOfficeMeta((prev) => {
      const updated = { ...prev, [field]: value };
      if (initialMeta) {
        const changed =
          updated.name !== initialMeta.name ||
          updated.slang !== initialMeta.slang ||
          updated.preferredTariffId !== initialMeta.preferredTariffId;
        setFormChanged(changed);
      }
      return updated;
    });
  };

  const handleConfirm = () => {
    if (!officeMeta.name || !officeMeta.preferredTariffId) {
      alert("لطفاً نام دارالترجمه و یک تعرفه را انتخاب کنید.");
      return;
    }

    socket.emit("office:updateMeta", {
      officeId: user.officeId,
      officeData: officeMeta,
    });
  };

  if (loading) {
    return (
      <div className={styles.settings}>
        <Loader />
      </div>
    );
  }

  if (!loading && loggedIn && user?.role !== "Admin" && user?.role !== "Manager") {
    return (
      <div className={styles.settings}>
        <div className={styles.error403}>
          <h1>403 - دسترسی غیرمجاز</h1>
          <p>شما مجوز دسترسی به این صفحه را ندارید.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.settings}>
      <div className={`${styles.selectFrame} ${styles.pageTitle} ISBo`}>
        اطلاعات کلی دارالترجمه
      </div>

      <div className={styles.selectFrame}>
        <TextInput
          placeholder="نام دارالترجمه"
          value={officeMeta.name}
          onChange={(val) => handleInputChange("name", val)}
        />
      </div>

      <div className={styles.selectFrame}>
        <TextInput
          placeholder="شعار دارالترجمه"
          value={officeMeta.slang}
          onChange={(val) => handleInputChange("slang", val)}
        />
      </div>

      <div className={`${styles.selectFrame} ${styles.pageTitle} ISBo`}>
        افزودن کاربر
      </div>

      <div className={`${styles.addUserSection}`}>
        <div className={`${styles.description} AutoHeight`}>
          برای افزودن کاربر به حساب کاربری دارالترجمه خود در رایادیلماج، بر روی دکمه روبرو کلیک کنید. کاربران افزوده شده دارای نقش کاربر عادی خواهند بود.
        </div>
        <Link href={"/dashboard/settings/addUser"} className={styles.addUserButton}>
          <Image src={NewItem} alt={"افزودن کاربر"} />
          <div className={styles.title}>افزودن کاربر</div>
        </Link>
      </div>

      <div className={`${styles.selectFrame} ${styles.pageTitle} ISBo`}>
        انتخاب فایل تعرفه
      </div>

      <div className={`AutoHeight ${styles.tariffsList}`}>
        {tariffs.map((tariff) => (
          <div
            key={tariff.id}
            className={`${styles.tariffItem} ${tariff.id === officeMeta.preferredTariffId ? styles.active : ''}`}
            onClick={() => handleInputChange("preferredTariffId", tariff.id)}
          >
            <div className={`${styles.state}`}>
              <div className={styles.selector}></div>
            </div>
            <div className={`${styles.title} ISBo`}>{tariff.name}</div>
            <div className={styles.description}>{tariff.description}</div>
            <div className={styles.dateIssued}>
              تاریخ ثبت: {new Date(tariff.dateIssued).toLocaleDateString("fa-IR")}
            </div>
          </div>
        ))}

        <Link href="/dashboard/settings/addTariff" className={`${styles.tariffItem} ${styles.addNew}`}>
          <Image src={NewItem} alt="افزودن لیست تعرفه جدید" />
          <div className="ISMe">افزودن لیست تعرفه جدید</div>
        </Link>
      </div>

      <div
        className={`${styles.confirmButton} ${!formChanged ? styles.disabled : ''}`}
        onClick={formChanged ? handleConfirm : undefined}
        style={{
          cursor: formChanged ? "pointer" : "not-allowed",
          opacity: formChanged ? 1 : 0.5,
        }}
      >
        <Image src={confirmIcon} alt={"ثبت تغییرات"} />
        <div className={styles.title}>ثبت تغییرات</div>
      </div>
    </div>
  );
};

export default Settings;
