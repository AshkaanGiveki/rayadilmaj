import { Server, Socket } from 'socket.io';
import prismaPkg from '@prisma/client';
const { PaymentMethod, PaymentFlow } = prismaPkg;
import { prisma } from '../../prisma/client.js';


interface PaymentData {
  invoiceId: string;
  method: keyof typeof PaymentMethod;
  flow:  keyof typeof PaymentFlow;
  value: number;
  Date: string;
  description: string;

}

export function registerPaymentHandlers(io: Server, socket: Socket) {
  const client = socket.data.client;
  if (!client) {
    console.warn('❌ No client attached to socket');
    socket.disconnect();
    return;
  }

  async function handleCreatePayment(event: string, data: PaymentData) {
    if (!data.invoiceId || !data.value || !data.method || !data.flow || !data.Date) {
      socket.emit('payment:error', 'Missing required fields.');
      return;
    }

    if (!Object.values(PaymentMethod).includes(data.method)) {
      socket.emit('payment:error', 'Invalid payment method');
      return;
    }

    if (!Object.values(PaymentFlow).includes(data.flow)) {
        socket.emit('payment:error', 'Invalid payment flow');
        return;
      }

    try {
        const payment = await prisma.payment.create({
            data: {
              method: data.method,
              type: data.flow,
              value: data.value,
              date: data.Date,
              description: data.description,
              invoice: {
                connect: {
                  id: data.invoiceId,
                }
              }
            },
          });
          

      socket.emit('payment:created', payment);
    } catch (err) {
      console.error(`❌ Failed to handle ${event}:`, err);
      socket.emit('payment:error', `Could not ${event}`);
    }
  }


  socket.on('payment:createPayment', (data: PaymentData) => {
    handleCreatePayment('payment:createPayment', data);
  });
  
  
}
