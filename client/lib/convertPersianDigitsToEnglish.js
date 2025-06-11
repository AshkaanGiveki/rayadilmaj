export const convertPersianDigitsToEnglish = (input) => {
    return input.replace(/[۰-۹]/g, (w) => String.fromCharCode(w.charCodeAt(0) - 1728))
                .replace(/[٠-٩]/g, (w) => String.fromCharCode(w.charCodeAt(0) - 1584));
  };
  