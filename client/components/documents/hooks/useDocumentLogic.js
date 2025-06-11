"use client";

import { useEffect, useState, useRef } from "react";
import { useInvoice } from "@/context/InvoiceContext";
import styles from "../Documents.module.scss";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";

const PersianTitles = {
  base: "تعرفه پایه",
  trSeal: "مهر مترجم",
  MJAppr: "تاییدیه دادگستری",
  MJServ: "خدمات دادگستری",
  MJStamp: "تمبر دادگستری",
  MFAppr: "تاییدیه خارجه",
  MFServ: "خدمات خارجه",
  specialService: "خدمات خاص",
  naatiSeal: "مهر ناتی",
  extraPercent: "درصد اضافی",
  emergency: "فوریت",
  extra: "نسخه اضافی"
};

export function useDocumentLogic(defaultDocData) {
  const { invoice, addDocument, updateDocument, confirmDocument, isDocumentChanged } = useInvoice();
  const [editingCell, setEditingCell] = useState(null);
  const { socket } = useSocket();
  const { currentDocID, setCurrentDocID } = useInvoice();
  const { user } = useAuth();

  const handledOnceRef = useRef(false);
  
  const currentDoc = invoice.draftDocs?.[currentDocID - 1] ?? null;
  const [updatingExistingDoc, setUpdatingExistingDoc] = useState(false);
  const [updatingCurrentDoc, setUpdatingCurrentDoc] = useState(false);
  const isValid = currentDoc?.docTypeId && currentDoc?.originLangId && currentDoc?.destinationLangId && invoice.customer.id;

  const ensurePricingRows = (doc) =>
    doc?.pricingRows?.map(row => ({
      ...row,
      title: PersianTitles[row.key] || row.title
    })) ?? [];

  const getComputedRows = () => {
    if (!currentDoc) return [];

    const rows = ensurePricingRows(currentDoc);
    const systemRows = rows.filter(r => r.system);
    const customRows = rows.filter(r => !r.system);
    const q = currentDoc.baseNo + currentDoc.extraApprNo;

    const computedSystemRows = systemRows.map(row => {
      let quantity = 0;
      let visible = false;
      switch (row.key) {
        case "base":
          quantity = currentDoc.baseNo;
          visible = currentDoc.trSeal || currentDoc.unofficial;
          return {
            ...row,
            quantity,
            visible,
            unitPrice: row.editable ? row.unitPrice : currentDoc.unofficial ? 0 : row.unitPrice,
          };
        case "trSeal":
          quantity = q;
          visible = currentDoc.trSeal;
          break;
        case "MJAppr":
        case "MJServ":
        case "MJStamp":
          quantity = q;
          visible = currentDoc.MJAppr;
          break;
        case "MFAppr":
        case "MFServ":
          quantity = q;
          visible = currentDoc.MFAppr;
          break;
        case "SpecialServ":
        case "specialService":
          quantity = currentDoc.specialServNo;
          visible = quantity > 0;
          break;
        case "naatiSeal":
          quantity = q;
          visible = currentDoc.naatiSeal;
          break;
        default:
          return row;
      }
      return { ...row, quantity, visible };
    });

    const baseRow = rows.find(r => r.key === "base");
    const basePrice = baseRow?.unitPrice ?? 0;
    const extraVisible = currentDoc.extraNo + currentDoc.extraApprNo > 0;
    const extra = {
      key: "extra",
      title: PersianTitles.extra,
      unitPrice: Math.floor(basePrice * (currentDoc.extraPercent / 100)),
      quantity: currentDoc.extraNo + currentDoc.extraApprNo,
      visible: extraVisible,
      editable: false,
      system: true,
    };

    const subtotal = [...computedSystemRows, extra, ...customRows]
      .filter(r => r.visible)
      .reduce((sum, r) => sum + r.unitPrice * r.quantity, 0);

    const emergencyValue = Math.floor(subtotal * (currentDoc.emergency / 100));
    const emergency = {
      key: "emergency",
      title: PersianTitles.emergency,
      unitPrice: emergencyValue,
      quantity: 1,
      visible: emergencyValue > 0,
      editable: false,
      system: true,
    };

    return [...computedSystemRows, extra, ...customRows, emergency];
  };

  const calculateFinalPrice = () => 
    getComputedRows().filter(r => r.visible).reduce((sum, r) => sum + r.unitPrice * r.quantity, 0);



  const updateFinalPrice = (docId) => {
    const finalPrice = calculateFinalPrice();
    console.log(finalPrice);
    updateDocument(docId, { finalPrice });
  };

  const handleChange = (docId, key, val) => {
    const doc = invoice.draftDocs.find(d => d.id === docId);
    if (!doc) return;

    let updated = { [key]: val };
    let updatedPricingRows = ensurePricingRows(doc);

    if ((key === "unofficial" && doc.unofficial === true) || (key === "trSeal" && doc.trSeal === true)) return;

    if (key === "unofficial" && val === true) {
      updated = {
        unofficial: true,
        trSeal: false,
        MJAppr: false,
        MFAppr: false,
        naatiSeal: false,
      };
      updatedPricingRows = updatedPricingRows.map(row =>
        row.key === "base" ? { ...row, unitPrice: 0, editable: true } : row
      );
      updateDocument(docId, { ...updated, pricingRows: updatedPricingRows });
      return;
    }

    if (key === "trSeal" && val === true) {
      updated = { unofficial: false, trSeal: true };
      const baseDefault = defaultDocData?.pricingRows?.find(r => r.key === "base")?.unitPrice ?? 0;
      updatedPricingRows = updatedPricingRows.map(row =>
        row.key === "base" ? { ...row, unitPrice: baseDefault, editable: true } : row
      );
      updateDocument(docId, { ...updated, pricingRows: updatedPricingRows });
      return;
    }

    updateDocument(docId, { [key]: val });

    if (!socket) return;

    if (["originLangId", "destinationLangId", "docTypeId"].includes(key)) {
      const originLangId = key === "originLangId" ? val : doc.originLangId;
      const destinationLangId = key === "destinationLangId" ? val : doc.destinationLangId;
      const docTypeId = key === "docTypeId" ? val : doc.docTypeId;

      if (originLangId && destinationLangId && docTypeId) {
        socket.emit("tariff:getDefaultRows", {
          officeId: invoice.office.id,
          originLangId,
          destinationLangId,
          documentTypeId: docTypeId,
        });
      }
    }
  };

  const handleAddDocument = () => {
    const newId = Date.now();
    addDocument({ ...defaultDocData, id: newId, pricingRows: [] }, true);
    setCurrentDocID(invoice.draftDocs.length + 1);
  };

  const handleConfirmDocument = () => {
    if (!socket || !currentDoc || !isValid) return;
    updateFinalPrice(currentDoc.id);

    if (!invoice.id) {
      socket.emit("invoice:create", {
        clientId: user?.userId,
        customerId: invoice.customer.id,
        officeId: invoice.office.id,
        status: "DRAFT",
        receptionDate: invoice.receptionDate,
        deliveryDate: invoice.deliveryDate,
      });

      socket.once("invoice:created", (createdInvoice) => {
        confirmDocument(currentDoc.id);
        socket.emit("document:confirm", {
          ...currentDoc,
          invoiceId: createdInvoice.id,
        });
        socket.once("document:confirmed", (confirmedDoc) => {
          toast.success("مدرک با موفقیت افزوده شد");
          updateDocument(currentDoc.id, { id: confirmedDoc.id });
          handleAddDocument();
        });
      });

      setUpdatingCurrentDoc(true);

      return;
    }

    confirmDocument(currentDoc.id);
    setUpdatingCurrentDoc(true);

    if (updatingExistingDoc) {
      socket.emit("document:update", {
        currentId: currentDoc.id,
        document: { ...currentDoc, invoiceId: invoice.id },
      });
      toast.success("مدرک با موفقیت به روز رسانی شد.");
      setCurrentDocID(invoice.draftDocs.length);
    } else {
      socket.emit("document:confirm", {
        ...currentDoc,
        invoiceId: invoice.id,
      });
      socket.once("document:confirmed", (confirmedDoc) => {
        toast.success("مدرک با موفقیت افزوده شد");
        updateDocument(currentDoc.id, { id: confirmedDoc.id });
        handleAddDocument();
      });
    }

    
  };

  const updateRow = (key, field, value) => {
    const updatedRows = ensurePricingRows(currentDoc).map(row =>
      row.key === key ? { ...row, [field]: value } : row
    );
    updateDocument(currentDoc.id, { pricingRows: updatedRows });
    updateFinalPrice(currentDoc.id);
  };

  const swapLangs = (docId, origId, destId, origName, destName, origIcon, destIcon) => {
    updateDocument(docId, {
      originLangId: destId,
      destinationLangId: origId,
      originLangName: destName,
      destinationLangName: origName,
      originLangIcon: destIcon,
      destinationLangIcon: origIcon,
    });
  };

  const addCustomRow = () => {
    const newRow = {
      key: `custom-${Date.now()}`,
      title: "هزینه دلخواه",
      unitPrice: 0,
      quantity: 1,
      editable: true,
      visible: true,
      system: false,
    };
    const updated = [...ensurePricingRows(currentDoc), newRow];
    updateDocument(currentDoc.id, { pricingRows: updated });
    updateFinalPrice(currentDoc.id);

    setTimeout(() => {
      const bodyEl = document.querySelector(`.${styles.prices} .${styles.body}`);
      if (bodyEl) {
        bodyEl.scrollTo({ top: bodyEl.scrollHeight, behavior: "smooth" });
      }
    }, 0);
  };

  // useEffect(() => {
  //   if (!socket || !currentDoc) return;
  //   socket.on("tariff:pricesFetched", ({ rows, error }) => {
  //     if (error) return toast.error(error);
  //     if (rows) {
  //       const translatedRows = rows.map(r => ({ ...r, title: PersianTitles[r.key] || r.title }));
  //       updateDocument(currentDoc.id, { pricingRows: translatedRows });
  //       updateFinalPrice(currentDoc.id);
  //       toast.success("تعرفه با موفقیت دریافت شد");
  //     }
  //   });

  //   return () => {
  //     if (socket) socket.off("tariff:pricesFetched");
  //   };
  // }, [socket, currentDoc]);

  useEffect(() => {
    if (!socket || !currentDoc) return;
  
    const handleTariffPricesFetched = ({ rows, error }) => {
      if (handledOnceRef.current) return;
      handledOnceRef.current = true;
  
      if (error) return toast.error(error);
      if (rows) {
        const translatedRows = rows.map(r => ({ ...r, title: PersianTitles[r.key] || r.title }));
        updateDocument(currentDoc.id, { pricingRows: translatedRows });
        updateFinalPrice(currentDoc.id);
        toast.success("تعرفه با موفقیت دریافت شد");
      }
    };
  
    socket.off("tariff:pricesFetched").on("tariff:pricesFetched", handleTariffPricesFetched);
  
    return () => {
      socket.off("tariff:pricesFetched", handleTariffPricesFetched);
      handledOnceRef.current = false; // reset on unmount
    };
  }, [socket, currentDoc]);
  

  useEffect(() => {
    if (!currentDoc) return;
    updateFinalPrice(currentDoc.id);
  }, [
    currentDoc?.trSeal,
    currentDoc?.MJAppr,
    currentDoc?.MFAppr,
    currentDoc?.specialServNo,
    currentDoc?.baseNo,
    currentDoc?.extraNo,
    currentDoc?.extraApprNo,
    currentDoc?.extraPercent,
    currentDoc?.emergency,
    currentDoc?.naatiSeal,
  ]);

  useEffect(() => {
    const doc = invoice.draftDocs[currentDocID - 1];
    const existsInConfirmed = invoice.docs.some(d => d.id === doc?.id);
    setUpdatingExistingDoc(existsInConfirmed || updatingCurrentDoc);
  }, [currentDocID, updatingCurrentDoc]);

  useEffect(() => {
    setUpdatingCurrentDoc(false);
  }, [currentDocID]);

  return {
    invoice,
    currentDoc,
    editingCell,
    setEditingCell,
    currentDocID,
    setCurrentDocID,
    isDraft: invoice.draftDocs.some(d => d.id === currentDoc?.id),
    isValid,
    handleChange,
    handleAddDocument,
    handleConfirmDocument,
    updateRow,
    swapLangs,
    addCustomRow,
    isDocumentChanged,
    getComputedRows,
    updatingExistingDoc,
  };
}
