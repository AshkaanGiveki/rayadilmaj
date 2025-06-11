"use client";

import styles from "./invoice.module.scss";
import SearchBox from "@/components/searchBox/SearchBox";
import Documents from "@/components/documents/Documents";
import DateInput from "@/components/dateInput/DateInput";
import { InvoiceProvider } from "@/context/InvoiceContext";
import { useInvoice } from "@/context/InvoiceContext";
import deposit from "@/public/assets/images/deposit.png";
import withdraw from "@/public/assets/images/withdraw.png";
import noPayment from "@/public/assets/images/no-money.png";
import noDocuments from "@/public/assets/images/documents.png";
import returnImg from "@/public/assets/images/return.png";
import Image from "next/image";
import Price from "@/components/price/Price";
import SelectInput from "@/components/selectInput/SelectInput";
import TextInput from "@/components/textInput/TextInput";
import TextAreaInput from "@/components/textAreaInput/TextAreaInput";
import React, { useEffect, useRef, useState } from "react";
import TimeInput from "@/components/timeInput/TimeInput";
import { DateObject } from "react-multi-date-picker";
import remove from '@/public/assets/images/remove.png';
import deal from '@/public/assets/images/deal.png';
import edit from '@/public/assets/images/edit.png';
import arrow from "@/public/assets/images/right.png";
import Loader from "@/components/loader/Loader";
import { setCookie } from 'cookies-next';
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useDocumentLogic } from "@/components/documents/hooks/useDocumentLogic";
import { useSocket } from "@/context/SocketContext";
import { TransactionMethods, translateValue } from '@/lib/dictionaries';
import { createSocket } from "@/lib/createSocket";
import { toast } from "react-toastify";

export default function Invoice() {
  return (
    <InvoiceProvider>
      <InvoiceContent />
    </InvoiceProvider>
  );
}

