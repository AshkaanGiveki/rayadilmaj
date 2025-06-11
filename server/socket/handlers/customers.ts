import { Server, Socket } from 'socket.io';
import { prisma } from '../../prisma/client.js';
import prismaPkg from '@prisma/client';
import { CustomerGroup } from '@prisma/client';
import { DatabaseSync } from 'node:sqlite';

interface CustomerRequestInput {
  officeId: string;
  searchTerm? : string
}

interface CustomerRegistrationData {
  officeId: string;
  name: string,
  nationalId: string,
  phone: string,
  mobile: string,
  email: string,
  address: string,
  customerGroup: string,
  description: string,
}

function normalizeDigits(str: string): string {
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
  const englishDigits = "0123456789";

  return str.replace(/[۰-۹]/g, (char) =>
    englishDigits[persianDigits.indexOf(char)] ?? char
  );
}


export function registerCustomerHandlers(io: Server, socket: Socket) {
  const client = socket.data.client;
  if (!client) {
    console.warn('❌ Unauthorized socket tried to request customer list');
    socket.disconnect();
    return;
  }
  
  async function handleFetchCustomer(event: string, { officeId, searchTerm }: CustomerRequestInput) {


    if (!officeId) {
      socket.emit('customer:error', 'Missing officeId');
      return;
    }
  
    if (client.officeId !== officeId) {
      console.warn(`❌ Unauthorized client (${client.id}) from office (${client.officeId}) tried to access office ${officeId}`);
      socket.emit('customer:error', 'Access denied');
      return;
    }
  
    try {
      const whereClause: any = {
        office: {
          id: officeId,
        },
      };
  
      if (searchTerm && searchTerm.trim() !== '') {
        const normalizedTerm = normalizeDigits(searchTerm.trim());
  
        whereClause.OR = [
          { name: { contains: normalizedTerm, mode: 'insensitive' } },
          { nationalId: { contains: normalizedTerm, mode: 'insensitive' } },
          { phone: { contains: normalizedTerm, mode: 'insensitive' } },
          { mobile: { contains: normalizedTerm, mode: 'insensitive' } },
          { address: { contains: normalizedTerm, mode: 'insensitive' } },
        ];
      }
  
      const customers = await prisma.customer.findMany({
        where: whereClause,
        include: {
          group: { select: { name: true } },
        },
        orderBy: {
          joinedAt: 'desc',
        },
      });
  
      socket.emit('customer:response', { customers });
    } catch (error) {
      console.error('❌ Error fetching customers:', error);
      socket.emit('customer:error', 'Failed to fetch customers');
    }
  }
  
  

  async function handleAddCustomer(event: string, data: CustomerRegistrationData) {
    if (!data.officeId) {
      socket.emit('customer:error', 'Missing officeId');
      return;
    }
    
    if (client.officeId !== data.officeId) {

      console.warn(`❌ Unauthorized client (${client.id}) tried to access office ${data.officeId}`);
      socket.emit('customer:error', 'Access denied');
      return;
    }

    try {
      const newCustomer = await prisma.customer.create({
        data: {
          officeId: data.officeId,
          name: data.name,
          nationalId: data.nationalId,
          phone: data.phone,
          mobile: data.mobile,
          email: data.email,
          address: data.address,
          description: data.description || null,
          groupId: data.customerGroup,
          joinedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      socket.emit('customer:added', { newCustomer });
    } catch (error) {

      console.error('❌ Error adding customer:', error);
      socket.emit('customer:error', 'Failed to add customer');
    }
  };

  socket.on('customer:request', (data: CustomerRequestInput) => {
    handleFetchCustomer('customer:request', data);
  });

  socket.on('customer:add', (data: CustomerRegistrationData) => {
    handleAddCustomer('customer:add', data);
  });
}
