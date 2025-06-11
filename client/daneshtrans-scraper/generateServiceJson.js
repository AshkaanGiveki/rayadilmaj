const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

(async function generateServiceJson() {
  try {
    console.log('[INFO] Fetching page...');
    const response = await axios.get('https://www.daneshtrans.com/rules/official-translation-price/');
    const $ = cheerio.load(response.data);

    const result = [];

    $('table tr').each((_, row) => {
      const cells = $(row).find('th, td');
      if (cells.length < 4) return; // Skip headers or malformed rows

      const columns = [];
      cells.each((_, cell) => {
        columns.push($(cell).text().trim());
      });

      const docType = columns[1].trim();

      const extractService = (text) => {
        const parts = text.split('+');
        if (parts.length > 1) {
          const service = parts[1].trim()
            .replace(/هر/g, '')
            .replace(/[0-9\.\,]+/g, '')
            .trim();
          return service || null;
        }
        return null;
      };

      const service1 = extractService(columns[2] || "");
      const service2 = extractService(columns[3] || "");
      const service = service1 || service2 || null;

      result.push({ name: docType, specialService: service });
    });

    const filename = path.resolve(__dirname, 'document-special-services.json');
    fs.writeFileSync(filename, JSON.stringify(result, null, 2), 'utf-8');
    console.log(`✅ JSON file created: ${filename}`);

  } catch (error) {
    console.error('[ERROR]', error);
  }
})();
