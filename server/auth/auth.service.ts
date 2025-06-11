import jwt, { JwtPayload } from 'jsonwebtoken';
import { Client, AccessRole } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const ACCESS_EXPIRY = '30m';
const REFRESH_EXPIRY = '36h';

interface ClientWithRole extends Client {
  role: AccessRole | null;
}

// 🎟️ Sign access token (used in /login, /refresh)
export function signAccessToken(client: ClientWithRole): string {
  return jwt.sign(
    {
      userId: client.id,
      userEnName: client.nameEn,
      userFaName: client.nameFa,
      role: client.role?.name ?? null,
      officeId: client.officeId,
    },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRY }
  );
}

// 🔁 Sign refresh token
export function signRefreshToken(client: ClientWithRole): string {
  return jwt.sign(
    {
      userId: client.id,
      tokenVersion: client.tokenVersion,
    },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRY }
  );
}

// ✅ Verify refresh token
export function verifyRefreshToken(
  token: string
): (JwtPayload & { userId: string; tokenVersion: number }) | null {
  try {
    return jwt.verify(token, REFRESH_SECRET) as JwtPayload & {
      userId: string;
      tokenVersion: number;
    };
  } catch {
    return null;
  }
}
