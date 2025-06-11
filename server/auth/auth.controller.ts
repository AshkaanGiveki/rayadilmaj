import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from './auth.service.js';

dotenv.config();
const prisma = new PrismaClient();
const COOKIE_NAME = 'jid';

function sendRefreshToken(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/auth/refresh',
    // maxAge: 7 * 24 * 60 * 60 * 1000,
    maxAge: 60 * 60 * 1000,
  });
}

// ✅ /me – expects Authorization: Bearer <accessToken>
export const me = async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as any;

    res.json({
      userId: payload.userId,
      nameFa: payload.userFaName,
      nameEn: payload.userEnName,
      role: payload.role,
      officeId: payload.officeId,
    });
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      console.error('⏰ Token expired at:', err.expiredAt);
    }
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ✅ /login – returns accessToken in JSON, sets refresh cookie
export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const client = await prisma.client.findUnique({
    where: { email },
    include: { role: true },
  });

  if (!client || !client.password) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const pepper = process.env.PEPPER_SECRET;
  if (!pepper) {
    res.status(500).json({ error: 'Server misconfigured: missing PEPPER_SECRET' });
    return;
  }

  const isMatch = await argon2.verify(client.password, password + pepper);
  if (!isMatch) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const accessToken = signAccessToken(client);
  const refreshToken = signRefreshToken(client);

  sendRefreshToken(res, refreshToken);

  res.status(200).json({ accessToken }); // ✅ Send access token in JSON only
}

// ✅ /refresh – returns new accessToken in JSON, sets new refresh cookie
export async function refresh(req: Request, res: Response): Promise<void> {
  const token = req.cookies[COOKIE_NAME];
  if (!token) {
    res.status(401).json({ error: 'No token' });
    return;
  }

  const payload = verifyRefreshToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  try {
    const client = await prisma.client.findUnique({
      where: { id: payload.userId },
      include: { role: true },
    });

    if (!client || client.tokenVersion !== payload.tokenVersion) {
      res.status(403).json({ error: 'Token revoked' });
      return;
    }

    const newAccessToken = signAccessToken(client);
    const newRefreshToken = signRefreshToken(client);

    sendRefreshToken(res, newRefreshToken);

    res.status(200).json({ accessToken: newAccessToken }); // ✅ Send new token in JSON only
  } catch (error: any) {
    console.error('💥 Error during refresh process:', error.message || error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ✅ /logout – clears cookies
export async function logout(req: Request, res: Response): Promise<void> {
  const token = req.cookies[COOKIE_NAME];
  if (token) {
    const payload = verifyRefreshToken(token);
    if (payload?.userId) {
      await prisma.client.update({
        where: { id: payload.userId },
        data: { tokenVersion: { increment: 1 } },
      });
    }
  }

  res.clearCookie(COOKIE_NAME, { path: '/auth/refresh' });
  res.sendStatus(204);
}

// ✅ /register
export async function register(req: Request, res: Response): Promise<void> {
  const { email, password, nameFa, nameEn, officeId } = req.body;

  if (!email || !password || !nameFa || !nameEn || !officeId) {
    res.status(400).json({ error: 'All fields are required.' });
    return;
  }

  const existing = await prisma.client.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: 'Email is already in use.' });
    return;
  }

  const pepper = process.env.PEPPER_SECRET!;
  const hashedPassword = await argon2.hash(password + pepper);

  const client = await prisma.client.create({
    data: {
      email,
      password: hashedPassword,
      nameFa,
      nameEn,
      officeId,
    },
  });

  res.status(201).json({
    message: 'Client registered successfully',
    client: {
      id: client.id,
      nameFa: client.nameFa,
      email: client.email,
    },
  });
}

