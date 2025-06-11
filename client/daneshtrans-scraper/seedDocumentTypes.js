const axios = require('axios');
const cheerio = require('cheerio');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async function seedDocumentTypes() {
  try {
    console.log('[INFO] Fetching data...');
    const response = await axios.get('https://www.daneshtrans.com/rules/official-translation-price/');
    const $ = cheerio.load(response.data);

    const entries = [];

    $('table tr').each((_, row) => {
      const cells = $(row).find('th, td');
      if (cells.length < 4) return;

      const cols = [];
      cells.each((_, cell) => {
        cols.push($(cell).text().trim());
      });

      const name = cols[1].trim();

      const extractService = (text) => {
        const parts = text.split('+');
        if (parts.length > 1) {
          const service = parts[1]
            .replace(/هر/g, '')
            .replace(/[0-9\.,]+/g, '')
            .trim();
          return service || null;
        }
        return null;
      };

      const service1 = extractService(cols[2]);
      const service2 = extractService(cols[3]);
      const specialService = service1 || service2 || null;

      entries.push({ name, specialService });
    });

    console.log(`[INFO] Inserting ${entries.length} document types...`);

    for (const entry of entries) {
        const existing = await prisma.documentType.findFirst({
          where: { name: entry.name }
        });
      
        if (existing) {
          await prisma.documentType.update({
            where: { id: existing.id }, // ✅ use ID here
            data: { specialService: entry.specialService }
          });
        } else {
          await prisma.documentType.create({
            data: {
              name: entry.name,
              specialService: entry.specialService
            }
          });
        }
      }
      

    console.log('✅ Document types seeded into the database.');
  } catch (error) {
    console.error('[ERROR]', error);
  } finally {
    await prisma.$disconnect();
  }
})();
