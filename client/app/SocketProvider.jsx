// "use client";

// import { useEffect } from "react";
// import socket from "@/lib/socket";

// export default function SocketProvider({ children }) {
//   useEffect(() => {
//     if (!socket.connected) {
//       socket.auth = {};
//       socket.connect();
//     }

//     return () => {
//       // Optional cleanup
//       // socket.disconnect();
//       // socket.removeAllListeners();
//     };
//   }, []);

//   return <>{children}</>;
// }
