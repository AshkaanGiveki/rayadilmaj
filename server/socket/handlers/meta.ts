import { Server, Socket } from 'socket.io';
import { prisma } from '../../prisma/client.js';

export function registerMetaHandlers(io: Server, socket: Socket) {
  const client = socket.data.client;
  if (!client) {
    console.warn('❌ Unauthorized socket tried to request meta data');
    socket.disconnect();
    return;
  }
  // === Handlers Section ===

  async function handleInvoiceMetaRequest(event: string) {
    try {

      // const [documentTypes, languages] = await Promise.all([
      //   prisma.documentType.findMany(),
      //   prisma.language.findMany(),
      // ]);

      // socket.emit('meta:invoiceMetaResponse', { documentTypes, languages });
      const [documentTypes, languages, languagePairs] = await Promise.all([
        prisma.documentType.findMany(),
        prisma.language.findMany(),
        prisma.languagePair.findMany({
          select: {
            sourceId: true,
            destinationId: true,
          },
        }),
      ]);
  
      socket.emit("meta:invoiceMetaResponse", {
        documentTypes,
        languages,
        languagePairs, // ✅ Add this
      });
    } catch (error) {

      console.error('❌ Failed to fetch invoice meta-data:', error);
      socket.emit('meta:invoiceMetaError', 'Failed to fetch invoice metadata.');
    }
  }

  async function handleContactsGroupRequest(event: string) {
    try {
      const customerGroups = await prisma.customerGroup.findMany();
      socket.emit('meta:contactsGroupResponse', customerGroups);
    } catch (error) {
      console.error('❌ Failed to fetch contacts groups:', error);
      socket.emit('meta:contactsGroupError', 'Failed to fetch contacts groups.');
    }
  }
  // === Listeners Section ===
  socket.on('meta:invoiceMetaRequest', () => { handleInvoiceMetaRequest('meta:invoiceMetaRequest') });
  socket.on('meta:contactsGroupRequest', () => { handleContactsGroupRequest('meta:contactsGroupRequest') });
}
