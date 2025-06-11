import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Socket } from "socket.io";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET as string;

// ===============================
// 🛡️ Type for decoded payload
// ===============================
interface AccessTokenPayload extends JwtPayload {
  userId: string;
  userFaName: string;
  userEnName: string;
  role: string;
  officeId: string;
}

// ===============================
// 🔐 Express middleware
// ===============================
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    const payload = jwt.verify(token, ACCESS_SECRET) as AccessTokenPayload;

    const client = await prisma.client.findUnique({
      where: { id: payload.userId },
      include: { role: true },
    });

    if (!client || client.tokenVersion === undefined) {
      return res.status(403).json({ error: "Unauthorized or revoked token" });
    }

    (req as any).client = client;
    next();
  } catch (err: any) {
    console.error("❌ JWT verify error:", err.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}


export async function socketAuthMiddleware(
  socket: Socket,
  next: (err?: Error) => void
) {
  try {

    const authToken = socket.handshake.auth?.token;
    console.log("🔑 token received from client:", authToken);

    if (!authToken || !authToken.startsWith("Bearer ")) {
      console.warn("❌ Invalid or missing token");
      return next(new Error("Access token required"));
    }

    const token = authToken.split(" ")[1];

    const payload = jwt.verify(token, ACCESS_SECRET) as AccessTokenPayload;

    const client = await prisma.client.findUnique({
      where: { id: payload.userId },
      include: { role: true },
    });

    if (!client || client.tokenVersion === undefined) {
      console.warn("❌ Invalid token or missing client in DB");
      return next(new Error("Unauthorized"));
    }

    socket.data.client = client;
    next();
  } catch (err: any) {
    console.error("❌ Socket JWT error:", err.message);
    return next(new Error("Unauthorized"));
  }
}
