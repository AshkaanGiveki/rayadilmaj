import React, { useMemo, useEffect } from "react";
import styles from "./Documents.module.scss";
import Image from "next/image";
import edit from "@/public/assets/images/edit.png";
import Price from "../price/Price";

export default function DocumentPriceSection({
  priceRows,
  currentDoc,
  setEditingCell,
  editingCell,
  updateRow,
  addCustomRow,
  updateDocument, // 🆕 Add this prop
}) {
  const { finalPrice, rowsToDisplay } = useMemo(() => {
    const validRows = priceRows.filter((r) => r.visible);
    const subtotal = validRows
      .filter((r) => r.key !== "emergency")
      .reduce((sum, r) => sum + (r.unitPrice || 0) * (r.quantity || 0), 0);

    const emergencyValue = validRows.find((r) => r.key === "emergency")?.unitPrice || 0;
    const finalPrice = subtotal + emergencyValue;

    return {
      finalPrice,
      rowsToDisplay: validRows,
    };
  }, [priceRows]);

  // 🆕 This useEffect will update invoice.docs[doc] with finalPrice
  useEffect(() => {
    if (currentDoc && finalPrice !== undefined) {
      updateRow('finalPrice', 'unitPrice', finalPrice);
    }
  }, [finalPrice, currentDoc?.id]);

  return (
    <div className={styles.prices}>
      <div className={`${styles.line} ${styles.header}`}>
        <h1 className={styles.title}>جزئیات تعرفه</h1>
        <div className={styles.addBtn} onClick={addCustomRow}>
          افزودن به صورت دستی
        </div>
      </div>

      <div className={styles.body}>
        {rowsToDisplay.map((row) => (
          <div key={row.key} className={`${styles.line} ${styles.header1}`}>
            {/* Title */}
            <div
              className={`${styles.item} nowrap`}
              onClick={() => !row.system && setEditingCell(`${currentDoc.id}-${row.key}-title`)}
            >
              {editingCell === `${currentDoc.id}-${row.key}-title` ? (
                <input
                  className={styles.inlineInput}
                  value={row.title}
                  onChange={(e) => updateRow(row.key, "title", e.target.value)}
                  onBlur={() => setEditingCell(null)}
                  autoFocus
                />
              ) : (
                row.title
              )}
              {!row.system && <Image className={styles.titleEdit} src={edit} alt="ویرایش" />}
            </div>

            {/* Unit Price */}
            <div
              className={`${styles.item} ${row.editable !== false && editingCell === `${currentDoc.id}-${row.key}` ? styles.editable : ""}`}
              onClick={() => row.editable !== false && setEditingCell(`${currentDoc.id}-${row.key}`)}
            >
              <Price
                value={row.unitPrice}
                editable={row.editable !== false && editingCell === `${currentDoc.id}-${row.key}`}
                onChange={(val) => updateRow(row.key, "unitPrice", Number(val))}
                onBlur={() => setEditingCell(null)}
              />
              {row.editable !== false && <Image className={styles.edit} src={edit} alt="ویرایش" />}
            </div>

            {/* Quantity */}
            <div className={styles.item}>
              {row.system === false ? (
                <input
                  type="text"
                  className={`${styles.inlineInput} ISRe`}
                  value={`x${row.quantity}`.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d])}
                  onChange={(e) => {
                    const english = e.target.value.replace(/[۰-۹]/g, (d) => "0123456789"["۰۱۲۳۴۵۶۷۸۹".indexOf(d)]);
                    const numeric = parseInt(english.replace(/[^0-9]/g, "")) || 0;
                    updateRow(row.key, "quantity", numeric);
                  }}
                  onBlur={() => setEditingCell(null)}
                />
              ) : (
                <span className={`${styles.quantity} ISRe`}>x{row.quantity}</span>
              )}
              {!row.system && <Image className={styles.titleEdit} src={edit} alt="ویرایش" />}
            </div>

            {/* Total Row Price */}
            <div className={styles.item}>
              <Price value={(row.unitPrice || 0) * (row.quantity || 0)} />
            </div>
          </div>
        ))}
      </div>

      <div className={`${styles.line} ${styles.summary}`}>
        مجموع: <Price value={finalPrice} />
      </div>
    </div>
  );
}

