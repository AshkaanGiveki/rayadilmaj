import { Server } from 'socket.io';
import { socketAuthMiddleware } from '../auth/auth.middleware.js';
import { registerInvoiceHandlers } from './handlers/invoice.js';
import { registerDocumentHandlers } from './handlers/documents.js';
import { registerMetaHandlers } from './handlers/meta.js';
import { registerCustomerHandlers } from './handlers/customers.js';
import { registerPaymentHandlers } from './handlers/payment.js';
import { registerClientHandlers } from './handlers/clients.js';
import { registerOfficeHandlers } from './handlers/offices.js';
import { registerTariffHandlers } from './handlers/tariff.js';


export function setupSocketServer(io: Server) {


  // ✅ Enforce socket auth using JWT
  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {

    console.log('🟢 Authenticated socket:', socket.id, 'Client:', socket.data.client?.id);

    registerInvoiceHandlers(io, socket);

    registerDocumentHandlers(io, socket);

    registerMetaHandlers(io, socket);

    registerCustomerHandlers(io, socket);

    registerPaymentHandlers(io, socket);

    registerClientHandlers(io, socket);

    registerOfficeHandlers(io, socket);

    registerTariffHandlers(io, socket);
  });
}
