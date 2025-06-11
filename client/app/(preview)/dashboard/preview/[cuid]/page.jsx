"use client";

import InvoicePreview from "@/components/invoicePreview/InvoicePreview";
import styles from "./preview.module.scss";
import { InvoiceProvider } from "@/context/InvoiceContext";
import React, { useEffect, useState } from "react";
import Loader from "@/components/loader/Loader";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { createSocket } from "@/lib/createSocket"; // ✅ import the builder

export default function Invoice({ params }) {
  const cuid = params?.cuid;

  return (
    <InvoiceProvider>
      <PreviewContent cuid={cuid} />
    </InvoiceProvider>
  );
}

function PreviewContent({ cuid }) {
  const { socket, setSocket, connected } = useSocket();
  const { user, accessToken, loggedIn, loading } = useAuth();
  const [invoiceData, setInvoiceData] = useState(null);

  // 🔐 Redirect if not logged in
  useEffect(() => {
    if (!loading && !loggedIn) {
      window.location.href = "/auth/login";
    }
  }, [loading, loggedIn]);

  // 📄 Fetch invoice after socket is connected
  useEffect(() => {
    if (!cuid || !accessToken || !loggedIn) return;

    const requestInvoice = (s) => {
      s.emit("invoice:request", { invoiceId: cuid });
    };

    const handleInvoice = (data) => {
      setInvoiceData(data);
    };

    const handleError = (msg) => {
      console.error("Invoice fetch error:", msg);
    };

    let activeSocket = socket;

    if (!connected) {
      const newSocket = createSocket(accessToken);
      newSocket.connect();
      newSocket.once("connect", () => {
        setSocket(newSocket);
        requestInvoice(newSocket);
      });
      newSocket.once("connect_error", (err) => {
        console.error("❌ Failed to connect:", err.message);
      });
      activeSocket = newSocket;
    } else {
      requestInvoice(activeSocket);
    }

    activeSocket.on("invoice:full", handleInvoice);
    activeSocket.on("invoice:error", handleError);

    return () => {
      activeSocket.off("invoice:full", handleInvoice);
      activeSocket.off("invoice:error", handleError);
    };
  }, [cuid, loggedIn, connected, accessToken]);

  if (loading || !loggedIn || !invoiceData) {
    return <Loader />;
  }

  return (
    <div className={styles.invoice}>
      <InvoicePreview data={invoiceData} />
    </div>
  );
}
