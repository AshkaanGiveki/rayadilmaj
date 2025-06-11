
// lib/createSocket.ts
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const createSocket = (token: string): Socket => {
  socket = io(`${process.env.NEXT_PUBLIC_BACKEND_URL}`, {
    autoConnect: true,
    transports: ["websocket"],
    auth: {
      token: `Bearer ${token}`, // ✅ مرورگر از این استفاده می‌کنه
    },
  });
  return socket;
};

export const getSocket = (): Socket | null => socket;