function InvoiceContent() {
  const { socket, setSocket, connected } = useSocket();
  const { user, accessToken, loggedIn, loading } = useAuth();

  const { invoice, setInvoice, addPayment, updateNewPayment, addDocument, deletePayment, updatePayment } = useInvoice();
  const [addPaymentShown, setAddPaymentShown] = React.useState(false);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [langPairs, setLangPairs] = useState([]);
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState(0);
  const [pageLoading, setPageLoading] = useState(true);
  const { setCurrentDocID, currentDocID, removeDocument } = useInvoice();
  const hasAddedInitialDoc = useRef(false);
  const router = useRouter();

  const defaultDocData = {
    id: null,
    docTypeId: 0,
    docTypeName: "",
    originLangId: 0,
    originLangName: "",
    originLangIcon: "",
    destinationLangId: 0,
    destinationLangName: "",
    destinationLangIcon: "",
    unofficial: false,
    trSeal: true,
    MJAppr: false,
    MFAppr: false,
    naatiSeal: false,
    emergency: 0,
    baseNo: 1,
    extraNo: 0,
    extraApprNo: 0,
    specialServNo: 0,
    extraPercent: 50,
    pricingRows: [],
    description: '',
    finalPrice: 0,
    isChanged: true,
  };

  const { handleAddDocument } = useDocumentLogic(defaultDocData);

  const transactionTypes = [
    { id: 1, value: "دریافت از مشتری" },
    { id: 2, value: "پرداخت به مشتری" },
  ];

  const transactionMethods = [
    { id: 1, value: "نقدی" },
    { id: 2, value: "کارتخوان" },
    { id: 3, value: "کارت به کارت" },
  ];

  const directToPreview = () => {
    window.location.href = `/dashboard/preview/${invoice.id}`;
  };

  useEffect(() => {
    console.log(invoice);
  }, [invoice])

  const toEnglishDigits = (input) =>
    input.replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));


  useEffect(() => {
    console.log("META5");
    if (loading) return;

    console.log("META6");
    if (!loggedIn) {
      console.log("META7");
      router.push("/auth/login");
      return;
    }

    console.log("META4");
    if (!hasAddedInitialDoc.current) {
      handleAddDocument();
      hasAddedInitialDoc.current = true;
    }

    if (!socket || !connected) {
      console.log("⚠️ Waiting for socket to connect...");
      return;
    }

    console.log("META0");
    socket.emit("meta:invoiceMetaRequest");

    const handleMetaResponse = ({ documentTypes, languages, languagePairs }) => {
      setDocumentTypes(documentTypes.map(d => ({
        id: d.id,
        value: d.name,
      })));

      setLanguages(languages.map(l => ({
        id: l.id,
        value: l.name,
        icon: `flags/${l.iconName}.png`,
      })));

      setLangPairs(languagePairs); // ✅ Add this

      console.log("META2");
    };

    const handleMetaError = (err) => {
      console.error("Meta load error:", err);
    };

    socket.on("meta:invoiceMetaResponse", handleMetaResponse);
    socket.on("meta:invoiceMetaError", handleMetaError);

    setPageLoading(false);

    return () => {
      socket.off("meta:invoiceMetaResponse", handleMetaResponse);
      socket.off("meta:invoiceMetaError", handleMetaError);
    };
  }, [loading, loggedIn, user, socket, connected]); // ✅ added `connected`



  useEffect(() => {

    if (!socket || !connected) {
      console.log("⚠️ Waiting for socket to connect...");
      return;
    }




    socket.emit("invoice:update", {
      invoiceId: invoice.id,
      clientId: user?.userId,
      customerId: invoice.customer.id,
      receptionDate: invoice.receptionDate,
      deliveryDate: invoice.deliveryDate,
    });



    socket.on("invoice:updated", (updatedInvoice) => {
      // toast.success("فاکتور با موفقیت به‌روزرسانی شد!");
    });

    socket.on("invoice:error", (updatedInvoice) => {
      // toast.error("به روز رسانی مدرک با خطا مواجه شد!");
    });

    return () => {
      socket.off("invoice:updated");
      socket.off("invoice:error");
    };

  }, [invoice.customer, invoice.deliveryDate, invoice.receptionDate, invoice.client, socket, connected])




  const handleDeletePayment = (paymentId) => {
    deletePayment(paymentId);
    if (socket && socket.connected) {
      socket.emit("payment:deletePayment", {
        paymentId,
        invoiceId: invoice.id,
      });
    }
  };

  const handleUpdatePayment = (updatedPayment) => {
    updatePayment(updatedPayment);
    if (socket && socket.connected) {
      socket.emit("payment:updatePayment", {
        ...updatedPayment,
        invoiceId: invoice.id,
        Date: updatedPayment.Date.toDate().toISOString(),
      });
    }
  };

  const handleSubmitPayment = () => {
    const { value, flow, method, Date: paymentDate, description } = invoice.newPayment;

    if (!value || value <= 0) {
      alert("مبلغ را وارد کنید");
      return;
    }

    if (editingPaymentId) {
      const updated = {
        id: editingPaymentId,
        flow,
        method,
        value,
        Date: paymentDate,
        description,
      };

      handleUpdatePayment(updated);
      setEditingPaymentId(null);
    } else {
      const newId = Date.now();
      const newPayment = {
        id: newId,
        flow,
        method,
        value,
        Date: paymentDate,
        description,
      };

      addPayment(newPayment);

      if (socket && socket.connected) {
        socket.emit("payment:createPayment", {
          invoiceId: invoice.id,
          flow: newPayment.flow,
          method: newPayment.method,
          value: newPayment.value,
          Date: newPayment.Date.toDate().toISOString(),
          description: newPayment.description,
          admin: newPayment.admin,
        });
      }
    }

    updateNewPayment({
      flow: "IN",
      method: "CASH",
      value: "",
      Date: new DateObject(),
      description: "",
    });

    setAddPaymentShown(false);
  };

  const confirmInvoice = () => {
    setInvoice((prev) => ({ ...prev, status: "PENDING" }));
    if (socket && socket.connected) {
      socket.emit("invoice:confirm", {
        invoiceId: invoice.id,
        status: "PENDING",
        price: invoice.price,
        toPay: invoice.toPay,
        discount: invoice.discount,
        paid: invoice.paid,
      });
    }
  };


  return (
    <div className={styles.invoice}>
      {pageLoading ? (<Loader />) : (
        <>
          <div className={`${styles.MainSection} AutoHeight`}>
            <h1 className={`${styles.pageTitle} ISBo`}>صدور فاکتور</h1>
            <div className={styles.scrollable}>
              <div className={`${styles.section} ${styles.invoiceInfo}`}>
                <div className={`${styles.tripleSelectFrame} ${styles.searchBox}`}>
                  <SearchBox officeId={user.officeId} customers={customers} setCustomers={setCustomers} customerId={customerId} setCustomerId={setCustomerId} />
                </div>
                <div className={styles.tripleSelectFrame}>
                  <DateInput
                    value={invoice.receptionDate}
                    onChange={(val) =>
                      setInvoice((prev) => ({ ...prev, receptionDate: val }))
                    }
                    placeholder="تاریخ دریافت"
                    imgTitle="تاریخ دریافت مدارک"
                  />
                </div>
                <div className={styles.tripleSelectFrame}>
                  <DateInput
                    value={invoice.deliveryDate}
                    onChange={(val) =>
                      setInvoice((prev) => ({ ...prev, deliveryDate: val }))
                    }
                    placeholder="تاریخ تحویل"
                    imgTitle="تاریخ تحویل مدارک"
                  />
                </div>
              </div>
              <Documents defaultDocData={defaultDocData} documentTypes={documentTypes} languages={languages} languagePairs={langPairs} setLoading={setPageLoading} loading={pageLoading} />
            </div>
          </div>

          <div className={`${styles.SuppSection} AutoHeight`}>
            <div className={styles.payments}>
              <div className={styles.header}>
                <h1 className="ISRe">پرداخت‌ها و دریافت‌ها</h1>
                <div
                  className={`${styles.addBtn} ${addPaymentShown ? styles.deactive : ""}`}
                  onClick={() => setAddPaymentShown(true)}
                >
                  افزودن رسید
                </div>
              </div>

              {invoice.payments.length > 0 ? (
                <div className={styles.paymentDataFrame}>
                  <ul className={`${styles.paymentList} AutoHeight`}>
                    {invoice.payments.map((p) => (
                      <li key={p.id} className={`${styles.paymentItem} ${p.flow === "IN" ? styles.deposit : styles.withdraw}`}>
                        <div className={`${styles.method} nowrap`}>{translateValue(TransactionMethods, p.method)}</div>
                        <div className={`${styles.value} nowrap`}><Price value={p.value} /></div>
                        <div className={`${styles.date} nowrap`}>{p.Date.format("YYYY/M/D")}</div>
                        <div className={`${styles.description} nowrap`}>{p.description || "بدون توضیحات"}</div>
                        <div className={`${styles.admin} nowrap`}>{p.admin}</div>
                        <Image
                          className={styles.edit}
                          src={edit}
                          alt="ویرایش"
                          onClick={() => {
                            setAddPaymentShown(true);
                            setEditingPaymentId(p.id);
                            updateNewPayment({ ...p });
                          }}
                        />

                        <Image
                          className={styles.delete}
                          src={remove}
                          alt="حذف"
                          onClick={() => handleDeletePayment(p.id)}
                        />


                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className={styles.noPaymentHistory}>
                  <Image src={noPayment} alt="سابقه پرداخت یافت نشد" />
                  <h4>برای این فاکتور،  تابه‌حال تراکنش مالی ثبت نشده‌است.</h4>
                </div>
              )}

              <div className={`${styles.addPayment} ${addPaymentShown ? styles.active : ""}`}>
                <Image
                  className={`${styles.return} ${addPaymentShown ? styles.active : ""}`}
                  src={returnImg}
                  alt="بازگشت"
                  title="بازگشت"
                  onClick={() => setAddPaymentShown(false)}
                />

                <div className={styles.row}>
                  <div className={styles.halfSelectFrame} tabIndex={0} onMouseDown={(e) => e.preventDefault()}>
                    <SelectInput
                      title="نوع تراکنش"
                      options={transactionTypes}
                      value={invoice.newPayment.flow === "IN" ? 1 : 2}
                      onChange={(val) =>
                        updateNewPayment({ flow: val === 1 ? "IN" : "OUT" })
                      }
                    />
                  </div>
                  <div className={styles.halfSelectFrame} tabIndex={0} onMouseDown={(e) => e.preventDefault()}>
                    <SelectInput
                      title="روش پرداخت"
                      options={transactionMethods}
                      value={
                        invoice.newPayment.method === "CASH"
                          ? 1
                          : invoice.newPayment.method === "POS"
                            ? 2
                            : 3
                      }
                      onChange={(val) =>
                        updateNewPayment({
                          method:
                            val === 1 ? "CASH" : val === 2 ? "POS" : "TRANSFER",
                        })
                      }
                    />
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.halfSelectFrame}>
                    <TimeInput
                      value={invoice.newPayment.Date}
                      onChange={(val) => updateNewPayment({ Date: val })}
                      placeholder="زمان پرداخت"
                    />
                  </div>
                  <div className={styles.halfSelectFrame}>
                    <TextInput
                      placeholder="مبلغ به ریال"
                      value={invoice.newPayment.value}
                      onChange={(val) => {
                        const englishVal = toEnglishDigits(val);
                        updateNewPayment({ value: Number(englishVal) });
                      }}
                    />
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.selectFrame}>

                    <TextAreaInput
                      placeholder="توضیحات"
                      value={invoice.newPayment.description}
                      onChange={(val) => updateNewPayment({ description: val })}
                    />


                  </div>
                </div>

                <button className={styles.confirm} onClick={handleSubmitPayment}>
                  ثبت رسید
                </button>
              </div>
            </div>

            <div className={styles.prices}>
              <div className={`${styles.line} ${styles.header}`}>
                <h1 className={styles.title}>لیست مدارک</h1>
              </div>
              {invoice.docs.length > 0 ? (
                <>
                  <div className={styles.body}>

                    {invoice.docs.map((row, idx) => (
                      <div key={row.key} className={`${styles.line} ${styles.header1}`}>
                        <div className={`${styles.item} ${styles.itemTitle} nowrap`}>{row.docTypeTitle}</div>

                        <div className={`${styles.item} ${styles.itemNumber}`}>
                          <span className={`${styles.quantity} ISRe`}>x{row.baseNo + row.extraNo + row.extraApprNo}</span>
                        </div>

                        <div className={`${styles.item} ${styles.itemLang}`}>
                          <Image width={200} height={200} src={`/assets/images/${row.destinationLangIcon}`} alt={row.destinationLangName} />
                          <Image src={arrow} alt="to" />
                          <Image width={24} height={24} src={`/assets/images/${row.originLangIcon}`} alt={row.originLangName} />
                        </div>
                        <div className={`${styles.item} ${styles.itemEdit}`} onClick={() => {
                          setCurrentDocID(idx + 1)
                        }
                        }>
                          <Image src={edit} alt="ویرایش" />
                        </div>
                        <div className={`${styles.item} ${styles.itemDelete}`}>
                          <Image src={remove} alt="حذف" onClick={() => removeDocument(row.id)} />
                        </div>

                        <div className={`${styles.item} ${styles.finalPrice}`}>
                          <Price value={row.finalPrice} />
                        </div>
                      </div>
                    ))}

                  </div>
                  <div className={`${styles.line} ${styles.summary}`}>
                    مجموع: <Price value={invoice.price} />
                  </div>
                </>
              ) : (
                <div className={styles.noConfirmedDocs}>
                  <Image src={noDocuments} alt="مدرکی یافت نشد" />
                  <h4>هنوز مدرکی به این سفارش افزوده نشده‌است.</h4>
                </div>
              )}
            </div>



            {invoice.docs.length > 0 ? (
              <div className={`${styles.financial} AutoHeight`}>
                <div className={`${styles.line} ${styles.header}`}>
                  <h1 className={styles.title}>جزئیات مالی</h1>
                </div>
                <>
                  <div className={styles.body}>
                    <div className={`${styles.line} ${styles.header1}`}>
                      <div className={`${styles.item} ${styles.itemTitle} nowrap`}>هزینه ترجمه و خدمات</div>
                      <div className={`${styles.item} ${styles.finalPrice}`}>
                        <Price value={invoice.price} />
                      </div>
                    </div>
                    <div className={`${styles.line} ${styles.header1}`}>
                      <div className={`${styles.item} ${styles.itemTitle} nowrap`}>دریافتی</div>
                      <div className={`${styles.item} ${styles.finalPrice}`}>
                        <Price value={invoice.paid} />
                      </div>
                    </div>
                    <div className={`${styles.line} ${styles.header1}`}>
                      <div className={`${styles.item} ${styles.itemTitle} nowrap`}>تخفیف</div>

                      <div className={`${styles.item} ${styles.finalPrice}`}>
                        <Price value={invoice.discount} editable={true}
                          onChange={(val) => setInvoice((prev) => ({ ...prev, discount: Number(val) }))}
                        />
                        <Image className={styles.edit} src={edit} alt="ویرایش" />
                      </div>
                    </div>
                  </div>
                  <div className={`${styles.line} ${styles.summary}`}>
                    {invoice.toPay !== 0 ? (
                      <>
                        مانده قابل پرداخت: <Price value={invoice.toPay} />
                      </>
                    ) :
                      <>
                        <Image src={deal} alt="تسویه شده" className={styles.settled} />
                        <div className={styles.settledText}>تسویه‌ شده</div>
                      </>}

                  </div>
                </>
              </div>)
              :
              (
                <div></div>
              )}
            {invoice.docs.length > 0 ? (
              <div className={styles.buttonSection}>
                {invoice.status === "DRAFT" && <button onClick={() => confirmInvoice()} disabled={false}>ثبت فاکتور</button>}
                {invoice.status === "PENDING" && <button className={styles.goToPreview} onClick={() => directToPreview()} disabled={false}>مشاهده فاکتور چاپی</button>}
              </div>
            ) : <></>}
          </div>
        </>
      )}
    </div>
  );
}

