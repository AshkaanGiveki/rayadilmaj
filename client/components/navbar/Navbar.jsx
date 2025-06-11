"use client";
import React from "react";
import styles from "./Navbar.module.scss";
import "@/styles/main.scss";
import Image from "next/image";
import Logo from "@/public/assets/images/logo.png";
import typo from "@/public/assets/images/typo.png";
import Add from "@/public/assets/images/add.png";
import Invoice from "@/public/assets/images/invoice.png";
import Contacts from "@/public/assets/images/contact.png";
import Database from "@/public/assets/images/database.png";
import Settings from "@/public/assets/images/settings.png";
import Logout from "@/public/assets/images/logout.png";
import Link from "next/link";
import ProfileAvatar from "../profileAvatar/ProfileAvatar";
import { useAuth } from "@/context/AuthContext";

const Navbar = ({style = {}}) => {
    const {user} = useAuth();

    const {logout} = useAuth();
  return (
    <div className={styles.Navbar} style={{ ...style }}>
        <Link className={styles.LogoFrame} href="/">
            <Image src={Logo} className={styles.Logo} alt="RayaDilmaj" />
            <Image src={typo} className={styles.typo} alt="RayaDilmaj" />
        </Link>
        <div className={styles.ItemContainer}>
            <Link id={styles.add} className={styles.NavbarItems} href="/dashboard/invoice">
                <Image src={Add} className={`${styles.ItemIcon} toColMain`} alt="New Invoice"  />
                <div className={`ISMe ${styles.ItemTitle}`}>فاکتور جدید</div>
            </Link>
            <Link id={styles.list} className={styles.NavbarItems} href="/dashboard/invoiceList">
                <Image src={Invoice} className={`${styles.ItemIcon} toColMain`} alt="Invoice List"  />
                <div className={`ISMe ${styles.ItemTitle}`}>لیست فاکتورها</div>
            </Link>
            <Link id={styles.contacts} className={styles.NavbarItems} href="/dashboard/contacts">
                <Image src={Contacts} className={`${styles.ItemIcon} toColMain`} alt="Contacts"  />
                <div className={`ISMe ${styles.ItemTitle}`}>مشتریان</div>
            </Link>
            {/* <Link id={styles.dataManagement} className={styles.NavbarItems} href="/dashboard/dataManagement">
                <Image src={Database} className={`${styles.ItemIcon} toColMain`} alt="Data Management"  />
                <div className={`ISMe ${styles.ItemTitle}`}>مدیریت داده ها</div>
            </Link> */}
            <Link id={styles.settings} className={styles.NavbarItems} href="/dashboard/settings">
                <Image src={Settings} className={`${styles.ItemIcon} toColMain`} alt="Settings"  />
                <div className={`ISMe ${styles.ItemTitle}`}>تنظیمات</div>
            </Link>
            <Link id={styles.account} className={styles.NavbarItems} href="/auth/login">
                <div className="AvatarFrame">
                    <ProfileAvatar name={user? user.nameEn : ""} />
                </div>
            </Link>
        </div>
        <div className={styles.LogoutButton}>
            <Image src={Logout} alt="خروج از حساب کاربری" title="خروج از حساب کاربری" className="toColMain" onClick={logout}/>
        </div>
        <Link href="/auth/login">
            <div className={styles.AvatarFrame}>
                <ProfileAvatar name={user? user.nameEn : ""} />
            </div>
        </Link>
    </div>
  );
};

export default Navbar;
