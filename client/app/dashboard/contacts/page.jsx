'use client';

import React, { useEffect, useState } from "react";
import styles from "./contacts.module.scss";
import "@/styles/main.scss";
import Image from "next/image";
import edit from "@/public/assets/images/edit.png";
import remove from "@/public/assets/images/remove.png";
import SearchInput from "@/components/searchInput/SearchInput";
import socket from "@/lib/socket";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { DateTimeFormatter } from "@/lib/DateTimeFormatter";
import newUserIcon from '@/public/assets/images/new-user.png';
import Link from "next/link";
import { useSocket } from "@/context/SocketContext";


const Contacts = ({ style = {} }) => {

  const { user, loading, loggedIn } = useAuth();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [customers, setCustomers] = useState([]);
  const { socket } = useSocket();



  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === customers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(customers.map((c) => c.id));
    }
  };

  useEffect(() => {
    if (!loading && !loggedIn) {
      router.push("/auth/login");
    }
  }, [loading, loggedIn]);

  // useEffect(() => {
  //   socket.emit("customer:request", { officeId: user?.officeId, searchTerm: search });
  //   socket.on("customer:response", ({ customers }) => {
  //     setCustomers(customers.map(c => ({
  //       id: c.id,
  //       name: c.name,
  //       phone: c.phone,
  //       mobile: c.mobile,
  //       email: c.email,
  //       address: c.address,
  //       description: c.description,
  //       lastUpdate: DateTimeFormatter(c.updatedAt, "D MMMM YYYY"),
  //       groupName: c.group?.name ?? "بدون گروه", // ✅ only the group name
  //     })));



  //   });

  // }, [loggedIn, search])

  useEffect(() => {
    if (!socket || !loggedIn) return;
  
    // Emit once socket is ready
    socket.emit("customer:request", { officeId: user?.officeId, searchTerm: search });
  
    const handleResponse = ({ customers }) => {
      setCustomers(customers.map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        mobile: c.mobile,
        email: c.email,
        address: c.address,
        description: c.description,
        lastUpdate: DateTimeFormatter(c.updatedAt, "D MMMM YYYY"),
        groupName: c.group?.name ?? "بدون گروه",
      })));
    };
  
    socket.on("customer:response", handleResponse);
  
    // Clean up on unmount or socket change
    return () => {
      socket.off("customer:response", handleResponse);
    };
  }, [socket, loggedIn, search]);
  


  const isAllSelected = selectedIds.length === customers.length;

  return (
    <div className={styles.Contacts} style={{ ...style }}>
      <h1 className={`${styles.pageTitle} ISBo`}>مشتریان</h1>
      <div className={styles.searchFrame}>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="در بین مشتریان جستجو کنید..."
        />
      </div>
      <Link href="/dashboard/contacts/addContact" className={styles.newUser}>
        <Image src={newUserIcon} alt="افزودن مشتری جدید" title="افزودن مشتری جدید" />
      </Link>
      <div className={styles.table}>
        <ul className={`${styles.clients} ${styles.header}`}>
          <div className={`${styles.item} ${styles.select} nowrap ISRe`} onClick={toggleSelectAll}>
            <div className={`${styles.square} ${isAllSelected ? styles.selected : ""}`} />
          </div>
          <div className={`${styles.item} ${styles.name} nowrap ISRe`}>نام مشتری</div>
          <div className={`${styles.item} ${styles.group} nowrap ISRe`}>گروه</div>
          <div className={`${styles.item} ${styles.homeNo} nowrap ISRe`}>شماره ثابت</div>
          <div className={`${styles.item} ${styles.phoneNo} nowrap ISRe`}>شماره همراه</div>
          <div className={`${styles.item} ${styles.lastUpdate} nowrap ISRe`}>بروزرسانی</div>
          <div className={`${styles.item} ${styles.address} nowrap ISRe`}>آدرس</div>
          <div className={`${styles.item} ${styles.description} nowrap ISRe`}>توضیحات</div>

          <div className={`${styles.item} ${styles.delete} ${selectedIds.length >= 2 ? styles.active : ""}`}>
            <Image src={remove} alt="remove" />
          </div>
        </ul>

        <div className={styles.listContainer}>
          <div className={`${styles.clientsList} AutoHeight`}>
            {customers.map((customer) => (
              <ul key={customer.id} className={styles.clients}>
                <div className={`${styles.item} ${styles.select}`} onClick={() => toggleSelect(customer.id)}>
                  <div className={`${styles.square} ${selectedIds.includes(customer.id) ? styles.selected : ""}`} />
                </div>
                <div className={`${styles.item} ${styles.name} nowrap`}>{customer.name}</div>
                <div className={`${styles.item} ${styles.group} nowrap`}>{customer.groupName}</div>
                <div className={`${styles.item} ${styles.homeNo} nowrap`}>{customer.phone}</div>
                <div className={`${styles.item} ${styles.phoneNo} nowrap`}>{customer.mobile}</div>
                <div className={`${styles.item} ${styles.lastUpdate} nowrap`}>{customer.lastUpdate}</div>
                <div className={`${styles.item} ${styles.address} nowrap`}>{customer.address}</div>
                <div className={`${styles.item} ${styles.description} nowrap`}>{customer.description}</div>
                <div className={`${styles.item} ${styles.edit}`}>
                  <Image src={edit} alt="edit" />
                </div>
                <div className={`${styles.item} ${styles.delete}`}>
                  <Image src={remove} alt="remove" />
                </div>
              </ul>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contacts;
