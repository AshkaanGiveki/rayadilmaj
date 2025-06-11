"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { DateObject } from "react-multi-date-picker";
import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";

const InvoiceContext = createContext();
export const useInvoice = () => useContext(InvoiceContext);

export const InvoiceProvider = ({ children }) => {
  const { user, loggedIn, loading } = useAuth();
  const { socket } = useSocket();
  const [currentDocID, setCurrentDocID] = useState(1);

  const [invoice, setInvoice] = useState({
    office: { id: "", name: "", slang: "" },
    receptionDate: new DateObject(),
    deliveryDate: new DateObject().add(1, "days"),
    submitTime: new DateObject(),
    customer: { id: null, name: "" },
    invoiceId: 0,
    status: "DRAFT",
    client: { id: null, name: "" },
    extraExpenses: [],
    draftDocs: [],
    docs: [],
    payments: [],
    newPayment: {
      flow: "IN",
      method: "CASH",
      value: "",
      Date: new DateObject(),
      description: "",
      admin: "",
    },
    price: 0,
    discount: 0,
    paid: 0,
    toPay: 0,
  });

  useEffect(() => {
    if (!loading && loggedIn && user) {
      setInvoice((prev) => ({
        ...prev,
        office: {
          id: user.officeId,
          name: "",
          slang: "",
        },
      }));
    }
  }, [loggedIn, loading, user]);

  const addDocument = (doc, isDraft = false) => {
    const newDoc = {
      ...doc,
      id: Date.now(),
      isChanged: true,
      isConfirmed: !isDraft,
    };
    setInvoice((prev) => ({
      ...prev,
      draftDocs: [...prev.draftDocs, newDoc],
      docs: !isDraft ? [...prev.docs, newDoc] : prev.docs,
    }));
  };

  const getComputedRowsFromDocument = (doc) => {
    if (!doc) return [];
    const rows = Array.isArray(doc.pricingRows) ? doc.pricingRows : [];
    const systemRows = rows.filter(r => r.system);
    const customRows = rows.filter(r => !r.system);
    const q = doc.baseNo + doc.extraApprNo;

    const computedSystemRows = systemRows.map(row => {
      let quantity = row.quantity;
      let visible = row.visible;
      switch (row.key) {
        case "base":
          quantity = doc.baseNo;
          visible = true;
          break;
        case "trSeal":
          quantity = q;
          visible = doc.trSeal;
          break;
        case "naatiSeal":
          quantity = q;
          visible = doc.trSeal && doc.naatiSeal;
          break;
        case "MJAppr":
        case "MJServ":
        case "MJStamp":
          quantity = q;
          visible = doc.MJAppr;
          break;
        case "MFAppr":
        case "MFServ":
          quantity = q;
          visible = doc.MFAppr;
          break;
        case "SpecialServ":
          quantity = doc.specialServNo;
          visible = quantity > 0;
          break;
        default:
          break;
      }
      return { ...row, quantity, visible };
    });

    const baseRow = rows.find(r => r.key === "base");
    const basePrice = baseRow?.unitPrice ?? 0;

    const extra = {
      key: "extra",
      title: "نسخه اضافی",
      unitPrice: Math.floor(basePrice * (doc.extraPercent / 100)),
      quantity: doc.extraNo + doc.extraApprNo,
      visible: (doc.extraNo + doc.extraApprNo) > 0,
      editable: false,
      system: true,
    };

    const subtotal = [...computedSystemRows, extra, ...customRows]
      .filter(r => r.visible)
      .reduce((sum, r) => sum + r.unitPrice * r.quantity, 0);

    const emergency = {
      key: "emergency",
      title: "فوریت",
      unitPrice: Math.floor(subtotal * (doc.emergency / 100)),
      quantity: 1,
      visible: doc.emergency > 0,
      editable: false,
      system: true,
    };

    return [...computedSystemRows, extra, ...customRows, emergency];
  };

  const updateDocument = (id, updates) => {
    setInvoice((prev) => {
      const updateDocWithPrice = (doc) => {
        const newDoc = { ...doc, ...updates, isChanged: true };
        const computedRows = getComputedRowsFromDocument(newDoc);
        console.log(computedRows);
        const finalPrice = computedRows
          .filter(r => r.visible)
          .reduce((sum, r) => sum + r.unitPrice * r.quantity, 0);
        console.log("FinalPrice: " + finalPrice);
        return { ...newDoc, finalPrice };
      };

      return {
        ...prev,
        draftDocs: prev.draftDocs.map((doc) => doc.id === id ? updateDocWithPrice(doc) : doc),
        docs: prev.docs.map((doc) => doc.id === id ? updateDocWithPrice(doc) : doc),
      };
    });
  };

  const confirmDocument = (id) => {
    setInvoice((prev) => {
      const updatedDrafts = prev.draftDocs.map((doc) =>
        doc.id === id ? { ...doc, isConfirmed: true, isChanged: false } : doc
      );
      const confirmedDoc = updatedDrafts.find(d => d.id === id);
      const updatedDocs = prev.docs.some(d => d.id === id)
        ? prev.docs.map(doc => doc.id === id ? { ...confirmedDoc } : doc)
        : [...prev.docs, { ...confirmedDoc }];
      return {
        ...prev,
        draftDocs: updatedDrafts,
        docs: updatedDocs,
      };
    });
  };

  const removeDocument = (id) => {
    setInvoice((prev) => {
      const newDraftDocs = prev.draftDocs.filter((doc) => doc.id !== id);
      const newDocs = prev.docs.filter((doc) => doc.id !== id);

      if (newDraftDocs.length === 0) {
        const newId = Date.now();
        const defaultDoc = {
          id: newId,
          docTypeId: null,
          originLangId: null,
          destinationLangId: null,
          pricingRows: [],
          baseNo: 1,
          extraNo: 0,
          extraApprNo: 0,
          specialServNo: 0,
          extraPercent: 0,
          emergency: 0,
          trSeal: false,
          MJAppr: false,
          MFAppr: false,
          naatiSeal: false,
          unofficial: false,
          isConfirmed: false,
          isChanged: true,
          description: "",
          finalPrice: 0,
        };
        setCurrentDocID(1);
        return {
          ...prev,
          draftDocs: [defaultDoc],
          docs: [],
        };
      }

      const wasLastDoc = id === prev.draftDocs[prev.draftDocs.length - 1]?.id;
      if (wasLastDoc && currentDocID > 1) {
        setCurrentDocID(currentDocID - 1);
      }

      return {
        ...prev,
        draftDocs: newDraftDocs,
        docs: newDocs,
      };
    });
  };

  const addPayment = (payment) => {
    setInvoice((prev) => ({
      ...prev,
      payments: [...prev.payments, { id: Date.now(), ...payment }],
    }));
  };

  const deletePayment = (paymentId) => {
    setInvoice((prev) => ({
      ...prev,
      payments: prev.payments.filter((p) => p.id !== paymentId),
    }));
  };

  const updatePayment = (updatedPayment) => {
    setInvoice((prev) => ({
      ...prev,
      payments: prev.payments.map((p) =>
        p.id === updatedPayment.id ? updatedPayment : p
      ),
    }));
  };

  const updateNewPayment = (updates) => {
    setInvoice((prev) => ({
      ...prev,
      newPayment: { ...prev.newPayment, ...updates },
    }));
  };

  const setCustomer = (customer) => {
    setInvoice((prev) => ({
      ...prev,
      customer: {
        id: customer.id,
        name: customer.name,
      },
    }));
  };

  const isDocumentChanged = (doc) => doc?.isChanged === true;

  useEffect(() => {
    const total = invoice.docs.reduce((sum, doc) => sum + (doc.finalPrice || 0), 0);
    setInvoice((prev) => ({ ...prev, price: total }));
  }, [invoice.docs]);

  useEffect(() => {
    const totalPaid = invoice.payments.reduce(
      (sum, item) => sum + (item.flow === "IN" ? 1 : -1) * item.value,
      0
    );
    setInvoice((prev) => ({ ...prev, paid: totalPaid }));
  }, [invoice.payments]);

  useEffect(() => {
    const toPay = invoice.price - invoice.discount - invoice.paid;
    setInvoice((prev) => ({ ...prev, toPay }));
  }, [invoice.price, invoice.discount, invoice.paid]);

  useEffect(() => {
    if (!socket) return;
    const handler = (createdInvoice) => {
      setInvoice((prev) => ({ ...prev, ...createdInvoice }));
    };
    socket.on("invoice:created", handler);
    return () => socket.off("invoice:created", handler);
  }, [socket]);

  return (
    <InvoiceContext.Provider
      value={{
        invoice,
        setInvoice,
        setCustomer,
        currentDocID,
        setCurrentDocID,
        addDocument,
        updateDocument,
        removeDocument,
        confirmDocument,
        isDocumentChanged,
        addPayment,
        deletePayment,
        updatePayment,
        updateNewPayment,
      }}
    >
      {children}
    </InvoiceContext.Provider>
  );
};
