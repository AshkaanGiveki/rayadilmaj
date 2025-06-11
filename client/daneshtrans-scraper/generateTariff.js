const axios = require('axios');
const cheerio = require('cheerio');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

(async function scrapeAndGenerateXlsxBrowserless() {
    try {
        console.log('[INFO] Fetching page via HTTP request...');
        const response = await axios.get('https://www.daneshtrans.com/rules/official-translation-price/');
        const $ = cheerio.load(response.data);

        console.log('[INFO] Parsing table...');
        const documentTypes = [];
        const basePricesEnglish = [];
        const basePricesNonEnglish = [];
        const additionalServices = [];
        const additionalServicesPricesEnglish = [];
        const additionalServicesPricesNonEnglish = [];

        $('table tr').each((_, row) => {
            const cells = $(row).find('th, td');
            if (cells.length < 4) return; // Skip headers or malformed rows

            const columns = [];
            cells.each((_, cell) => {
                columns.push($(cell).text().trim());
            });

            const docType = columns[1].trim();
            documentTypes.push(docType);

            const extractParts = (text) => {
                const parts = text.split('+');
                let basePrice = parts[0].trim().replace(/[^\d]/g, '');
                let service = "";
                let servicePrice = "";

                if (parts.length > 1) {
                    const afterPlus = parts[1].trim();
                    const priceMatch = afterPlus.match(/([0-9\.\,]+)/);
                    if (priceMatch) {
                        servicePrice = priceMatch[1].replace(/[^\d]/g, '').trim();
                    }
                    service = afterPlus.replace(/هر/g, '').replace(/[0-9\.\,]+/g, '').trim();
                }

                return { basePrice, service, servicePrice };
            };

            const { basePrice: baseEn, service: serviceEn, servicePrice: servicePriceEn } = extractParts(columns[2] || "");
            const { basePrice: baseNonEn, service: serviceNonEn, servicePrice: servicePriceNonEn } = extractParts(columns[3] || "");

            basePricesEnglish.push(baseEn);
            basePricesNonEnglish.push(baseNonEn);
            additionalServices.push(serviceEn || serviceNonEn || "");
            additionalServicesPricesEnglish.push(servicePriceEn || "");
            additionalServicesPricesNonEnglish.push(servicePriceNonEn || "");
        });

        console.log('[INFO] Data extracted. Generating XLSX...');

        const originLanguage = 'فارسی';
        const destinationLanguages = ['انگلیسی', 'آلمانی', 'هلندی', 'پرتغالی', 'فرانسوی', 'اسپانیایی', 'عربی', 'روسی', 'ژاپنی', 'کره‌ای', 'ترکی'];
        const serviceTypes = ['تعرفه پایه', 'مهر مترجم', 'تاییدیه دادگستری', 'تاییدیه خارجه', 'مهر ناتی', 'خدمات خاص', 'درصد اضافی'];

        const fixedPrices = {
            'مهر مترجم': '1000000',
            'تاییدیه دادگستری': '1000000',
            'تاییدیه خارجه': '1000000',
            'مهر ناتی': '1000000',
            'درصد اضافی': '50'
        };

        const data = [['زبان مبدا', 'زبان مقصد', 'نوع مدرک', 'نوع خدمت', 'قیمت']];

        destinationLanguages.forEach(destLang => {
            documentTypes.forEach((docType, index) => {
                serviceTypes.forEach(serviceType => {
                    let price = '';

                    if (serviceType === 'تعرفه پایه') {
                        price = destLang === 'انگلیسی' ? basePricesEnglish[index] : basePricesNonEnglish[index];
                    } else if (serviceType === 'خدمات خاص') {
                        price = destLang === 'انگلیسی' ? additionalServicesPricesEnglish[index] : additionalServicesPricesNonEnglish[index];
                        if (!price) price = '-';
                    } else if (serviceType in fixedPrices) {
                        price = fixedPrices[serviceType];
                    }

                    data.push([originLanguage, destLang, docType, serviceType, price]);
                });
            });
        });

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'تعرفه‌ها');

        const filename = path.resolve(__dirname, 'tariff-template-scraped-browserless.xlsx');
        XLSX.writeFile(workbook, filename);

        console.log(`✅ File created successfully: ${filename}`);
        if (fs.existsSync(filename)) {
            console.log('[INFO] ✔ Confirmed: File exists.');
        } else {
            console.error('[ERROR] ❌ File NOT found after writing. Check permissions or path.');
        }

    } catch (error) {
        console.error('[ERROR]', error);
    }
})();
