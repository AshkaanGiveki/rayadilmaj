import { Server, Socket } from 'socket.io';
import prismaPkg from '@prisma/client';
const { InvoiceStatus } = prismaPkg;
import { prisma } from '../../prisma/client.js';

interface InvoiceInput {
  invoiceId: string,
  customerId: string;
  clientId: string,
  officeId: string;
  status: keyof typeof InvoiceStatus;
  receptionDate: string;
  deliveryDate: string;
}

interface InvoiceMeta {
  invoiceId: string;
  status: keyof typeof InvoiceStatus;
  paid: number;
  toPay: number;
  discount: number;
  price: number;
}
interface InvoiceRequestPayload {
  invoiceId: string;
}

interface InvoiceListFetchData {
  officeId: string;
  searchTerm?: string;
}




export function registerInvoiceHandlers(io: Server, socket: Socket) {
  const client = socket.data.client;
  if (!client) {
    console.warn('❌ No client attached to socket');
    socket.disconnect();
    return;
  }

  async function handleCreateInvoice(event: string, data: InvoiceInput) {
    if (!data.customerId || !data.officeId) {
      console.log(data);
      socket.emit('invoice:error', 'Missing required fields: customerId or officeId');
      return;
    }

    if (!Object.values(InvoiceStatus).includes(data.status)) {
      socket.emit('invoice:error', 'Invalid invoice status');
      return;
    }
    
    try {
      
      const invoice = await prisma.invoice.create({
        data: {
          clientId: data.clientId,
          customerId: data.customerId,
          officeId: data.officeId,
          status: data.status,
          receptionDate: new Date(data.receptionDate),
          deliveryDate: new Date(data.deliveryDate),
        },
      });
      
      socket.emit('invoice:created', invoice);
    } catch (err) {
      
      console.error(`❌ Failed to handle ${event}:`, err);
      socket.emit('invoice:error', `Could not ${event}`);
    }
  }


  async function handleUpdateInvoice(event: string, data: InvoiceInput) {
    if (!data.customerId || !data.deliveryDate || !data.receptionDate) {
      socket.emit('invoice:error', 'Missing required fields: customerId or officeId');
      return;
    }

  
    try {
      const updatedInvoice = await prisma.invoice.update({
        where: {
          id: data.invoiceId,
        },
        data: { 
          updatedAt: new Date(),
          customerId: data.customerId,
          clientId: data.clientId,
          receptionDate: new Date(data.receptionDate),
          deliveryDate: new Date(data.deliveryDate),
        },
      });
    
      socket.emit('invoice:updated', updatedInvoice);
    } catch (err) {
      console.error(`❌ Failed to update invoice:`, err);
      socket.emit('invoice:error', 'Could not update invoice');
    }
  }

  // FOR UPDATING THE STATUS OF INVOICE FROM DRAFT TO PENDING WHEN CLICKED ON THE CONFIRM BUTTON ON INVOICE PAGE.

  async function handleConfirmInvoice(event: string, data: InvoiceMeta) {

    if (!data.invoiceId) {
      socket.emit('invoice:error', 'Missing required fields: InvoiceId');
      return;
    }
    try {
      const updatedInvoice = await prisma.invoice.update({
        where: {
          id: data.invoiceId,
        },
        data: {
          status: data.status, 
          updatedAt: new Date(),
          price: data.price,
          toPay: data.toPay,
          discount: data.discount,
          paid: data.paid,
        },
      });
    
      socket.emit('invoice:confirmed', updatedInvoice);
    } catch (err) {
      console.error(`❌ Failed to confirm invoice:`, err);
      socket.emit('invoice:error', 'Could not confirm invoice');
    }
    
    
  }

    // FOR FETCHING THE INFO OF INVOICE TO SHOW IT IN PRINTABLE PREVIEW PAGE.
    
    async function handleRequestInvoice(event: string, data: InvoiceRequestPayload) {
      const { invoiceId } = data;
      const client = socket.data.client;
    
      if (!client) {
        socket.emit("invoice:error", "Unauthorized access");
        return;
      }
    
      if (!invoiceId) {
        socket.emit("invoice:error", "Missing invoiceId");
        return;
      }
    
      try {
        const invoice = await prisma.invoice.findUnique({
          where: { id: invoiceId },
          include: {
            office: true,
            client: true,
            customer: true,
            payments: true,
            documents: {
              include: {
                documentType: true,
                languagePair: {
                  include: {
                    source: true,
                    destination: true,
                  },
                },
                pricingRows: true,
              },
            },
          },
        });
    
        if (!invoice) {
          socket.emit("invoice:error", "Invoice not found");
          return;
        }
    
        // ✅ Check that requesting client is from the same office
        if (invoice.officeId !== client.officeId) {
          socket.emit("invoice:error", "Access denied: not part of invoice's office");
          return;
        }
    
        const paid = invoice.payments.reduce((sum, p) => sum + (p.value || 0), 0);
        const toPay = Math.max(0, invoice.price - paid - invoice.discount);
        socket.emit("invoice:full", {
          id: invoice.id,
          status: invoice.status,
          receptionDate: invoice.receptionDate,
          deliveryDate: invoice.deliveryDate,
          createdAt: invoice.createdAt,
          updatedAt:invoice.updatedAt,
          submissionForm: invoice.submissionForm,
          prescription: invoice.prescription,
    
          office: {
            name: invoice.office.name,
            slang: invoice.office.slang,
          },
          client: invoice.client ? {
            name: invoice.client.nameFa,
            title: invoice.client.title,
          } : null,
          customer: {
            name: invoice.customer.name,
            nationalId: invoice.customer.nationalId,
            phone: invoice.customer.phone,
            mobile: invoice.customer.mobile,
            email: invoice.customer.email,
            address: invoice.customer.address,
          },
    
          payments: invoice.payments,
          discount: invoice.discount,
          price: invoice.price,
          paid: invoice.paid,
          toPay: invoice.toPay,
          extraExpenses: invoice.extraExpenses,
    
          documents: invoice.documents.map((doc) => ({
            id: doc.id,
            docTypeName: doc.documentType.name,
            sourceLang: doc.languagePair.source.name,
            sourceIcon: doc.languagePair.source.iconName,
            destinationLang: doc.languagePair.destination.name,
            destinationIcon: doc.languagePair.destination.iconName,
            unofficial: doc.unofficial,
            trSeal: doc.trSeal,
            MJAppr: doc.MJAppr,
            MFAppr: doc.MFAppr,
            naatiSeal: doc.naatiSeal,
            emergency: doc.emergency,
            baseNo: doc.baseNo,
            extraNo: doc.extraNo,
            extraApprNo: doc.extraApprNo,
            specialServNo: doc.specialServNo,
            extraPercent: doc.extraPercent,
            isConfirmed: doc.isConfirmed,
            isChanged: doc.isChanged,
            price: doc.price,
            description: doc.description,
            pricingRows: doc.pricingRows.map(row => ({
              key: row.key,
              title: row.title,
              unitPrice: row.unitPrice,
              quantity: row.quantity,
              editable: row.editable,
              visible: row.visible,
              system: row.system,
            })),
          })),
        });
    
      } catch (err) {
        console.error("❌ Failed to fetch invoice:", err);
        socket.emit("invoice:error", "An error occurred while loading invoice preview");
      }
    }
    
    async function handleFetchInvoiceList(event: string, data: InvoiceListFetchData) {
      const { officeId, searchTerm = "" } = data;
    
      if (!officeId) {
        socket.emit('invoice:error', 'Missing required fields: officeId');
        return;
      }
    
      try {
        const whereClause: any = {
          officeId,
          status: {
            in: [
              InvoiceStatus.PENDING,
              InvoiceStatus.TRANSLATING,
              InvoiceStatus.DELIVERED,
              InvoiceStatus.COMPLETED,
              InvoiceStatus.CANCELLED,
            ],
          },
        };
    
        if (searchTerm.trim() !== "") {
          whereClause.OR = [
            {
              id: {
                contains: searchTerm,
                mode: "insensitive",
              },
            },
            {
              customer: {
                name: {
                  contains: searchTerm,
                  mode: "insensitive",
                },
              },
            },
            {
              customer: {
                nationalId: {
                  contains: searchTerm,
                  mode: "insensitive",
                },
              },
            },
          ];          
        }
    
        const fetchedInvoices = await prisma.invoice.findMany({
          where: whereClause,
          orderBy: {
            createdAt: "desc",
          },
          include: {
            customer: {
              select: {
                name: true,
              },
            },
          },
        });
    
        const enriched = fetchedInvoices.map((invoice) => ({
          id: invoice.id,
          status: invoice.status,
          receptionDate: invoice.receptionDate,
          deliveryDate: invoice.deliveryDate,
          createdAt: invoice.createdAt,
          updatedAt: invoice.updatedAt,
          customerName: invoice.customer?.name || "",
          price: invoice.price,
          discount: invoice.discount,
          paid: invoice.paid,
          toPay: invoice.toPay,
        }));
    
        socket.emit("invoice:listFetched", enriched);
      } catch (err) {
        console.error("❌ Failed to fetch invoice list:", err);
        socket.emit("invoice:error", "Could not fetch invoice list");
      }
    }
    
    
    
    

  socket.on('invoice:create', (data: InvoiceInput) => {
    handleCreateInvoice('invoice:create', data);
  });

  socket.on('invoice:update', (data: InvoiceInput) => {
    handleUpdateInvoice('invoice:update', data);
  });

  socket.on('invoice:confirm', (data: InvoiceMeta) => {
    handleConfirmInvoice('invoice:confirm', data);
  });

  socket.on('invoice:request', (data: InvoiceRequestPayload) => {
    handleRequestInvoice('invoice:request', data);
  });

  socket.on('invoice:fetchList', (data: InvoiceListFetchData) => {
    handleFetchInvoiceList('invoice:fetchlist', data);
  });
  

  
}
