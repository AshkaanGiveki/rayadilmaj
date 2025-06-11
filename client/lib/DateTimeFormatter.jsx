import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

/**
 * Converts a UTC or local date (ISO string or Date) to Tehran Jalali date string.
 * @param {string | Date | number} date - ISO string, Date object, or timestamp
 * @param {string} format - Format string like "D MMMM YYYY، HH:mm"
 * @returns {string}
 */
export function DateTimeFormatter(date, format = "D MMMM YYYY، HH:mm") {
  try {
    // Convert to DateObject and shift to Tehran (UTC+3:30)
    // const tehranOffsetMinutes = 3.5 * 60;
    const utc = new Date(date);
    const tehran = new Date(utc.getTime());

    return new DateObject({
      date: tehran,
      calendar: persian,
      locale: persian_fa,
    }).format(format);
  } catch (err) {
    console.warn("Failed to format date:", err);
    return "تاریخ نامعتبر";
  }
}
