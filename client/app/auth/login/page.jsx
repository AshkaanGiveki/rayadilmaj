"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import styles from "./login.module.scss";
import Image from "next/image";
import loginWallpaper from "@/public/assets/images/loginWallpaper.webp";
import TextInput from "@/components/textInput/TextInput";
import { useSocket } from "@/context/SocketContext";
import { useAuth } from "@/context/AuthContext";
import { createSocket } from "@/lib/createSocket";

export default function Login() {
  const { loggedIn, loading, setAccessToken, fetchUser } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  
  const { setSocket } = useSocket();
  const handleChange = (key, val) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
  };
  useEffect(() => {
    if (!loading && loggedIn) {
      router.replace("/dashboard/invoice");
    }
  }, [loggedIn, loading]);

  if (!loading && loggedIn) return null;
  const handleSubmit = async (e) => {

    e.preventDefault();

    setError("");


    try {
      alert (process.env.NEXT_PUBLIC_BACKEND_URL);
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/login`,
        {
          email: formData.email,
          password: formData.password,
        },
        { withCredentials: true }
      );

      const token = res.data.accessToken;

      if (!token) {
        throw new Error("No token received");  
      };

      setAccessToken(token); // ✅ store in context
      await fetchUser(token); // ✅ fetch user info and store in AuthContext

      // 🔌 Create authenticated socket
      const sock = createSocket(token);

      sock.connect();
      sock.once("connect", () => {
        setSocket(sock); // ✅ store socket in context only after it's connected
        
        router.push("/dashboard/invoice");
      });

      sock.once("connect_error", (err) => {
        console.error("❌ Socket connection error:", err.message);
        setError("خطا در اتصال به سرور. لطفاً مجدداً تلاش کنید.");
      });

      // Optional: fallback timeout if socket never connects
      setTimeout(() => {
        if (!sock.connected) {
          setError("⏱ اتصال برقرار نشد. لطفاً مجدداً تلاش کنید.");
          sock.disconnect();
        }
      }, 7000);
    } catch (err) {
      console.error("Login failed:", err);
      setError("❌ ورود ناموفق بود. ایمیل یا رمز عبور اشتباه است.");
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.imgFrame}>
        <Image src={loginWallpaper} className={styles.loginWallpaper} alt="تصویر پس‌زمینه" />
      </div>
      <div className={styles.formContainer}>
        <form onSubmit={handleSubmit}>
          <h2>ورود به رایادیلماج</h2>

          <div className={styles.inputFrame}>
            <TextInput
              title=""
              value={formData.email}
              onChange={(val) => handleChange("email", val)}
              placeholder="ایمیل"
              type="text"
              hasMessage={false}
              messageText=""
            />
          </div>

          <div className={styles.inputFrame}>
            <TextInput
              title=""
              value={formData.password}
              onChange={(val) => handleChange("password", val)}
              placeholder="رمز عبور"
              type="password"
              hasMessage={false}
              messageText=""
            />
          </div>

          {error && <p className={styles.errorMessage}>{error}</p>}

          <button type="submit" className="ISBo">ورود</button>
        </form>
      </div>
    </div>
  );
}
