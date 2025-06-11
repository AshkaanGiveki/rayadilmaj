import express, { Request, Response } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { setupSocketServer } from './socket/index.js';
import authRoutes from './auth/auth.routes.js';
import uploadTariffRouter from './routes/upload-tariff.js';


dotenv.config() ;

const app = express();
const server = http.createServer(app);

const corsOptions = {
  origin: `${process.env.NEXT_PUBLIC_FRONTEND_URL}`,
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use('/api', uploadTariffRouter);


app.use('/auth', authRoutes);
app.get('/', (_: Request, res: Response) => {
  res.send('✅ Socket.IO backend running');
});

const io = new SocketIOServer(server, {
  cors: corsOptions,
});

setupSocketServer(io);

server.listen(3030, () => {
  console.log(`🚀 Server running on ${process.env.NEXT_PUBLIC_BACKEND_URL}`);
});


