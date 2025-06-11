"use client";

import React, { useEffect, useState } from "react";
import styles from "./Documents.module.scss";
import SelectInput from "../selectInput/SelectInput";
import CheckInput from "../checkInput/CheckInput";
import NumberInput from "../numberInput/NumberInput";
import TextInput from "../textInput/TextInput";
import Image from "next/image";
import swapIcon from "@/public/assets/images/swap.png";
import draftIcon from "@/public/assets/images/warning.png";
import arrow from "@/public/assets/images/down-arrow.png";
import langIcon from "@/public/assets/images/language.png";
import DocumentPriceSection from "./DocumentPriceSection";
import { useDocumentLogic } from "./hooks/useDocumentLogic";
import { useInvoice } from "@/context/InvoiceContext";


export default function Documents({ defaultDocData = {}, documentTypes = [], languages = [], languagePairs = [], setLoading, loading }) {
  const {
    invoice,
    currentDoc,
    editingCell,
    setEditingCell,
    isDraft,
    isValid,
    handleChange,
    handleAddDocument,
    handleConfirmDocument,
    updateRow,
    swapLangs,
    addCustomRow,
    isDocumentChanged,
    getComputedRows,
    updatingExistingDoc
  } = useDocumentLogic(defaultDocData);

  const { currentDocID, setCurrentDocID } = useInvoice();
  const originLangOptions = languages.map((lang) => {
    const isValid = languagePairs.some(
      (pair) =>
        pair.sourceId === lang.id &&
        (currentDoc.destinationLangId === 0 || pair.destinationId === currentDoc.destinationLangId)
    );
    return { ...lang, disabled: !isValid };
  });
  
  const destLangOptions = languages.map((lang) => {
    const isValid = languagePairs.some(
      (pair) =>
        pair.destinationId === lang.id &&
        (currentDoc.originLangId === 0 || pair.sourceId === currentDoc.originLangId)
    );
    return { ...lang, disabled: !isValid };
  });
  

  if (!currentDoc) return null;

  const priceRows = getComputedRows();


  return (
    <div className={styles.Documents}>
      <div className={styles.indicator}>
        <Image
          src={arrow}
          className={`${styles.next} ${currentDocID >= invoice.draftDocs.length ? styles.disabled : ""}`}
          alt="مدرک بعدی"
          onClick={() => currentDocID < invoice.draftDocs.length && setCurrentDocID(currentDocID + 1)}
        />
        <div>{invoice.draftDocs.length} / {currentDocID}</div>
        <Image
          src={arrow}
          className={`${styles.prev} ${currentDocID <= 1 ? styles.disabled : ""}`}
          alt="مدرک قبلی"
          onClick={() => currentDocID > 1 && setCurrentDocID(currentDocID - 1)}
        />
      </div>
      {!invoice.docs.some(doc => doc.id === currentDoc.id) && <Image
          src={draftIcon}
          className={styles.draftIcon}
          alt="مدرک ثبت نشده"
          title="مدرک ثبت نشده"
        />}

      <div key={currentDoc.id} className={styles.docItem}>
        <div className={styles.selectFrame}>
          <SelectInput
            title="نوع سند"
            options={documentTypes}
            value={currentDoc.docTypeId}
            onChange={(val) => {
              const selected = documentTypes.find((item) => item.id === val);
              handleChange(currentDoc.id, "docTypeId", val);
              handleChange(currentDoc.id, "docTypeTitle", selected?.value || "مدرک");
            }}
            searchable
          />
        </div>

        <div className={`${styles.row} ${styles.langInputs}`}>
          <div className={styles.halfSelectFrame}>
            <SelectInput
              title="زبان مبدا"
              options={originLangOptions}
              value={currentDoc.originLangId}
              onChange={(val) => {
                const selected = languages.find((item)=>(item.id === val));
                handleChange(currentDoc.id, "originLangId", val);
                handleChange(currentDoc.id, "originLangName", selected?.value);
                handleChange(currentDoc.id, "originLangIcon", selected?.icon);
              }}
              searchable
              hasIcon
              icon={langIcon}
            />
          </div>
          <Image
            className={styles.swapLang}
            alt="جابجایی زبان مبدا و مقصد"
            src={swapIcon}
            onClick={() => swapLangs(currentDoc.id, currentDoc.originLangId, currentDoc.destinationLangId, currentDoc.originLangName, currentDoc.destinationLangName, currentDoc.originLangIcon, currentDoc.destinationLangIcon)}
          />
          <div className={styles.halfSelectFrame}>
            <SelectInput
              title="زبان مقصد"
              options={destLangOptions}
              value={currentDoc.destinationLangId}
              onChange={(val) => {
                const selected = languages.find((item)=>(item.id === val));
                handleChange(currentDoc.id, "destinationLangId", val);
                handleChange(currentDoc.id, "destinationLangName", selected?.value);
                handleChange(currentDoc.id, "destinationLangIcon", selected?.icon);
              }
              }
              searchable
              hasIcon
              icon={langIcon}
            />
          </div>
        </div>

        <div className={`${styles.row} ${styles.checkInputs}`}>
          <div className={styles.tripleSelectFrame}>
            <CheckInput
              title="غیر رسمی / صرفاً جهت تایید"
              value={currentDoc.unofficial}
              onChange={() =>
                handleChange(currentDoc.id, "unofficial", !currentDoc.unofficial)
              }
            />
          </div>

          <div className={styles.tripleSelectFrame}>
            <CheckInput
              title="مهر مترجم"
              value={currentDoc.trSeal}
              onChange={() =>
                handleChange(currentDoc.id, "trSeal", !currentDoc.trSeal )
              }
            />
          </div>

          <div className={styles.tripleSelectFrame}>
            <CheckInput
              title="مهر ناتی"
              value={currentDoc.naatiSeal}
              onChange={(val) => handleChange(currentDoc.id, "naatiSeal", val)}
              disabled={!currentDoc.trSeal}
            />
          </div>
        {/* </div>

        <div className={styles.row}> */}
          <div className={styles.tripleSelectFrame}>
            <CheckInput
              title="تاییدیه دادگستری"
              value={currentDoc.MJAppr}
              onChange={(val) => handleChange(currentDoc.id, "MJAppr", val)}
              disabled={!currentDoc.trSeal}
            />
          </div>

          <div className={styles.tripleSelectFrame}>
            <CheckInput
              title="تاییدیه امور خارجه"
              value={currentDoc.MFAppr}
              onChange={(val) => handleChange(currentDoc.id, "MFAppr", val)}
              disabled={!currentDoc.trSeal}
            />
          </div>
        </div>


        <div className={`${styles.row} ${styles.numberInputs}`}>
          <div className={styles.tripleSelectFrame}>
            <NumberInput
              title="تعداد پایه"
              value={currentDoc.baseNo}
              onChange={(val) => handleChange(currentDoc.id, "baseNo", val)}
              min={1}
            />
            </div>

            <div className={styles.tripleSelectFrame}>
              <NumberInput
                title="نسخه‌های اضافه عادی"
                value={currentDoc.extraNo}
                onChange={(val) => handleChange(currentDoc.id, "extraNo", val)}
              />
              </div>

              <div className={styles.tripleSelectFrame}>
                <NumberInput
                  title="نسخه‌های اضافی با تاییدات"
                  value={currentDoc.extraApprNo}
                  onChange={(val) => handleChange(currentDoc.id, "extraApprNo", val)}
                />
              </div>

                <div className={styles.tripleSelectFrame}>
                  <NumberInput
                    title="تعداد خدمات خاص"
                    value={currentDoc.specialServNo}
                    onChange={(val) => handleChange(currentDoc.id, "specialServNo", val)}
                  />
                </div>

                <div className={styles.tripleSelectFrame}>
                  <NumberInput
                    title="درصد ترجمه نسخه اضافه"
                    value={currentDoc.extraPercent}
                    onChange={(val) => handleChange(currentDoc.id, "extraPercent", val)}
                    step={10}
                  />
                </div>

                <div className={styles.tripleSelectFrame}>
                  <NumberInput
                    title="درصد فوریت"
                    value={currentDoc.emergency}
                    onChange={(val) => handleChange(currentDoc.id, "emergency", val)}
                    step={10}
                    max={1000}
                  />
                </div>
              </div>

              <DocumentPriceSection
                priceRows={priceRows}
                currentDoc={currentDoc}
                updateRow={updateRow}
                editingCell={editingCell}
                setEditingCell={setEditingCell}
                addCustomRow={addCustomRow}
              />


              <div className={styles.docDescription}>
                <TextInput
                  placeholder="توضیحات مدرک"
                  value={currentDoc.description}
                  onChange={(val) => handleChange(currentDoc.id, "description", val)}
                />
              </div>

              <div className={styles.buttonSection}>
                {isDraft && (
                  <button onClick={handleConfirmDocument} disabled={!isValid || !isDocumentChanged(currentDoc)}>
                    {!updatingExistingDoc ? "ثبت مدرک" : "به روز رسانی مدرک"}
                  </button>
                )}
                {/* <button onClick={handleAddDocument}>ایجاد مدرک جدید</button> */}
              </div>
            </div>
          </div>
          );
}
