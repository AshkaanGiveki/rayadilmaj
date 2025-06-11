const xlsx = require('xlsx');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const serviceMap = {
  "تعرفه پایه": "base",
  "مهر مترجم": "trSeal",
  "تاییدیه دادگستری": "MJAppr",
  "تاییدیه خارجه": "MFAppr",
  "مهر ناتی": "naatiSeal",
  "درصد اضافی": "extraPercent",
  "خدمات خاص": "special",
};

async function importTariffFromExcel(buffer, officeId) {
  console.log('🟡 Starting importTariffFromExcel...');

  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);
  console.log(`📄 Parsed ${rows.length} rows from Excel`);

  const tariff = await prisma.tariff.create({
    data: {
      name: 'تعرفه وارد شده از اکسل',
      officeId,
    },
  });
  console.log(`✅ Created tariff with ID: ${tariff.id}`);

  let success = 0;
  let skipped = 0;

  for (const [index, row] of rows.entries()) {
    console.log(`\n🔄 Processing row ${index + 1}`);

    const origin = row['زبان مبدا']?.trim();
    const dest = row['زبان مقصد']?.trim();
    const docTypeName = row['نوع مدرک']?.trim();
    const serviceTitle = row['نوع خدمت']?.trim();
    const rawPrice = row['قیمت'];

    if (!origin || !dest || !docTypeName || !serviceTitle) {
      console.warn('⚠️ Incomplete row, skipping:', row);
      skipped++;
      continue;
    }

    if (!serviceMap.hasOwnProperty(serviceTitle)) {
      console.warn(`⛔ Unknown service title: ${serviceTitle}`);
      skipped++;
      continue;
    }

    const langPair = await prisma.languagePair.findFirst({
      where: {
        source: { name: origin },
        destination: { name: dest },
      },
    });
    if (!langPair) {
      console.warn(`❌ Language pair not found for ${origin} → ${dest}`);
      skipped++;
      continue;
    }

    const docType = await prisma.documentType.findFirst({
      where: { name: docTypeName },
    });
    if (!docType) {
      console.warn(`❌ Document type not found: ${docTypeName}`);
      skipped++;
      continue;
    }

    const serviceKey = serviceMap[serviceTitle];
    const price = typeof rawPrice === 'number' ? Math.round(rawPrice) : 0;

    if (!serviceKey) {
      console.warn(`❌ Invalid serviceKey derived from: ${serviceTitle}`);
      skipped++;
      continue;
    }

    try {
      await prisma.tariffItem.create({
        data: {
          tariffId: tariff.id,
          langPairId: langPair.id,
          documentTypeId: docType.id,
          service: serviceKey,
          price,
        },
      });
      console.log(`✅ Inserted item: ${origin} > ${dest}, ${docTypeName}, ${serviceTitle}`);
      success++;
    } catch (err) {
      console.error(`💥 Failed to insert row ${index + 1}:`, err);
      skipped++;
    }
  }

  console.log(`\n📊 Import complete. Success: ${success}, Skipped: ${skipped}`);
  return { success, skipped, tariffId: tariff.id };
}

module.exports = { importTariffFromExcel };
