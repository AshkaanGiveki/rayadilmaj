import { Server, Socket } from 'socket.io';
import { prisma } from '../../prisma/client.js';
import { Prisma } from '@prisma/client';
import argon2 from 'argon2';

// Custom error payload sent to frontend
interface CustomSocketError {
  message: string;
  code?: string;
}

interface OfficeData {
  officeData: {
    name: string;
    slang?: string;
  };
  userData: {
    faName: string;
    enName: string;
    email: string;
    password: string;
    mobile: string;
  };
}

interface OfficeId {
  officeId: string;
}

interface OfficeUpdatePayload {
  officeId: string;
  officeData: {
    name: string;
    slang?: string;
    preferredTariffId: string;
  };
}

export function registerOfficeHandlers(io: Server, socket: Socket) {
  const client = socket.data.client;
  if (!client) {
    console.warn('❌ No client attached to socket');
    socket.emit('office:error', { message: 'اتصال نامعتبر است.' });
    socket.disconnect();
    return;
  }

  async function handleAddOffice(event: string, data: OfficeData) {
    const { officeData, userData } = data;
    console.log(data);
    if (
      !officeData.name ||
      !userData.faName ||
      !userData.enName ||
      !userData.email ||
      !userData.password ||
      !userData.mobile
    ) {
      const errPayload: CustomSocketError = {
        message: 'تمام فیلدهای ضروری باید تکمیل شوند.',
      };
      socket.emit('office:error', errPayload);
      console.warn(`⚠️ ${event} failed: Missing required fields`);
      return;
    }

    try {
      const role = await prisma.accessRole.findFirst({
        where: { name: 'Manager' },
      });

      if (!role) {
        const errPayload: CustomSocketError = {
          message: 'نقش "Manager" در دیتابیس یافت نشد.',
          code: 'missing-role',
        };
        socket.emit('office:error', errPayload);
        console.warn(`⚠️ ${event} failed: Manager role not found`);
        return;
      }

      const defaultTariffId = process.env.DEFAULT_TARIFF_ID;
      if (!defaultTariffId) throw new Error("DEFAULT_TARIFF_ID is not set");
      const office = await prisma.office.create({
        data: {
          name: officeData.name,
          slang: officeData.slang || null,
          preferredTariffId: defaultTariffId,
        },
      });

    const pepper = process.env.PEPPER_SECRET!;
    const hashedPassword = await argon2.hash(data.userData + pepper);
      const clientUser = await prisma.client.create({
        data: {
          nameFa: userData.faName,
          nameEn: userData.enName,
          email: userData.email,
          password: hashedPassword,
          phone: userData.mobile,
          roleId: role.id,
          officeId: office.id,
        },
      });

      socket.emit('office:created', {
        message: 'دارالترجمه و مدیر با موفقیت ایجاد شدند.',
        office,
        clientUser,
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const target = (error.meta as { target?: string[] })?.target;
        const targetField = target?.[0];

        const fieldMessages: Record<string, string> = {
          email: 'ایمیل وارد شده قبلاً ثبت شده است.',
          phone: 'شماره تلفن قبلاً ثبت شده است.',
          mobile: 'شماره موبایل وارد شده قبلاً ثبت شده است.',
        };

        const errPayload: CustomSocketError = {
          message:
            fieldMessages[targetField ?? ''] ||
            'اطلاعات تکراری وارد شده‌اند.',
          code: `duplicate-${targetField}`,
        };

        socket.emit('office:error', errPayload);
        console.warn(`⚠️ ${event} failed: duplicate ${targetField}`);
        return;
      }

      console.error(`❌ ${event} failed:`, error);
      const errPayload: CustomSocketError = {
        message: 'خطا در افزودن دارالترجمه.',
        code: 'server-error',
      };
      socket.emit('office:error', errPayload);
    }
  }


  async function handleFetchOfficeMeta(event: string, data: OfficeId) {
    const { officeId } = data;
  
    if (!officeId) {
      const errPayload: CustomSocketError = {
        message: 'شناسه دارالترجمه ارسال نشده است.',
        code: 'missing-office-id',
      };
      socket.emit('office:error', errPayload);
      console.warn(`⚠️ ${event} failed: Missing officeId`);
      return;
    }
  
    try {
      const office = await prisma.office.findUnique({
        where: { id: officeId },
        select: {
          name: true,
          slang: true,
          preferredTariffId: true,
        },
      });
  
      if (!office) {
        const errPayload: CustomSocketError = {
          message: 'دارالترجمه‌ای با این شناسه یافت نشد.',
          code: 'office-not-found',
        };
        socket.emit('office:error', errPayload);
        console.warn(`⚠️ ${event} failed: Office not found`);
        return;
      }
  
      socket.emit('office:metaFetched', {
        officeId,
        name: office.name,
        slang: office.slang,
        preferredTariffId: office.preferredTariffId,
      });
    } catch (error) {
      console.error(`❌ ${event} failed:`, error);
      const errPayload: CustomSocketError = {
        message: 'خطا در دریافت اطلاعات دارالترجمه.',
        code: 'fetch-meta-failed',
      };
      socket.emit('office:error', errPayload);
    }
  }

  async function handleUpdateOfficeMeta(event: string, data: OfficeUpdatePayload) {
    const { officeId, officeData } = data;

    if (!officeId || !officeData.name || !officeData.preferredTariffId) {
      const errPayload: CustomSocketError = {
        message: 'اطلاعات ناقص است.',
        code: 'missing-update-fields',
      };
      socket.emit('office:error', errPayload);
      console.warn(`⚠️ ${event} failed: Missing fields`);
      return;
    }

    try {
      const updatedOffice = await prisma.office.update({
        where: { id: officeId },
        data: {
          name: officeData.name,
          slang: officeData.slang || null,
          preferredTariffId: officeData.preferredTariffId,
        },
      });

      socket.emit('office:updated', {
        message: 'تغییرات با موفقیت ثبت شد.',
        office: updatedOffice,
      });
    } catch (error) {
      console.error(`❌ ${event} failed:`, error);
      const errPayload: CustomSocketError = {
        message: 'خطا در ثبت تغییرات.',
        code: 'update-failed',
      };
      socket.emit('office:error', errPayload);
    }
  }
  


  socket.on('office:add', (data: OfficeData) => {
    handleAddOffice('office:add', data);
  });

  socket.on('office:fetchMeta', (data: OfficeId) => {
    handleFetchOfficeMeta('office:fetchMeta', data);
  });

  socket.on('office:updateMeta', (data: OfficeUpdatePayload) => {
    handleUpdateOfficeMeta('office:updateMeta', data);
  });


  socket.on('disconnect', () => {
    console.log('🔌 Office client disconnected');
    socket.off('office:add', handleAddOffice);
  });
  
}
