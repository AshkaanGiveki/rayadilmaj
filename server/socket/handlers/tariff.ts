import { Server, Socket } from 'socket.io';
import { prisma } from '../../prisma/client.js';
import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';

interface TariffData {
  officeId: string;
  title: string;
  description: string;
  fileName: string;
}

interface TariffMetaData {
  officeId: string;
}

interface ExcelRow {
  'زبان مبدا': string;
  'زبان مقصد': string;
  'نوع مدرک': string;
  'نوع خدمت': string;
  'قیمت': string | number;
}

const ServiceType = {
  base: 'base',
  trSeal: 'trSeal',
  MJAppr: 'MJAppr',
  MFAppr: 'MFAppr',
  naatiSeal: 'naatiSeal',
  extraPercent: 'extraPercent',
  specialService: 'specialService',
} as const;

type ServiceTypeValue = typeof ServiceType[keyof typeof ServiceType];

export function registerTariffHandlers(io: Server, socket: Socket) {
  const client = socket.data.client;
  if (!client) {
    console.warn('❌ No client attached to socket');
    socket.disconnect();
    return;
  }

  socket.on('tariff:add', (data: TariffData) => handleAddTariff(data));
  socket.on('tariff:fetchAll', (data: TariffMetaData) => handleFetchAllTariffs(data));
  socket.on('tariff:getDefaultRows', (data) => handleGetDefaultRows(data));

  async function handleAddTariff(data: TariffData) {
    if (!data.officeId || !data.title || !data.description || !data.fileName) {
      socket.emit('tariff:error', 'Missing required tariff fields.');
      return;
    }

    try {
      const dilmajOfficeId = process.env.DILMAJOFFICEID;
      const filePath = path.resolve('server/uploads/tariffs', data.fileName);

      if (!fs.existsSync(filePath)) {
        socket.emit('tariff:error', 'Uploaded file not found on server.');
        return;
      }

      const buffer = fs.readFileSync(filePath);
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const firstSheet = workbook.SheetNames[0];
      const sheetData = XLSX.utils.sheet_to_json<ExcelRow>(workbook.Sheets[firstSheet]);

      const newTariff = await prisma.tariff.create({
        data: {
          name: data.title,
          description: data.description,
          officeId: data.officeId,
          dateIssued: new Date(),
          private: data.officeId !== dilmajOfficeId,
        },
      });

      const normalize = (str: string) => str.replace(/[‌‎‏ \s]/g, '').trim();

      const rawServiceMap: [string, ServiceTypeValue][] = [
        ['تعرفه پایه', ServiceType.base],
        ['مهر مترجم', ServiceType.trSeal],
        ['تاییدیه دادگستری', ServiceType.MJAppr],
        ['تاییدیه خارجه', ServiceType.MFAppr],
        ['مهر ناتی', ServiceType.naatiSeal],
        ['درصد اضافی', ServiceType.extraPercent],
        ['خدمات خاص', ServiceType.specialService],
      ];

      const serviceMap: Record<string, ServiceTypeValue> = {};
      for (const [label, value] of rawServiceMap) {
        serviceMap[normalize(label)] = value;
      }

      for (const row of sheetData) {
        const sourceLangName = row['زبان مبدا'];
        const destLangName = row['زبان مقصد'];
        const docTypeName = row['نوع مدرک'];
        const serviceName = row['نوع خدمت'];
        const rawPrice = row['قیمت'];

        const price = parseInt(String(rawPrice).replace(/[^\d]/g, ''));
        if (isNaN(price)) continue;

        const [sourceLang, destLang] = await Promise.all([
          prisma.language.findFirst({ where: { name: sourceLangName } }),
          prisma.language.findFirst({ where: { name: destLangName } }),
        ]);
        if (!sourceLang || !destLang) continue;

        const langPair = await prisma.languagePair.findFirst({
          where: {
            OR: [
              { sourceId: sourceLang.id, destinationId: destLang.id },
              { sourceId: destLang.id, destinationId: sourceLang.id },
            ],
          },
        });
        if (!langPair) continue;

        const docType = await prisma.documentType.findFirst({
          where: { name: docTypeName },
        });
        if (!docType) continue;

        const serviceEnum = serviceMap[normalize(serviceName)];
        if (!serviceEnum) {
          console.warn(`❗ Skipping unknown service: ${serviceName}`);
          continue;
        }

        await prisma.tariffItem.create({
          data: {
            tariffId: newTariff.id,
            langPairId: langPair.id,
            documentTypeId: docType.id,
            service: serviceEnum,
            price,
          },
        });
      }

      socket.emit('tariff:added', newTariff);
    } catch (err) {
      console.error('❌ Failed to handle tariff:add:', err);
      socket.emit('tariff:error', 'Could not add tariff');
    }
  }

  async function handleFetchAllTariffs(data: TariffMetaData) {
    if (!data.officeId) {
      socket.emit('tariff:error', 'Missing officeId.');
      return;
    }

    try {
      const allTariffs = await prisma.tariff.findMany({
        where: {
          OR: [
            { officeId: data.officeId },
            { private: false },
          ],
        },
        orderBy: { dateIssued: 'desc' },
      });

      socket.emit('tariff:list', allTariffs);
    } catch (err) {
      console.error('❌ Failed to handle tariff:fetchAll:', err);
      socket.emit('tariff:error', 'Could not fetch tariffs');
    }
  }

  async function handleGetDefaultRows(data: {
    officeId: string;
    originLangId: string;
    destinationLangId: string;
    documentTypeId: string;
  }) {
    try {
      const office = await prisma.office.findUnique({ where: { id: data.officeId } });
      if (!office?.preferredTariffId) {
        socket.emit('tariff:pricesFetched', { error: 'تعرفه پیش‌فرض برای این دفتر مشخص نشده است.' });
        return;
      }

      const langPair = await prisma.languagePair.findFirst({
        where: {
          OR: [
            { sourceId: data.originLangId, destinationId: data.destinationLangId },
            { sourceId: data.destinationLangId, destinationId: data.originLangId },
          ],
        },
      });

      if (!langPair) {
        socket.emit('tariff:pricesFetched', { error: 'زوج‌زبان مورد نظر یافت نشد.' });
        return;
      }

      const items = await prisma.tariffItem.findMany({
        where: {
          tariffId: office.preferredTariffId,
          langPairId: langPair.id,
          documentTypeId: data.documentTypeId,
        },
      });

      if (!items.length) {
        socket.emit('tariff:pricesFetched', { error: 'تعرفه‌ای برای این ترکیب یافت نشد.' });
        return;
      }

      const rows = items.map((item) => ({
        key: item.service,
        title: item.service,
        unitPrice: item.price,
        quantity: 0,
        visible: false,
        editable: true,
        system: true,
      }));

      socket.emit('tariff:pricesFetched', { rows });
    } catch (err) {
      console.error('❌ Failed to handle tariff:getDefaultRows:', err);
      socket.emit('tariff:pricesFetched', { error: 'خطا در دریافت ردیف‌های تعرفه' });
    }
  }
}
