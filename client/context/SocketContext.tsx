"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { Socket } from "socket.io-client";
import { createSocket } from "@/lib/createSocket";
import { useAuth } from "./AuthContext";

interface SocketContextType {
  socket: Socket | null;
  setSocket: (s: Socket | null) => void; // ✅ re-added
  connected: boolean;
}


const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const { accessToken, loggedIn, refreshAccessToken } = useAuth();

  useEffect(() => {
    if (!loggedIn || !accessToken) return;

    const sock = createSocket(accessToken);
    sock.connect();

    sock.on("connect", () => setConnected(true));
    sock.on("disconnect", () => setConnected(false));

    sock.on("connect_error", async (err) => {
      if (err.message === "Access token required" || err.message === "Unauthorized") {
        const newToken = await refreshAccessToken();
        if (newToken) {
          sock.io.opts.extraHeaders = {
            Authorization: `Bearer ${newToken}`,
          };
          sock.connect();
        }
      }
    });

    setSocket(sock);

    return () => {
      sock.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [accessToken, loggedIn]);

  return (
    <SocketContext.Provider value={{ socket, setSocket, connected }}>
      {children}
    </SocketContext.Provider>

  );
};

export const useSocket = (): SocketContextType => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used inside SocketProvider");
  return ctx;
};

// // context/SocketContext.tsx
// "use client";

// import { createContext, useContext, useEffect, useState } from "react";
// import { Socket } from "socket.io-client";
// import { createSocket } from "@/lib/createSocket";
// import { useAuth } from "./AuthContext";

// interface SocketContextType {
//   socket: Socket | null;
//   setSocket: (socket: Socket | null) => void;
//   connected: boolean;
// }

// const SocketContext = createContext<SocketContextType | undefined>(undefined);

// export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
//   const [socket, setSocket] = useState<Socket | null>(null);
//   const [connected, setConnected] = useState(false);

//   const { accessToken, loggedIn } = useAuth();

//   useEffect(() => {
//     if (!loggedIn || !accessToken) return;

//     const sock = createSocket(accessToken);
//     sock.connect();

//     sock.on("connect", () => {
//       setConnected(true);
//     });

//     sock.on("disconnect", () => {
//       setConnected(false);
//     });

//     setSocket(sock);

//     return () => {
//       sock.disconnect();
//       setSocket(null);
//     };
//   }, [accessToken, loggedIn]);

//   return (
//     <SocketContext.Provider value={{ socket, setSocket, connected }}>
//       {children}
//     </SocketContext.Provider>
//   );
// };

// export const useSocket = (): SocketContextType => {
//   const ctx = useContext(SocketContext);
//   if (!ctx) throw new Error("useSocket must be used inside SocketProvider");
//   return ctx;
// };
