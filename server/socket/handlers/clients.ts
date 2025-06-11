import { Server, Socket } from 'socket.io';
import { prisma } from '../../prisma/client.js';
import argon2 from 'argon2';
import { Prisma } from '@prisma/client';

interface ClientRegistrationData {
  officeId: string;
  nameEn: string;
  nameFa: string;
  password: string;
  phone: string;
  email: string;
  title: string;
  roleId: string;
  createdAt: string;
  updatedAt: string;
}

interface CustomSocketError {
  message: string;
  code?: string;
}

function normalizeDigits(str: string): string {
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  const englishDigits = '0123456789';

  return str.replace(/[۰-۹]/g, (char) => englishDigits[persianDigits.indexOf(char)] ?? char);
}

export function registerClientHandlers(io: Server, socket: Socket) {
  const client = socket.data.client;
  if (!client) {
    console.warn('❌ Unauthorized socket tried to connect to client handler');
    socket.emit('client:error', { message: 'دسترسی غیرمجاز.' });
    socket.disconnect();
    return;
  }

  async function handleAddClient(event: string, data: ClientRegistrationData) {
    if (!data.officeId) {
      socket.emit('client:error', { message: 'شناسه دفتر ضروری است.' });
      return;
    }

    if (client.officeId !== data.officeId) {
      console.warn(`❌ Unauthorized client (${client.id}) tried to access office ${data.officeId}`);
      socket.emit('client:error', { message: 'دسترسی غیرمجاز به دفتر.' });
      return;
    }

    try {
      const pepper = process.env.PEPPER_SECRET!;
      const hashedPassword = await argon2.hash(data.password + pepper);

      const newClient = await prisma.client.create({
        data: {
          officeId: data.officeId,
          nameEn: data.nameEn,
          nameFa: data.nameFa,
          phone: normalizeDigits(data.phone),
          email: data.email,
          password: hashedPassword,
          title: data.title || null,
          roleId: data.roleId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      socket.emit('client:added', {
        message: 'کاربر با موفقیت ثبت شد.',
        client: newClient,
      });
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const target = (error.meta as { target?: string[] })?.target;
        const targetField = target?.[0];

        const fieldMessages: Record<string, string> = {
          email: 'ایمیل وارد شده قبلاً ثبت شده است.',
          phone: 'شماره تلفن وارد شده قبلاً ثبت شده است.',
          mobile: 'شماره موبایل وارد شده قبلاً ثبت شده است.',
        };

        const errPayload: CustomSocketError = {
          message: fieldMessages[targetField ?? ''] || 'اطلاعات تکراری وارد شده‌اند.',
          code: `duplicate-${targetField}`,
        };

        socket.emit('client:error', errPayload);
        console.warn(`⚠️ ${event} failed: duplicate ${targetField}`);
        return;
      }

      console.error(`❌ ${event} failed:`, error);
      const errPayload: CustomSocketError = {
        message: 'خطا در افزودن کاربر.',
        code: 'server-error',
      };
      socket.emit('client:error', errPayload);
    }
  }

  socket.on('client:add', (data: ClientRegistrationData) => {
    handleAddClient('client:add', data);
  });

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected from client handlers.');
    socket.off('client:add', handleAddClient);
  });
}
