import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import styles from "./SelectInput.module.scss";
import arrowIcon from "@/public/assets/images/down-arrow.png";
import "@/styles/main.scss";

const SelectInput = ({
  title,
  options,
  value,
  onChange,
  multiSelect = false,
  style = {},
  searchable = false,
  hasIcon = false,
  icon, // fallback icon when nothing selected
  hasMessage = false,
  messageType = "alert",
  messageText = ""
}) => {
  const [selectedValues, setSelectedValues] = useState(multiSelect ? value || [] : value || "");
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);


  const filteredOptions = options.filter((opt) =>
    opt.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (id) => {
    if (multiSelect) {
      const newValues = selectedValues.includes(id)
        ? selectedValues.filter((val) => val !== id)
        : [...selectedValues, id];
      setSelectedValues(newValues);
      if (onChange) onChange(newValues);
    } else {
      setSelectedValues(id);
      if (onChange) onChange(id);
      setIsOpen(false);
      setSearchTerm("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && searchTerm.trim() !== "" && filteredOptions.length > 0) {
      handleSelect(filteredOptions[0].id);
    }
  };

  const handleKeyDownContainer = (e) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        e.preventDefault();
        setIsOpen(true);
        setActiveIndex(0);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % filteredOptions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) =>
        (prev - 1 + filteredOptions.length) % filteredOptions.length
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selectedOption = filteredOptions[activeIndex];
      if (selectedOption) {
        handleSelect(selectedOption.id);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
    }
  };


  const toggleDropdown = () => {
    if (searchable) {
      setIsOpen(true);
    } else {
      setIsOpen(!isOpen);
    }
    setActiveIndex(0); // reset highlight
  };

  const handleFocus = () => {
    setIsOpen(true);
    setActiveIndex(0); // reset highlight
  };


  useEffect(() => {
    setSelectedValues(multiSelect ? value || [] : value || "");
  }, [value, multiSelect]);

  useEffect(() => {
    if (isOpen && searchable && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, searchable]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedOption = options.find((opt) => opt.id === selectedValues);

  return (
    <div
      tabIndex={0}
      className={styles.selectContainer}
      ref={dropdownRef}
      style={{ ...style }}
      onKeyDown={handleKeyDownContainer}
      onFocus={() => setIsOpen(true)}
      onBlur={(e) => {
        const related = e.relatedTarget;
        // Check if blur target is *inside* the component
        if (!dropdownRef.current.contains(related)) {
          setTimeout(() => {
            setIsOpen(false);
            setSearchTerm(""); // optional
          }, 100); // allow time for click to complete
        }
      }}
    >

      <Image
        src={arrowIcon}
        className={`${isOpen ? styles.active : ""} ${styles.listArrow}`}
        alt="مشاهده گزینه ها"
      />
      <div
        className={`nowrap ${styles.selectedBox} ${isOpen ? styles.active : ""} ${hasMessage ? styles[messageType] : ""
          }`}
        onClick={toggleDropdown}
      >
        {searchable && isOpen ? (
          <input
            ref={inputRef}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            className={styles.searchInput}
            placeholder={`${title} را جستجو کنید...`}
          />
        ) : (
          <>
            {hasIcon && (
              <div className={styles.iconWrapper}>
                <Image
                  src={
                    selectedOption && selectedOption.icon
                      ? `/assets/images/${selectedOption.icon}`
                      : icon
                  }
                  alt="icon"
                  width={24}
                  height={24}
                />
              </div>
            )}
            <span
              className={`${styles.selectedText} ${(multiSelect
                ? selectedValues.length === 0
                : !selectedOption) ? styles.placeholder : ""}`}
            >
              {multiSelect
                ? selectedValues.map((id) => options.find((opt) => opt.id === id)?.value).join(", ") || title
                : selectedOption?.value || title}
            </span>
          </>
        )}
      </div>

      {isOpen && (
        <div className={styles.dropdownMenu}>
          {/* {filteredOptions.length === 0 ? (
            <div className={styles.noResult}>هیچ موردی یافت نشد</div>
          ) : (
            filteredOptions.map((option, index) => (
              <div
                key={option.id}
                tabIndex={-1}
                className={`${styles.option} nowrap
                    ${((multiSelect && selectedValues.includes(option.id)) || selectedValues === option.id)
                    ? styles.selected
                    : ""}
                    ${index === activeIndex ? styles.active : ""}`}
                onClick={() => handleSelect(option.id)}
              >
                {hasIcon && option.icon && (
                  <div className={styles.optionIconWrapper}>
                    <Image src={`/assets/images/${option.icon}`} alt="option-icon" width={24} height={24} />
                  </div>
                )}
                <span className={styles.optionText}>{option.value}</span>
              </div>
            ))
          )} */}
          {filteredOptions.map((option, index) => {
            const isDisabled = option.disabled;
            return (
              <div
                key={option.id}
                tabIndex={-1}
                className={`
                  ${styles.option} nowrap
                  ${index === activeIndex ? styles.active : ""}
                  ${((multiSelect && selectedValues.includes(option.id)) || selectedValues === option.id)
                    ? styles.selected : ""}
                    ${isDisabled ? styles.disabled : ""}
                  `}
                onClick={() => {
                  if (!isDisabled) handleSelect(option.id);
                }}
              >
                {hasIcon && option.icon && (
                  <div className={styles.optionIconWrapper}>
                    <Image src={`/assets/images/${option.icon}`} alt="option-icon" width={24} height={24} />
                  </div>
                )}
                <span className={styles.optionText}>{option.value}</span>
              </div>
            );
          })}

        </div>
      )}

      {hasMessage && (
        <div className={`${styles.message} ${styles[messageType]}`}>
          {messageText}
        </div>
      )}
    </div>
  );
};

export default SelectInput;
