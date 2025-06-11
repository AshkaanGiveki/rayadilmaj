// lib/fetchUser.js
import axios from "axios";

export async function fetchUser() {
  try {
    const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me`, {
      withCredentials: true, // ensure cookies sent
    });
    return res.data; // user payload
  } catch (err) {
    console.error("❌ Failed to fetch user:", err);
    return null;
  }
}
