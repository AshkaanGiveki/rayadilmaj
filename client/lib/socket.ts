// lib/socket.ts
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const createSocket = (token: string): Socket => {
  socket = io(`${process.env.NEXT_PUBLIC_BACKEND_URL}`, {
    transports: ["websocket"],
    autoConnect: true,
    extraHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  return socket;
};

export const getSocket = (): Socket | null => socket;
