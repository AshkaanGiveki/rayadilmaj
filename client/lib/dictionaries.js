// Invoice status translation
const InvoiceStatusDict = {
    DRAFT: "پیش‌نویس",
    PENDING: "ثبت شده",
    TRANSLATING: "در حال ترجمه",
    DELIVERED: "تحویل شده",
    COMPLETED: "تکمیل شده",
    CANCELLED: "لغو شده"
  };
  
  // Example: user roles dictionary
  const UserRoleDict = {
    Admin: "مدیر",
    Manager: "سرپرست",
    Translator: "مترجم"
  };

    // Example: user roles dictionary
    const TransactionMethods = {
      POS: "کارتخوان",
      CASH: "نقد",
      TRANSFER: "کارت به کارت",
    };
  
  // Generic lookup helper
  function translateValue(dict, key) {
    return dict[key] || key;
  }
  
  // Export everything
  module.exports = {
    InvoiceStatusDict,
    UserRoleDict,
    TransactionMethods,
    translateValue,
  };
  