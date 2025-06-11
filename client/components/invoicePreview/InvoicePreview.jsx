
"use client";

import { useState } from "react";
import styles from "./InvoicePreview.module.scss";
import Image from "next/image";
import pattern from '@/public/assets/images/pattern.svg';
import Price from "../price/Price";
import { DateTimeFormatter } from "@/lib/DateTimeFormatter";
import html2canvas from "html2canvas";
import { InvoiceStatusDict, translateValue } from "@/lib/dictionaries";
import printIcon from '@/public/assets/images/printer.png';
import acrobatIcon from '@/public/assets/images/pdf.png';
import jsPDF from "jspdf";

export default function InvoicePreview({ data }) {
  const handlePrint = async () => {

  const [shouldRender, setShouldRender] = useState(true);


    const element = document.getElementById("printArea");
    if (!element) return;

    const canvas = await html2canvas(element, {
      scale: 3, // sharper and larger
      useCORS: true,
      ignoreElements: (el) => el.classList?.contains("no-print"),
    });

    useEffect(() => {
      if (window.innerWidth < 1600) {
        handleDownloadPDF(); // ⬅️ trigger download directly
        setShouldRender(false); // ⬅️ don't render the full UI
      }
    }, []);

    const imgData = canvas.toDataURL("image/png");

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html dir="rtl">
          <head>
            <title>چاپ فاکتور</title>
            <style>
              @page {
                // margin: 0;
              }
      
              html, body {
                margin: 0;
                padding: 0;
                text-align: center;
                direction: rtl;
              }

              body{
              display: flex;
              justify-content:center;
              align-items:center;
              }
      
              img {
                width: 100vw;
                height: auto;
                max-width: 100%;
              }
            </style>
          </head>
          <body>
            <img src="${imgData}" />
            <script>
              window.onload = function () {
                window.print();
                window.onafterprint = function () {
                  window.close();
                };
              };
            </script>
          </body>
        </html>
      `);

      printWindow.document.close();
    }
  };


const handleDownloadPDF = async () => {
  const element = document.getElementById("printArea");
  if (!element) return;

  const canvas = await html2canvas(element, {
    scale: 3,
    useCORS: true,
    ignoreElements: (el) => el.classList?.contains("no-print"),
  });

  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF({
    orientation: "landscape", // 🔄 landscape mode
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgProps = pdf.getImageProperties(imgData);
  const imgWidth = pageWidth;
  const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

  pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

  // 🕒 Generate timestamp
  const now = new Date();
  const timestamp = now.toLocaleString("sv-SE").replace(/[: ]/g, "-");

  pdf.save(`فاکتور-${timestamp}.pdf`);
};



  return (
    <div className={styles.gridContainer}>
      {/* Print Button - excluded via no-print class */}
      <div className={`no-print ${styles.printButtonWrapper}`}>
        <button className={styles.printButton} onClick={handlePrint}>
          <Image src={printIcon} title="چاپ فاکتور" alt="چاپ فاکتور" />
        </button>
        <button className={styles.printButton} onClick={handleDownloadPDF}>
          <Image src={acrobatIcon} title="PDF ذخیره" alt="PDF ذخیره" />
        </button>

      </div>

      <div id="printArea" className={styles.printArea}>
        <div className={`${styles.gridCell} ${styles.topRow}`}></div>
        <div className={`${styles.gridCell} ${styles.leftCol}`}></div>
        <div className={`${styles.gridCell} ${styles.rightCol}`}></div>
        <div className={`${styles.gridCell} ${styles.bottomRow}`}></div>

        <div className={`${styles.gridCell} ${styles.invoiceInfo}`}>

          <div className={`${styles.gridCell} ${styles.title}`}>تاریخ دریافت</div>
          <div className={`${styles.gridCell} ${styles.value}`}>{DateTimeFormatter(data.receptionDate, "D MMMM YYYY")}</div>

          <div className={`${styles.gridCell} ${styles.title}`}>شماره رسید</div>
          <div className={`${styles.gridCell} ${styles.value}`}>{data.id}</div>

          <div className={`${styles.gridCell} ${styles.title}`}>زمان ثبت</div>
          <div className={`${styles.gridCell} ${styles.value}`}>{DateTimeFormatter(data.createdAt)}</div>

          <div className={`${styles.gridCell} ${styles.title}`}>ثبت کننده</div>
          <div className={`${styles.gridCell} ${styles.value}`}></div>

          <div className={`${styles.gridCell} ${styles.title}`}>وضعیت</div>
          <div className={`${styles.gridCell} ${styles.value}`}>{translateValue(InvoiceStatusDict, data.status)}</div>

          <div className={`${styles.gridCell} ${styles.title}`}>تاریخ تحویل</div>
          <div className={`${styles.gridCell} ${styles.value}`}>{DateTimeFormatter(data.deliveryDate, "D MMMM YYYY")}</div>

        </div>
        <div className={`${styles.gridCell} ${styles.invoiceTitle}`}>
          <Image src={pattern} alt="pattern" />
          رسید مشتری
        </div>
        <div className={`${styles.gridCell} ${styles.invoiceHeader}`}>
          <div className={styles.officeName}>{data.office.name}</div>
          <div className={styles.officeSlang}>{data.office.slang}</div>
        </div>


        <div className={`${styles.gridCell} ${styles.customerInfo}`}>
          <div className={`${styles.gridCell} ${styles.customerInfoItem}`}>
            <div className={styles.title}>نام و نام خانوادگی مشتری:</div>
            <div className={styles.value}>{data.customer.name}</div>
          </div>
          <div className={`${styles.gridCell} ${styles.customerInfoItem}`}>
            <div className={styles.title}>کد ملی مشتری:</div>
            <div className={styles.value}>{data.customer.nationalId}</div>
          </div>
          <div className={`${styles.gridCell} ${styles.customerInfoItem}`}>
            <div className={styles.title}>تلفن مشتری:</div>
            <div className={styles.value}>{data.customer.mobile}</div>
          </div>
        </div>

        <div className={`${styles.gridCell} ${styles.documentsHeader}`}>
          اسناد جهت ترجمه
        </div>

        <div className={`${styles.gridCell} ${styles.documentsTitle}`}>
          <div className={`${styles.gridCell} ${styles.grid_1}`}>ردیف</div>
          <div className={`${styles.gridCell} ${styles.grid_12}`}>نوع سند</div>
          <div className={`${styles.gridCell} ${styles.grid_1}`}>تعداد پایه</div>
          <div className={`${styles.gridCell} ${styles.grid_1}`}>تعداد اضافه</div>
          <div className={`${styles.gridCell} ${styles.grid_1}`}>اضافه + تأیید</div>
          <div className={`${styles.gridCell} ${styles.grid_6}`}>زبان</div>
          <div className={`${styles.gridCell} ${styles.grid_1}`}>سایر</div>
          <div className={`${styles.gridCell} ${styles.grid_1}`}>مهر مترجم</div>
          <div className={`${styles.gridCell} ${styles.grid_2}`}>دادگستری</div>
          <div className={`${styles.gridCell} ${styles.grid_1}`}>امور خارجه</div>
          <div className={`${styles.gridCell} ${styles.grid_1}`}>ناتی</div>
          {/* <div className={`${styles.gridCell} ${styles.grid_1}`}>فوریت</div> */}
          <div className={`${styles.gridCell} ${styles.grid_6}`}>هزینه ترجمه</div>
          <div className={`${styles.gridCell} ${styles.grid_6}`}>توضیحات</div>
        </div>

        <div className={`${styles.gridCell} ${styles.documentsBody}`}>
          {data.documents.map((doc, index) => (
            <div key={index} className={`${styles.gridCell} ${styles.documentItem}`}>
              <div className={`${styles.gridCell} ${styles.grid_1}`}>{index + 1}</div>
              <div className={`${styles.gridCell} ${styles.grid_12}`}>{doc.docTypeName}</div>
              <div className={`${styles.gridCell} ${styles.grid_1}`}>{doc.baseNo}</div>
              <div className={`${styles.gridCell} ${styles.grid_1}`}>{doc.extraNo}</div>
              <div className={`${styles.gridCell} ${styles.grid_1}`}>{doc.extraApprNo}</div>
              <div className={`${styles.gridCell} ${styles.grid_6}`}>{doc.sourceLang} به {doc.destinationLang}</div>
              <div className={`${styles.gridCell} ${styles.grid_1}`}>{!doc.trSeal && "✓"}</div>
              <div className={`${styles.gridCell} ${styles.grid_1}`}>{doc.trSeal && "✓"}</div>
              <div className={`${styles.gridCell} ${styles.grid_2}`}>{doc.MJAppr && "✓"}</div>
              <div className={`${styles.gridCell} ${styles.grid_1}`}>{doc.MFAppr && "✓"}</div>
              <div className={`${styles.gridCell} ${styles.grid_1}`}>{doc.naatiSeal && "✓"}</div>
              {/* <div className={`${styles.gridCell} ${styles.grid_1}`}>{doc.emergency == 0 ? '-' : `${doc.emergency}%`}</div> */}
              <div className={`${styles.gridCell} ${styles.grid_6}`}><Price value={doc.price} /></div>
              <div className={`${styles.gridCell} ${styles.grid_6}`}>{doc.description}</div>
            </div>
          ))}
          {Array.from({ length: 15 - data.documents.length }).map((_, index) => (
            <div key={index} className={`${styles.gridCell} ${styles.documentItem}`}>
              <div className={`${styles.gridCell} ${styles.grid_1}`}></div>
              <div className={`${styles.gridCell} ${styles.grid_12}`}></div>
              <div className={`${styles.gridCell} ${styles.grid_1}`}></div>
              <div className={`${styles.gridCell} ${styles.grid_1}`}></div>
              <div className={`${styles.gridCell} ${styles.grid_1}`}></div>
              <div className={`${styles.gridCell} ${styles.grid_6}`}></div>
              <div className={`${styles.gridCell} ${styles.grid_1}`}></div>
              <div className={`${styles.gridCell} ${styles.grid_1}`}></div>
              <div className={`${styles.gridCell} ${styles.grid_2}`}></div>
              <div className={`${styles.gridCell} ${styles.grid_1}`}></div>
              <div className={`${styles.gridCell} ${styles.grid_1}`}></div>
              {/* <div className={`${styles.gridCell} ${styles.grid_1}`}></div> */}
              <div className={`${styles.gridCell} ${styles.grid_6}`}></div>
              <div className={`${styles.gridCell} ${styles.grid_6}`}></div>
            </div>
          ))}

        </div>


        <div className={`${styles.gridCell} ${styles.documentsOverview}`}>

          {/* <div className={`${styles.gridCell} ${styles.documentsOverviewItem}`}>
        <div className={styles.title}>ترجمه پایه:</div>
        <div className={styles.value}><Price value={200000} /></div>
      </div>
      <div className={`${styles.gridCell} ${styles.documentsOverviewItem}`}>
        <div className={styles.title}>تأیید دادگستری:</div>
        <div className={styles.value}><Price value={200000} /></div>
      </div>
      <div className={`${styles.gridCell} ${styles.documentsOverviewItem}`}>
        <div className={styles.title}>مهر ناتی:</div>
        <div className={styles.value}><Price value={200000} /></div>
      </div>
      <div className={`${styles.gridCell} ${styles.documentsOverviewItem}`}>
        <div className={styles.title}>سایر:</div>
        <div className={styles.value}><Price value={200000} /></div>
      </div>
      <div className={`${styles.gridCell} ${styles.documentsOverviewItem}`}>
        <div className={styles.title}>قابل پرداخت:</div>
        <div className={styles.value}><Price value={200000} /></div>
      </div>
      <div className={`${styles.gridCell} ${styles.documentsOverviewItem}`}>
        <div className={styles.title}>ترجمه اضافه:</div>
        <div className={styles.value}><Price value={200000} /></div>
      </div>
      <div className={`${styles.gridCell} ${styles.documentsOverviewItem}`}>
        <div className={styles.title}>تأیید خارجه:</div>
        <div className={styles.value}><Price value={200000} /></div>
      </div>
      <div className={`${styles.gridCell} ${styles.documentsOverviewItem}`}>
        <div className={styles.title}>خدمات خاص ترجمه:</div>
        <div className={styles.value}><Price value={200000} /></div>
      </div> */}
          <div className={`${styles.gridCell} ${styles.documentsOverviewItem}`}>
            <div className={styles.title}>هزینه کل:</div>
            <div className={styles.value}><Price value={data.price} /></div>
          </div>
          <div className={`${styles.gridCell} ${styles.documentsOverviewItem}`}>
            <div className={styles.title}>پرداختی کل:</div>
            <div className={styles.value}><Price value={data.paid} /></div>
          </div>
          {/* <div className={`${styles.gridCell} ${styles.documentsOverviewItem}`}>
        <div className={styles.title}>مهر مترجم:</div>
        <div className={styles.value}><Price value={200000} /></div>
      </div>
      <div className={`${styles.gridCell} ${styles.documentsOverviewItem}`}>
        <div className={styles.title}>سایر تأییدات:</div>
        <div className={styles.value}><Price value={200000} /></div>
      </div>
      <div className={`${styles.gridCell} ${styles.documentsOverviewItem}`}>
        <div className={styles.title}>فوریت:</div>
        <div className={styles.value}><Price value={200000} /></div>
      </div> */}
          <div className={`${styles.gridCell} ${styles.documentsOverviewItem}`}>
            <div className={styles.title}>تخفیف:</div>
            <div className={styles.value}><Price value={data.discount} /></div>
          </div>
          <div className={`${styles.gridCell} ${styles.documentsOverviewItem}`}>
            <div className={styles.title}>مانده قابل پرداخت:</div>
            <div className={styles.value}><Price value={data.toPay} /></div>
          </div>


        </div>
        <div className={`${styles.gridCell} ${styles.documentsNote}`}>
          ** برای دریافت مدارک، ارائه‌ی این فاکتور الزامی است.
        </div>

      </div>
    </div>
  );
}


