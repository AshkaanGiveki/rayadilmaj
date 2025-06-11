// "use client";

// import { useEffect, useState } from "react";
// import styles from "./SearchBox.module.scss";
// import Image from "next/image";
// import searchIcon from "@/public/assets/images/search.png";
// import client from "@/public/assets/images/profile.png";
// import ProfileAvatar from "../profileAvatar/ProfileAvatar";
// import { getColorFromId } from "@/utils/getColorFromId";
// import SearchInput from "../searchInput/SearchInput";
// import noResult from "@/public/assets/images/no-result.png";
// import refresh from "@/public/assets/images/refresh.png";
// import { useInvoice } from "@/context/InvoiceContext";
// // import socket from "@/lib/socket";
// import { useAuth } from "@/context/AuthContext";
// import { useRouter } from "next/navigation";
// import { useSocket } from "@/context/SocketContext";

// export default function SearchBox({ officeId, customers, setCustomers, customerId, setCustomerId }) {
//   const { setCustomer: setInvoiceCustomer } = useInvoice(); // 🆕 get function from context


//   const { socket } = useSocket();
//   const [search, setSearch] = useState("");
//   // const { loggedIn, user, loading } = useAuth();
//   const [resultsShown, setResultsShown] = useState(false);
//   const [customer, setCustomer] = useState({});
//   const router = useRouter();
//   const selectCustomer = (id) => {
//     setCustomerId(id);
//     const selectedCustomer = customers.find(customer => customer.id === id);
//     setCustomer(selectedCustomer);
//     setResultsShown(false);

//     // ✅ Update invoice context
//     if (selectedCustomer) {
//       setInvoiceCustomer(selectedCustomer);
//     }
//   };

//   useEffect(() => {
//       socket.emit("customer:request", { officeId: officeId, searchTerm: search });
//       socket.on("customer:response", ({ customers }) => {
//         setCustomers(customers.map(c => ({
//           id: c.id,
//           name: c.name,
//           nationalId: c.nationalId,
//           phone: c.phone,
//           mobile: c.mobile,
//           email: c.email,
//           address: c.address,
//           groupName: c.group?.name ?? "بدون گروه", // ✅ only the group name
//         }
//       )));
//       });

//       socket.on("customer:error", (err) => {
//         console.error("Customer load error:", err);
//       });

//       return () => {
//         socket.off("customer:response");
//         socket.off("customer:error");
//       };
//     // }
//   }, [search]);


//   return (
//     <div className={styles.searchBox}>
//       <div className={styles.searchInput}>
//         <div className={styles.avatar}>
//           {customerId != 0 && <ProfileAvatar
//             name={customer.name}
//             style={{
//               width: '24px',
//               height: '24px',
//               background: getColorFromId(customers.findIndex(c => c.id === customer.id)),
//               border: `2px solid ${getColorFromId(customers.findIndex(c => c.id === customer.id))}`
//             }}
//             fontSize="0.7rem"
//           />
//           }
//           {customerId == 0 && <Image alt='مشتری' src={client} className={styles.client}></Image>}
//         </div>
//         <div className={styles.input} onClick={() => setResultsShown(true)}>{customerId === 0 ? "انتخاب مشتری" : customer.name}</div>
//         <Image alt="search" src={searchIcon} className={styles.searchIcon}></Image>
//       </div>
//       <div className={`${styles.searchPoolFrame} ${resultsShown ? styles.active : ''}`}>
//         <div className={styles.poolOutside} onClick={() => setResultsShown(false)}></div>
//         <div className={`${styles.searchPool} AutoHeight`}>
//           <h4>انتخاب مشتری
//             {customers.length > 0 && <a href="/dashboard/contacts/addContact" target="_blank">تعریف مشتری جدید</a>}
//             <div className={styles.refreshFrame}>
//               <Image src={refresh} alt="رفرش لیست مشتریان" title="رفرش لیست مشتریان"/>
//             </div>    
//           </h4>
//           {(customers.length > 0 || search != "") && <div className={styles.filters}>
//             <div className={styles.searchFrame}>
//               <SearchInput
//                 value={search}
//                 onChange={setSearch}
//                 placeholder="در بین مشتریان جستجو کنید..."
//               />
//             </div>
//           </div>}
//           <div className={`${styles.customersList} AutoHeight`}>
//             {customers.length > 0 ? (
//               <ul className={`${styles.customers} AutoHeight`}>
//                 {customers.map((customer, index) => (
//                   <li
//                     key={customer.id}
//                     className={styles.customer}
//                     onClick={() => selectCustomer(customer.id)}
//                   >
//                     <div className={styles.avatar}>
//                       <ProfileAvatar
//                         name={customer.name}
//                         style={{
//                           width: "32px",
//                           height: "32px",
//                           background: getColorFromId(index),
//                           border: `2px solid ${getColorFromId(index)}`,
//                         }}
//                         fontSize="0.7rem"
//                       />
//                     </div>
//                     <div className={styles.name}>{customer.name}</div>
//                     <div className={styles.phoneNo}>{customer.mobile}</div>
//                     <div className={styles.group}>{customer.groupName}</div>
//                   </li>
//                 ))}
//               </ul>
//             ) : search.trim() !== "" ? (
//               <div className={styles.emptyState}>
//                 <Image
//                   src={noResult}
//                   alt="هیچ مشتری‌ای یافت نشد"
//                   width={100}
//                   height={100}
//                 />
//                 <p>مشتری‌ای با این مشخصات یافت نشد.</p>
//               </div>
//             ) : (
//               <div className={styles.emptyState}>
//                 <Image
//                   src={noResult}
//                   alt="هیچ مشتری‌ای یافت نشد"
//                   width={100}
//                   height={100}
//                 />
//                 <p>هنوز هیچ مشتری‌ای ثبت نشده است.</p>
//                 <a
//                   href="/dashboard/contacts/addContact"
//                   target="_blank"
//                   className={styles.addCustomerLink}
//                 >
//                   ایجاد مشتری جدید
//                 </a>
//               </div>
//             )}

