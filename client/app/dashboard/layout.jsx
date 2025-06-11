// import Navbar from "@/components/navbar/Navbar";
// import styles from './layout.module.scss';

// export default function DashboardLayout({ children, preview }) {
//   return (
//     // preview ||

//     <div className={styles.page}>
//       <Navbar />
//       <main className={`${styles.content} AutoHeight`}>
//         {children}
//       </main>
//     </div>
//   );
// }
// app/dashboard/layout.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/navbar/Navbar";
import styles from './layout.module.scss';

export default function DashboardLayout({ children }) {
  const { loggedIn, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !loggedIn) {
      router.replace("/auth/login");
    }
  }, [loading, loggedIn]);

  if (loading || !loggedIn) return null;

  return (<div className={styles.page}>
    <Navbar />
    <main className={`${styles.content} AutoHeight`}>
      {children}
    </main>
  </div>);
}
