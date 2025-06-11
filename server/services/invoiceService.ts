import { prisma } from '../prisma/client.js'

export async function createInvoice(data: any) {
  return prisma.invoice.create({
    data,
    include: {
      documents: true,
      payments: true
    }
  })
}