//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import styles from "./SearchBox.module.scss";
import Image from "next/image";
import searchIcon from "@/public/assets/images/search.png";
import client from "@/public/assets/images/profile.png";
import ProfileAvatar from "../profileAvatar/ProfileAvatar";
import { getColorFromId } from "@/utils/getColorFromId";
import SearchInput from "../searchInput/SearchInput";
import noResult from "@/public/assets/images/no-result.png";
import refresh from "@/public/assets/images/refresh.png";
import { useInvoice } from "@/context/InvoiceContext";
import { useRouter } from "next/navigation";
import { useSocket } from "@/context/SocketContext";

export default function SearchBox({ officeId, customers, setCustomers, customerId, setCustomerId }) {
  const { setCustomer: setInvoiceCustomer } = useInvoice();
  const { socket } = useSocket();
  const [search, setSearch] = useState("");
  const [resultsShown, setResultsShown] = useState(false);
  const [customer, setCustomer] = useState({});
  const router = useRouter();

  const selectCustomer = (id) => {
    setCustomerId(id);
    const selectedCustomer = customers.find(customer => customer.id === id);
    setCustomer(selectedCustomer);
    setResultsShown(false);
    if (selectedCustomer) {
      setInvoiceCustomer(selectedCustomer);
    }
  };

  const fetchCustomers = () => {
    socket.emit("customer:request", { officeId, searchTerm: search });
  };

  useEffect(() => {
    fetchCustomers();

    const handleResponse = ({ customers }) => {
      setCustomers(customers.map(c => ({
        id: c.id,
        name: c.name,
        nationalId: c.nationalId,
        phone: c.phone,
        mobile: c.mobile,
        email: c.email,
        address: c.address,
        groupName: c.group?.name ?? "بدون گروه",
      })));
    };

    const handleError = (err) => {
      console.error("Customer load error:", err);
    };

    socket.on("customer:response", handleResponse);
    socket.on("customer:error", handleError);

    return () => {
      socket.off("customer:response", handleResponse);
      socket.off("customer:error", handleError);
    };
  }, [search]);

  return (
    <div className={styles.searchBox}>
      <div className={styles.searchInput}>
        <div className={styles.avatar}>
          {customerId !== 0 ? (
            <ProfileAvatar
              name={customer.name}
              style={{
                width: '24px',
                height: '24px',
                background: getColorFromId(customers.findIndex(c => c.id === customer.id)),
                border: `2px solid ${getColorFromId(customers.findIndex(c => c.id === customer.id))}`
              }}
              fontSize="0.7rem"
            />
          ) : (
            <Image alt='مشتری' src={client} className={styles.client} />
          )}
        </div>
        <div className={styles.input} onClick={() => setResultsShown(true)}>
          {customerId === 0 ? "انتخاب مشتری" : customer.name}
        </div>
        <Image alt="search" src={searchIcon} className={styles.searchIcon} />
      </div>

      <div className={`${styles.searchPoolFrame} ${resultsShown ? styles.active : ''}`}>
        <div className={styles.poolOutside} onClick={() => setResultsShown(false)}></div>
        <div className={`${styles.searchPool} AutoHeight`}>
          <h4>
            انتخاب مشتری
            {customers.length > 0 && (
              <a href="/dashboard/contacts/addContact" target="_blank">تعریف مشتری جدید</a>
            )}
            <div className={styles.refreshFrame} onClick={fetchCustomers}>
              <Image src={refresh} alt="رفرش لیست مشتریان" title="رفرش لیست مشتریان" />
            </div>
          </h4>

          {(customers.length > 0 || search !== "") && (
            <div className={styles.filters}>
              <div className={styles.searchFrame}>
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="در بین مشتریان جستجو کنید..."
                />
              </div>
            </div>
          )}

          <div className={`${styles.customersList} AutoHeight`}>
            {customers.length > 0 ? (
              <ul className={`${styles.customers} AutoHeight`}>
                {customers.map((customer, index) => (
                  <li
                    key={customer.id}
                    className={styles.customer}
                    onClick={() => selectCustomer(customer.id)}
                  >
                    <div className={styles.avatar}>
                      <ProfileAvatar
                        name={customer.name}
                        style={{
                          width: "32px",
                          height: "32px",
                          background: getColorFromId(index),
                          border: `2px solid ${getColorFromId(index)}`,
                        }}
                        fontSize="0.7rem"
                      />
                    </div>
                    <div className={styles.name}>{customer.name}</div>
                    <div className={styles.phoneNo}>{customer.mobile}</div>
                    <div className={styles.group}>{customer.groupName}</div>
                  </li>
                ))}
              </ul>
            ) : search.trim() !== "" ? (
              <div className={styles.emptyState}>
                <Image src={noResult} alt="هیچ مشتری‌ای یافت نشد" width={100} height={100} />
                <p>مشتری‌ای با این مشخصات یافت نشد.</p>
              </div>
            ) : (
              <div className={styles.emptyState}>
                <Image src={noResult} alt="هیچ مشتری‌ای یافت نشد" width={100} height={100} />
                <p>هنوز هیچ مشتری‌ای ثبت نشده است.</p>
                <a
                  href="/dashboard/contacts/addContact"
                  target="_blank"
                  className={styles.addCustomerLink}
                >
                  ایجاد مشتری جدید
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
