"use client";

import React, { useEffect, useState } from "react";
import styles from "./invoiceList.module.scss";
import "@/styles/main.scss";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import SearchInput from "@/components/searchInput/SearchInput";
import Price from "@/components/price/Price";
import { DateTimeFormatter } from "@/lib/DateTimeFormatter";
import { InvoiceStatusDict, translateValue } from '@/lib/dictionaries';
import Loader from "@/components/loader/Loader";
import viewIcon from '@/public/assets/images/view.png';
import Link from "next/link";
import { useSocket } from "@/context/SocketContext";

const InvoiceList = ({ style = {} }) => {
  const { socket } = useSocket();
  const { loggedIn, user, loading } = useAuth();
  const [pageLoading, setPageLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [invoices, setInvoices] = useState([]);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !loggedIn) {
      router.push("/auth/login");
    }
  }, [loading, loggedIn]);

  useEffect(() => {
    if (!loading && user && socket) {
      socket.emit("invoice:fetchList", {
        officeId: user.officeId,
        searchTerm: search,
      });

      const handleListFetched = (data) => {
        setInvoices(data);
        setPageLoading(false);
      };

      socket.on("invoice:listFetched", handleListFetched);

      return () => {
        socket.off("invoice:listFetched", handleListFetched);
      };
    }
  }, [user, loading, socket, search]);

  return (
    <div className={styles.invoiceList} style={{ ...style }}>
      <h1 className={`${styles.pageTitle} ISBo`}>فاکتورها</h1>
      <div className={styles.searchFrame}>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="در بین فاکتورها جستجو کنید..."
        />
      </div>

      <div className={styles.table}>
        <ul className={`${styles.clients} ${styles.header}`}>
          <div className={`${styles.item} ${styles.name} nowrap ISRe`}>صاحب فاکتور</div>
          <div className={`${styles.item} ${styles.group} nowrap ISRe`}>تاریخ دریافت</div>
          <div className={`${styles.item} ${styles.homeNo} nowrap ISRe`}>تاریخ تحویل</div>
          <div className={`${styles.item} ${styles.phoneNo} nowrap ISRe`}>وضعیت سفارش</div>
          <div className={`${styles.item} ${styles.lastUpdate} nowrap ISRe`}>هزینه</div>
          <div className={`${styles.item} ${styles.address} nowrap ISRe`}>مشاهده</div>
        </ul>

        <div className={styles.listContainer}>
          {pageLoading ? (
            <Loader />
          ) : (
            <div className={`${styles.clientsList} AutoHeight`}>
              {invoices.map((invoice) => (
                <ul key={invoice.id} className={styles.clients}>
                  <div className={`${styles.item} ${styles.name} nowrap ISRe`}>
                    {invoice.customerName}
                  </div>
                  <div className={`${styles.item} ${styles.group} nowrap ISRe`}>
                    {DateTimeFormatter(invoice.receptionDate)}
                  </div>
                  <div className={`${styles.item} ${styles.homeNo} nowrap ISRe`}>
                    {DateTimeFormatter(invoice.deliveryDate)}
                  </div>
                  <div className={`${styles.item} ${styles.phoneNo} nowrap ISRe`}>
                    {translateValue(InvoiceStatusDict, invoice.status)}
                  </div>
                  <div className={`${styles.item} ${styles.lastUpdate} nowrap ISRe`}>
                    <Price value={invoice.price} />
                  </div>
                  <Link
                    href={`/dashboard/preview/${invoice.id}`}
                    className={`${styles.item} ${styles.address} nowrap ISRe`}
                  >
                    <Image src={viewIcon} alt="مشاهده" />
                  </Link>
                </ul>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceList;
