import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';
import { eq } from 'drizzle-orm';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  dbUser?: typeof users.$inferSelect;
}

export const syncUser = async (decodedToken: DecodedIdToken) => {
  const email = decodedToken.email || `${decodedToken.uid}@app.local`;
  const name = decodedToken.name || decodedToken.email?.split('@')[0] || 'مستخدم';
  
  // Check if user exists by uid
  const [existingByUid] = await db.select().from(users).where(eq(users.uid, decodedToken.uid));
  if (existingByUid) {
    const [updated] = await db
      .update(users)
      .set({ email, name })
      .where(eq(users.id, existingByUid.id))
      .returning();
    return updated;
  }

  // Check if user was pre-added by email
  const [existingByEmail] = await db.select().from(users).where(eq(users.email, email));
  if (existingByEmail) {
    const [updated] = await db
      .update(users)
      .set({ uid: decodedToken.uid, name })
      .where(eq(users.id, existingByEmail.id))
      .returning();
    return updated;
  }

  // Check if any user exists in table
  const existingUsers = await db.select().from(users);
  const isFirstUser = existingUsers.length === 0;

  // Insert new
  const defaultRole = isFirstUser ? 'owner' : 'viewer';

  const [dbUser] = await db
    .insert(users)
    .values({
      uid: decodedToken.uid,
      email,
      name,
      role: defaultRole,
      isActive: true,
    })
    .returning();

  return dbUser;
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    const dbUser = await syncUser(decodedToken);
    req.dbUser = dbUser;
  } catch (error) {
    console.warn('Optional auth token invalid:', error);
  }
  next();
};

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'غير مصرح: يجب تسجيل الدخول' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    const dbUser = await syncUser(decodedToken);
    req.dbUser = dbUser;
    next();
  } catch (error) {
    console.error('Error verifying ID token:', error);
    return res.status(401).json({ error: 'جلسة انتهت صلاحيتها أو رمش غير صالحة' });
  }
};

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  await requireAuth(req, res, () => {
    if (req.dbUser?.isActive === false) {
      return res.status(403).json({ error: 'عذراً، تم تجميد / إيقاف هذا الحساب مؤقتاً من قبل مالك المنصة.' });
    }
    if (['owner', 'admin', 'editor'].includes(req.dbUser?.role || '')) {
      return next();
    }
    return res.status(403).json({ error: 'غير مصرح: هذه العملية تتطلب صلاحيات مشرف' });
  });
};

export const requireOwner = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  await requireAuth(req, res, () => {
    if (req.dbUser?.isActive === false) {
      return res.status(403).json({ error: 'عذراً، تم تجميد / إيقاف هذا الحساب مؤقتاً.' });
    }
    if (req.dbUser?.role === 'owner') {
      return next();
    }
    return res.status(403).json({ error: 'غير مصرح: هذه العملية مخصصة حصرياً لمالك المنصة الرئيسي' });
  });
};
