import { Server, Socket } from 'socket.io';
import { prisma } from '../../prisma/client.js';

interface DocumentInput {
  invoiceId: string;
  docTypeId: string;
  unofficial: boolean;
  trSeal: boolean;
  MJAppr: boolean;
  MFAppr: boolean;
  naatiSeal: boolean;
  emergency: number;
  baseNo: number;
  extraNo: number;
  extraApprNo: number;
  specialServNo: number;
  extraPercent: number;
  description?: string;
  finalPrice: number;
  originLangId: string,
  destinationLangId: string,
  pricingRows: {
    key: string;
    title: string;
    unitPrice: number;
    quantity: number;
    editable: boolean;
    visible: boolean;
    system: boolean;
  }[];
}

export function registerDocumentHandlers(io: Server, socket: Socket) {
  const client = socket.data.client;
  if (!client) {
    console.warn('❌ No client attached to socket');
    socket.disconnect();
    return;
  }

  socket.on('document:confirm', async (data: DocumentInput) => {
    if (!data.invoiceId || !data.docTypeId || !data.pricingRows?.length) {
      socket.emit('document:error', 'Missing required document data');
      return;
    }
    const langPair = await prisma.languagePair.findFirst({
      where: {
        sourceId: data.originLangId,  // or document.originLangId in update
        destinationId: data.destinationLangId,
      },
    });
    if (!langPair) {
      socket.emit('document:error', 'Language pair not found');
      return;
    }
    
    try {
      const doc = await prisma.document.create({
        data: {
          invoiceId: data.invoiceId,
          documentTypeId: data.docTypeId,
          languagePairId: langPair.id,
          unofficial: data.unofficial,
          trSeal: data.trSeal,
          MJAppr: data.MJAppr,
          MFAppr: data.MFAppr,
          naatiSeal: data.naatiSeal,
          emergency: data.emergency,
          baseNo: data.baseNo,
          extraNo: data.extraNo,
          extraApprNo: data.extraApprNo,
          specialServNo: data.specialServNo,
          extraPercent: data.extraPercent,
          price: data.finalPrice,
          pricingRows: {
            create: data.pricingRows.map((row) => ({
              key: row.key,
              title: row.title,
              unitPrice: row.unitPrice,
              quantity: row.quantity,
              editable: row.editable,
              visible: row.visible,
              system: row.system,
            })),
          },
          description: data.description,
          isConfirmed: true,
          isChanged: false,
        },
      });

      // Only send to the socket that submitted it — change to io.emit if needed
      socket.emit('document:confirmed', doc);
    } catch (err) {
      console.error('❌ Failed to save document:', err);
      socket.emit('document:error', 'Something went wrong while saving the document');
    }
  });


  socket.on('document:update', async ({ currentId, document }: { currentId: string, document: DocumentInput }) => {
    const langPair = await prisma.languagePair.findFirst({
      where: {
        sourceId: document.originLangId,  // or document.originLangId in update
        destinationId: document.destinationLangId,
      },
    });
    if (!langPair) {
      socket.emit('document:error', 'Language pair not found');
      return;
    }
    try {
      const doc = await prisma.document.update({
        where: {
          id: currentId,
        },
        data: {
          invoiceId: document.invoiceId,
          documentTypeId: document.docTypeId,
          languagePairId: langPair.id, // TODO: Replace with real logic
          unofficial: document.unofficial,
          trSeal: document.trSeal,
          MJAppr: document.MJAppr,
          MFAppr: document.MFAppr,
          naatiSeal: document.naatiSeal,
          emergency: document.emergency,
          baseNo: document.baseNo,
          extraNo: document.extraNo,
          extraApprNo: document.extraApprNo,
          specialServNo: document.specialServNo,
          extraPercent: document.extraPercent,
          price: document.finalPrice,
          pricingRows: {
            deleteMany: {}, // important: clear old rows first
            create: document.pricingRows.map((row) => ({
              key: row.key,
              title: row.title,
              unitPrice: row.unitPrice,
              quantity: row.quantity,
              editable: row.editable,
              visible: row.visible,
              system: row.system,
            })),
          },
          description: document.description,
          isConfirmed: true,
          isChanged: false,
        },
      });
  
      socket.emit('document:updated', doc);
    } catch (err) {
      console.error('❌ Failed to update document:', err);
      socket.emit('document:error', 'Something went wrong while updating the document');
    }
  });
  
}
