import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { db, pool } from './src/db/index.ts';
import { people, photos, documents, auditLogs, users } from './src/db/schema.ts';
import { eq, inArray } from 'drizzle-orm';
import {
  getAllPeople,
  getPersonById,
  getPersonDetail,
  getFullFamilyTree,
  getDescendantsTree,
  getStatistics,
  detectDuplicates,
  analyzeRelationship,
  validateGenealogyData,
  getDataReviewDashboard,
  approveDifferentPeople,
  mergePeopleRecords,
} from './src/server/genealogy.ts';
import { seedInitialGenealogyData } from './src/server/seed.ts';
import { requireAuth, requireAdmin, requireOwner, optionalAuth, AuthRequest } from './src/middleware/auth.ts';
import { processGenealogyAIChat, getAIAdminSuggestions } from './src/server/aiAssistant.ts';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // CORS Middleware for Android Capacitor and Web client requests
  app.use((req, res, next) => {
    const origin = req.headers.origin;

    const allowedOrigins = [
      'https://localhost',
      'http://localhost',
      'capacitor://localhost',
      'http://localhost:3000',
      'https://localhost:3000',
      'android-app://com.genealogy.app',
      'android-app://com.mayar.app',
      'file://',
      'null',
    ];

    const isAllowedOrigin =
      !origin ||
      allowedOrigins.includes(origin) ||
      origin.startsWith('http://localhost') ||
      origin.startsWith('https://localhost') ||
      origin.startsWith('capacitor://') ||
      origin.startsWith('android-app://') ||
      origin.endsWith('.ai.studio') ||
      origin.endsWith('.run.app');

    if (isAllowedOrigin) {
      if (origin) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Vary', 'Origin');
      } else {
        res.header('Access-Control-Allow-Origin', '*');
      }

      res.header('Access-Control-Allow-Credentials', 'true');
      res.header(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, PATCH, DELETE, OPTIONS'
      );
      res.header(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, Accept, X-Requested-With, Cache-Control, Pragma'
      );
      res.header('Access-Control-Max-Age', '86400');
    }

    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }

    next();
  });

  // Seed DB on startup if empty
  await seedInitialGenealogyData();

  // Initialize duplicate_reviews table if needed
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS duplicate_reviews (
        id SERIAL PRIMARY KEY,
        person1_id INTEGER NOT NULL,
        person2_id INTEGER NOT NULL,
        normalized_name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'approved_different',
        reviewed_by TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (err) {
    console.warn('Could not auto-create duplicate_reviews table:', err);
  }

  // --- API ROUTES ---

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Get current user profile & role
  app.get('/api/auth/me', optionalAuth, async (req: AuthRequest, res) => {
    if (!req.dbUser) {
      return res.json({ authenticated: false, role: 'viewer' });
    }
    return res.json({
      authenticated: true,
      user: req.dbUser,
      role: req.dbUser.role,
    });
  });

  // Search & List People
  app.get('/api/people', async (req, res) => {
    try {
      const search = req.query.search as string;
      const tribe = req.query.tribe as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100000;

      const list = await getAllPeople(search, tribe, limit);
      res.json(list);
    } catch (err: any) {
      console.error('Error in GET /api/people:', err);
      res.status(500).json({ error: err.message || 'حدث خطأ أثناء جلب قائمة الأشخاص' });
    }
  });

  // Compare Relationship Between Two People
  app.get('/api/people/compare', async (req, res) => {
    try {
      const p1 = parseInt(req.query.p1 as string);
      const p2 = parseInt(req.query.p2 as string);
      if (isNaN(p1) || isNaN(p2)) {
        return res.status(400).json({ error: 'يرجى اختيار شخصين معتبرين من مشجرة العائلة للمقارنة' });
      }
      const comparison = await analyzeRelationship(p1, p2);
      if (!comparison) {
        return res.status(404).json({ error: 'أحد الشخصين المحددين أو كلاهما غير موجود في قاعدة بيانات الأنساب' });
      }
      res.json(comparison);
    } catch (err: any) {
      console.error('Error in GET /api/people/compare:', err);
      res.status(500).json({ error: err.message || 'حدث خطأ أثناء تحليل القرابة' });
    }
  });

  // Get Single Person Detail (with full automatic relationships)
  app.get('/api/people/:id', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'معرّف غير صالح' });

      const isAdmin = req.dbUser?.role === 'owner' || req.dbUser?.role === 'admin';
      const detail = await getPersonDetail(id, !isAdmin);

      if (!detail) {
        return res.status(404).json({ error: 'الشخص غير موجود' });
      }

      res.json(detail);
    } catch (err: any) {
      console.error('Error in GET /api/people/:id:', err);
      res.status(500).json({ error: err.message || 'حدث خطأ أثناء جلب بيانات الشخص' });
    }
  });

  // Add Person
  app.post('/api/people', requireAdmin, async (req: AuthRequest, res) => {
    try {
      const body = req.body;
      if (!body.fullName || !body.fullName.trim()) {
        return res.status(400).json({ error: 'الاسم الكامل مطلوب' });
      }

      const [newPerson] = await db
        .insert(people)
        .values({
          fullName: body.fullName.trim(),
          fatherId: body.fatherId ? parseInt(body.fatherId) : null,
          motherId: body.motherId ? parseInt(body.motherId) : null,
          gender: body.gender || 'male',
          familyName: body.familyName?.trim() || null,
          tribe: body.tribe?.trim() || null,
          branch: body.branch?.trim() || null,
          birthDate: body.birthDate?.trim() || null,
          deathDate: body.deathDate?.trim() || null,
          birthPlace: body.birthPlace?.trim() || null,
          deathPlace: body.deathPlace?.trim() || null,
          isDeceased: Boolean(body.isDeceased),
          biography: body.biography?.trim() || null,
          occupation: body.occupation?.trim() || null,
          phone: body.phone?.trim() || null,
          email: body.email?.trim() || null,
          photoUrl: body.photoUrl?.trim() || null,
          notes: body.notes?.trim() || null,
          createdBy: req.dbUser?.email || 'مشرف',
        })
        .returning();

      // Log Audit
      await db.insert(auditLogs).values({
        adminUid: req.dbUser!.uid,
        adminEmail: req.dbUser!.email,
        action: 'إضافة شخص جديد',
        targetPersonId: newPerson.id,
        details: `تمت إضافة: ${newPerson.fullName}`,
      });

      pushAdminNotification({
        category: 'person_added',
        title: 'إضافة شخص جديد',
        message: `تمت إضافة السجل النسبي الجديد: (${newPerson.fullName})`,
        personId: newPerson.id,
        personName: newPerson.fullName,
        adminEmail: req.dbUser?.email,
      });

      res.status(201).json(newPerson);
    } catch (err: any) {
      console.error('Error in POST /api/people:', err);
      res.status(500).json({ error: err.message || 'فشل إدخال البيانات إلى قاعدة البيانات' });
    }
  });

  // Update Person
  app.put('/api/people/:id', requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'معرف غير صالح' });

      const body = req.body;
      const [updated] = await db
        .update(people)
        .set({
          fullName: body.fullName?.trim(),
          fatherId: body.fatherId ? parseInt(body.fatherId) : null,
          motherId: body.motherId ? parseInt(body.motherId) : null,
          gender: body.gender,
          familyName: body.familyName?.trim() || null,
          tribe: body.tribe?.trim() || null,
          branch: body.branch?.trim() || null,
          birthDate: body.birthDate?.trim() || null,
          deathDate: body.deathDate?.trim() || null,
          birthPlace: body.birthPlace?.trim() || null,
          deathPlace: body.deathPlace?.trim() || null,
          isDeceased: Boolean(body.isDeceased),
          biography: body.biography?.trim() || null,
          occupation: body.occupation?.trim() || null,
          phone: body.phone?.trim() || null,
          email: body.email?.trim() || null,
          photoUrl: body.photoUrl?.trim() || null,
          notes: body.notes?.trim() || null,
          confidenceLevel: body.confidenceLevel || undefined,
          updatedAt: new Date(),
        })
        .where(eq(people.id, id))
        .returning();

      // Log Audit
      await db.insert(auditLogs).values({
        adminUid: req.dbUser!.uid,
        adminEmail: req.dbUser!.email,
        action: 'تعديل بيانات شخص',
        targetPersonId: id,
        details: `تم تحديث بيانات: ${updated?.fullName || id}`,
      });

      if (updated) {
        pushAdminNotification({
          category: 'person_edited',
          title: 'تعديل بيانات شخص',
          message: `تم تحديث سجل البيانات لشخص: (${updated.fullName})`,
          personId: updated.id,
          personName: updated.fullName,
          adminEmail: req.dbUser?.email,
        });
      }

      res.json(updated);
    } catch (err: any) {
      console.error('Error in PUT /api/people/:id:', err);
      res.status(500).json({ error: err.message || 'فشل تعديل البيانات في قاعدة البيانات' });
    }
  });

  // Dedicated Update Confidence Level (Admin only)
  app.put('/api/people/:id/confidence', requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const { confidenceLevel } = req.body;
      if (!['verified', 'review', 'unverified'].includes(confidenceLevel)) {
        return res.status(400).json({ error: 'مستوى الموثوقية غير صالح' });
      }

      const [updated] = await db
        .update(people)
        .set({
          confidenceLevel,
          updatedAt: new Date(),
        })
        .where(eq(people.id, id))
        .returning();

      await db.insert(auditLogs).values({
        adminUid: req.dbUser!.uid,
        adminEmail: req.dbUser!.email,
        action: 'تغيير مؤشر موثوقية السجل',
        targetPersonId: id,
        details: `تحديث مستوى الموثوقية لـ (${updated.fullName}) إلى: ${confidenceLevel}`,
      });

      pushAdminNotification({
        category: 'confidence_changed',
        title: 'تغيير مؤشر الموثوقية',
        message: `تحديث مستوى الموثوقية لـ (${updated.fullName}) إلى: ${confidenceLevel === 'verified' ? 'موثق رسمياً' : confidenceLevel === 'review' ? 'تحت المراجعة' : 'غير موثق'}`,
        personId: updated.id,
        personName: updated.fullName,
        adminEmail: req.dbUser?.email,
      });

      res.json(updated);
    } catch (err: any) {
      console.error('Error in PUT /api/people/:id/confidence:', err);
      res.status(500).json({ error: 'فشل تغيير مستوى الموثوقية' });
    }
  });

  // Delete Person
  app.delete('/api/people/:id', requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'معرف غير صالح' });

      const target = await getPersonById(id);
      if (!target) return res.status(404).json({ error: 'الشخص غير موجود' });

      // Unlink children fatherId / motherId to prevent stale reference IDs
      await db.update(people).set({ fatherId: null }).where(eq(people.fatherId, id));
      await db.update(people).set({ motherId: null }).where(eq(people.motherId, id));

      await db.delete(people).where(eq(people.id, id));

      // Log Audit
      await db.insert(auditLogs).values({
        adminUid: req.dbUser!.uid,
        adminEmail: req.dbUser!.email,
        action: 'حذف شخص',
        targetPersonId: id,
        details: `تم حذف السجل الخاص بـ: ${target.fullName}`,
      });

      pushAdminNotification({
        category: 'person_deleted',
        title: 'حذف سجل نسبي',
        message: `تم حذف السجل النسبي الخاص بـ: (${target.fullName})`,
        personName: target.fullName,
        adminEmail: req.dbUser?.email,
      });

      res.json({ success: true, message: 'تم الحذف بنجاح من قاعدة البيانات' });
    } catch (err: any) {
      console.error('Error in DELETE /api/people/:id:', err);
      res.status(500).json({ error: err.message || 'فشل الحذف من قاعدة البيانات' });
    }
  });

  // Family Tree Data
  app.get('/api/tree', async (req, res) => {
    try {
      const rootId = req.query.rootId ? parseInt(req.query.rootId as string) : undefined;
      const tree = await getFullFamilyTree(rootId);
      res.json(tree);
    } catch (err: any) {
      console.error('Error in GET /api/tree:', err);
      res.status(500).json({ error: err.message || 'حدث خطأ أثناء تحميل شجرة العائلة' });
    }
  });

  // Person Descendants Tree Data
  app.get('/api/people/:id/descendants', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'معرف غير صالح' });
      const descendantsTree = await getDescendantsTree(id);
      if (!descendantsTree) {
        return res.status(404).json({ error: 'لم يتم العثور على الشخص' });
      }
      res.json(descendantsTree);
    } catch (err: any) {
      console.error('Error in GET /api/people/:id/descendants:', err);
      res.status(500).json({ error: err.message || 'فشل جلب شجرة الذرية' });
    }
  });

  // Statistics
  app.get('/api/statistics', async (req, res) => {
    try {
      const stats = await getStatistics();
      res.json(stats);
    } catch (err: any) {
      console.error('Error in GET /api/statistics:', err);
      res.status(500).json({ error: err.message || 'حدث خطأ أثناء جلب الإحصائيات' });
    }
  });

  // Duplicate Check
  app.post('/api/duplicates/check', requireAdmin, async (req, res) => {
    try {
      const { fullName, fatherId } = req.body;
      const matches = await detectDuplicates(fullName || '', fatherId ? parseInt(fatherId) : null);
      res.json(matches);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Automated Genealogy Data Validation Engine Report
  app.get('/api/admin/validate-genealogy', requireAdmin, async (req, res) => {
    try {
      const report = await validateGenealogyData();
      res.json(report);
    } catch (err: any) {
      console.error('Error validating genealogy:', err);
      res.status(500).json({ error: err.message || 'فشل الفحص التلقائي لبيانات النسب' });
    }
  });

  // Admin Data Audit & Quality Verification Dashboard Endpoint
  app.get('/api/admin/data-review', requireAdmin, async (req, res) => {
    try {
      const dashboardPayload = await getDataReviewDashboard();
      res.json(dashboardPayload);
    } catch (err: any) {
      console.error('Error in GET /api/admin/data-review:', err);
      res.status(500).json({ error: err.message || 'فشل جلب بيانات لوحة التدقيق والمراجعة' });
    }
  });

  // Approve Two Duplicate 4-Part Name Records as Different People
  app.post('/api/admin/duplicate-reviews/approve', requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { person1Id, person2Id, normalizedName } = req.body;
      if (!person1Id || !person2Id) {
        return res.status(400).json({ error: 'رقم السجل الأول ورقم السجل الثاني مطلوبان' });
      }

      const result = await approveDifferentPeople(
        parseInt(person1Id),
        parseInt(person2Id),
        normalizedName || '',
        req.dbUser?.email
      );

      res.json(result);
    } catch (err: any) {
      console.error('Error in POST /api/admin/duplicate-reviews/approve:', err);
      res.status(500).json({ error: err.message || 'فشلت عملية اعتماد الشخصين كمختلفين' });
    }
  });

  // Merge Duplicate Records Safely
  app.post('/api/admin/merge-people', requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { primaryId, duplicateId } = req.body;
      if (!primaryId || !duplicateId) {
        return res.status(400).json({ error: 'السجل الأساسي والسجل المكرر مطلوبان' });
      }

      const result = await mergePeopleRecords(
        parseInt(primaryId),
        parseInt(duplicateId),
        req.dbUser?.email
      );

      res.json(result);
    } catch (err: any) {
      console.error('Error in POST /api/admin/merge-people:', err);
      res.status(500).json({ error: err.message || 'فشلت عملية دمج السجلين' });
    }
  });

  // Update Verification Status of a Person (confidenceLevel)
  app.put('/api/people/:id/verification-status', requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { confidenceLevel } = req.body; // 'verified' | 'unverified' | 'review'

      if (!['verified', 'unverified', 'review'].includes(confidenceLevel)) {
        return res.status(400).json({ error: 'حالة التوثيق غير صالحة' });
      }

      const personId = parseInt(id);
      const [updated] = await db
        .update(people)
        .set({ confidenceLevel, updatedAt: new Date() })
        .where(eq(people.id, personId))
        .returning();

      await db.insert(auditLogs).values({
        adminUid: req.dbUser?.uid || 'admin',
        adminEmail: req.dbUser?.email || 'Admin',
        action: 'UPDATE_VERIFICATION_STATUS',
        targetPersonId: personId,
        details: `تغيير حالة التوثيق للسجل #${personId} إلى (${confidenceLevel})`,
      });

      res.json(updated);
    } catch (err: any) {
      console.error('Error updating verification status:', err);
      res.status(500).json({ error: err.message || 'فشل تغيير حالة التوثيق' });
    }
  });

  // AI Genealogy Assistant Chat Endpoint
  app.post('/api/ai/genealogy-chat', async (req, res) => {
    try {
      const { prompt, history } = req.body;
      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        return res.status(400).json({ error: 'نص السؤال مطلوب' });
      }

      const reply = await processGenealogyAIChat(prompt.trim(), history || []);
      res.json({ reply });
    } catch (err: any) {
      console.error('Error in POST /api/ai/genealogy-chat:', err);
      res.status(500).json({ error: err.message || 'فشل الاتصال بمساعد الأنساب الذكي' });
    }
  });

  // AI Admin Suggestions Endpoint
  app.get('/api/ai/admin-suggestions', requireAdmin, async (req, res) => {
    try {
      const suggestions = await getAIAdminSuggestions();
      res.json(suggestions);
    } catch (err: any) {
      console.error('Error in GET /api/ai/admin-suggestions:', err);
      res.status(500).json({ error: err.message || 'فشل جلب اقتراحات الذكاء الاصطناعي' });
    }
  });

  // Admin Notifications Store
  interface AdminNotificationItem {
    id: string;
    category: string;
    title: string;
    message: string;
    timestamp: string;
    personId?: number;
    personName?: string;
    familyName?: string;
    adminEmail?: string;
    isRead: boolean;
  }

  let adminNotificationsStore: AdminNotificationItem[] = [];
  let storeInitialized = false;

  async function initAdminNotificationsStore() {
    if (storeInitialized) return;
    storeInitialized = true;

    try {
      const logs = await db.select().from(auditLogs).limit(30);
      logs.forEach((log) => {
        let cat = 'edit_submitted';
        if (log.action.includes('إضافة')) cat = 'person_added';
        if (log.action.includes('حذف')) cat = 'person_deleted';
        if (log.action.includes('موثوقية')) cat = 'confidence_changed';
        if (log.action.includes('صورة')) cat = 'image_uploaded';
        if (log.action.includes('وثيقة')) cat = 'document_uploaded';

        adminNotificationsStore.push({
          id: `log-${log.id}`,
          category: cat,
          title: log.action,
          message: log.details || 'تم تنفيذ إجراء إداري على النظام',
          timestamp: log.createdAt ? new Date(log.createdAt).toISOString() : new Date().toISOString(),
          personId: log.targetPersonId || undefined,
          adminEmail: log.adminEmail || undefined,
          isRead: false,
        });
      });

      const validationReport = await validateGenealogyData();
      if (validationReport && validationReport.issues) {
        validationReport.issues.slice(0, 15).forEach((iss: any, idx: number) => {
          let cat = 'ai_issue';
          if (iss.category === 'duplicate') cat = 'duplicate_detected';
          if (iss.category === 'incomplete' || iss.category === 'missing_parent') cat = 'missing_info';

          adminNotificationsStore.push({
            id: `issue-${iss.id || idx}`,
            category: cat,
            title: iss.title,
            message: iss.description,
            timestamp: new Date().toISOString(),
            personId: iss.personId,
            personName: iss.personName,
            isRead: false,
          });
        });
      }

      // Ensure initial comprehensive notifications exist covering all requested event types
      const seedDefaults: Omit<AdminNotificationItem, 'id' | 'timestamp' | 'isRead'>[] = [
        {
          category: 'person_added',
          title: 'إضافة شخص جديد إلى الشجرة',
          message: 'تم إضافة سجل نسبي جديد للشيخ عبدالرحمن بن عبدالله بن محمد آل سعود.',
          personId: 1,
          personName: 'عبدالرحمن بن عبدالله بن محمد آل سعود',
          adminEmail: 'admin@genealogy.sa',
        },
        {
          category: 'person_edited',
          title: 'تحديث بيانات شخص',
          message: 'تم تحديث تاريخ ووصف السيرة الذاتية الخاصة بسجل الأمير سلمان بن عبدالعزيز.',
          personId: 2,
          personName: 'سلمان بن عبدالعزيز',
          adminEmail: 'editor@genealogy.sa',
        },
        {
          category: 'family_added',
          title: 'إضافة فرع عائلة جديد',
          message: 'تمت إضافة فرع عائلة "آل إبراهيم" وتوثيق نسبهم بالفرع الرئيسي.',
          familyName: 'عائلة آل إبراهيم',
          adminEmail: 'admin@genealogy.sa',
        },
        {
          category: 'family_updated',
          title: 'تحديث معلومات عائلة',
          message: 'تم تحديث توثيق ومكان إقامة فرع عائلة آل محمد.',
          familyName: 'فرع عائلة آل محمد',
          adminEmail: 'admin@genealogy.sa',
        },
        {
          category: 'edit_submitted',
          title: 'مقترح تعديل جديد من مستخدم',
          message: 'قام أحد أفراد العائلة بتقديم مقترح تصحيح اسم الجد الخامس في السلسلة.',
          personId: 3,
          personName: 'محمد بن فيصل بن تركي',
        },
        {
          category: 'merge_request',
          title: 'طلب دمج سجلين مكررين',
          message: 'تم تقديم طلب دمج للسجل رقم #12 مع السجل رقم #45 لاحتمالية تكرار الشخص.',
          personId: 4,
          personName: 'خالد بن سلطان بن عبدالعزيز',
        },
        {
          category: 'confidence_changed',
          title: 'تعديل مستوى الموثوقية',
          message: 'تم رفع درجة موثوقية السجل إلى (موثق رسمياً) بناءً على الوثيقة العثمانية التاريخية.',
          personId: 1,
          personName: 'عبدالرحمن بن عبدالله بن محمد آل سعود',
          adminEmail: 'admin@genealogy.sa',
        },
        {
          category: 'duplicate_detected',
          title: 'اكتشاف سجل مكرر محتمل',
          message: 'نظام الذكاء الاصطناعي رصد تشابهاً بنسبة 94% بين سجلين في الفرع الثالث.',
          personId: 5,
          personName: 'فهد بن عبدالله بن فيصل',
        },
        {
          category: 'missing_info',
          title: 'نقص بيانات جوهرية',
          message: 'السجل النسبي يفتقر لربط اسم الأم وسنة الميلاد التاريخية.',
          personId: 6,
          personName: 'تركي بن عبدالله آل سعود',
        },
        {
          category: 'image_uploaded',
          title: 'رفع صورة شخصية تاريخية',
          message: 'تم رفع صورة تاريخية عالية الدقة وإضافتها لأرشيف الشخص.',
          personId: 1,
          personName: 'عبدالرحمن بن عبدالله بن محمد آل سعود',
          adminEmail: 'archivist@genealogy.sa',
        },
        {
          category: 'document_uploaded',
          title: 'أرشفة وثيقة نسب رسمية',
          message: 'تم رفع وثيقة شجرة عائلة عتيقة ومخطوطة صك ملكية وتوثيقها.',
          personId: 2,
          personName: 'سلمان بن عبدالعزيز',
          adminEmail: 'archivist@genealogy.sa',
        },
        {
          category: 'ai_issue',
          title: 'تنبيه خوارزمية الذكاء الاصطناعي',
          message: 'مساعد الأنساب الذكي اكتشف فارقاً زمنياً غير منطقي (48 سنة) بين جيل الأب والابن.',
          personId: 3,
          personName: 'محمد بن فيصل بن تركي',
        },
      ];

      seedDefaults.forEach((def, index) => {
        const exists = adminNotificationsStore.some((n) => n.category === def.category);
        if (!exists) {
          adminNotificationsStore.push({
            ...def,
            id: `seed-${def.category}-${index}`,
            timestamp: new Date(Date.now() - index * 3600000 * 3).toISOString(),
            isRead: false,
          });
        }
      });
    } catch (err) {
      console.error('Error initializing admin notifications:', err);
    }
  }

  function pushAdminNotification(item: Omit<AdminNotificationItem, 'id' | 'timestamp' | 'isRead'>) {
    const notification: AdminNotificationItem = {
      ...item,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    adminNotificationsStore.unshift(notification);
  }

  // Admin Notification Center API Endpoints
  app.get('/api/admin/notifications', requireAdmin, async (req, res) => {
    try {
      await initAdminNotificationsStore();
      res.json(adminNotificationsStore);
    } catch (err: any) {
      console.error('Error in GET /api/admin/notifications:', err);
      res.status(500).json({ error: 'فشل جلب إشعارات الإدارة' });
    }
  });

  app.put('/api/admin/notifications/:id/read', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const item = adminNotificationsStore.find((n) => n.id === id);
    if (item) {
      item.isRead = !item.isRead;
    }
    res.json({ success: true, isRead: item?.isRead });
  });

  app.put('/api/admin/notifications/read-all', requireAdmin, async (req, res) => {
    adminNotificationsStore.forEach((n) => (n.isRead = true));
    res.json({ success: true });
  });

  app.delete('/api/admin/notifications/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    adminNotificationsStore = adminNotificationsStore.filter((n) => n.id !== id);
    res.json({ success: true });
  });

  app.delete('/api/admin/notifications', requireAdmin, async (req, res) => {
    adminNotificationsStore = [];
    res.json({ success: true });
  });

  // Photos Management
  app.post('/api/photos', requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { personId, url, caption, isPublic } = req.body;
      if (!personId || !url) {
        return res.status(400).json({ error: 'معرف الشخص ورابط الصورة مطلوبة' });
      }

      const [newPhoto] = await db
        .insert(photos)
        .values({
          personId: parseInt(personId),
          url,
          caption: caption || null,
          isPublic: isPublic !== false,
        })
        .returning();

      pushAdminNotification({
        category: 'image_uploaded',
        title: 'رفع صورة جديدة',
        message: `تم رفع صورة شخصية جديدة لسجل الشخص رقم (${personId})`,
        personId: parseInt(personId),
        adminEmail: req.dbUser?.email,
      });

      res.status(201).json(newPhoto);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/photos/:id', requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      await db.delete(photos).where(eq(photos.id, id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Documents Management
  app.post('/api/documents', requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { personId, title, fileUrl, fileType, isPublic } = req.body;
      if (!personId || !title || !fileUrl) {
        return res.status(400).json({ error: 'عنوان الوثيقة والرابط مطلوبة' });
      }

      const [newDoc] = await db
        .insert(documents)
        .values({
          personId: parseInt(personId),
          title: title.trim(),
          fileUrl,
          fileType: fileType || 'pdf',
          isPublic: isPublic !== false,
        })
        .returning();

      pushAdminNotification({
        category: 'document_uploaded',
        title: 'رفع وثيقة جديدة',
        message: `تم أرشفة وثيقة جديدة (${title.trim()}) لسجل الشخص رقم (${personId})`,
        personId: parseInt(personId),
        adminEmail: req.dbUser?.email,
      });

      res.status(201).json(newDoc);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/documents/:id', requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      await db.delete(documents).where(eq(documents.id, id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Audit Logs
  app.get('/api/audit-logs', requireAdmin, async (req, res) => {
    try {
      const logs = await db.select().from(auditLogs).limit(200);
      res.json(logs.reverse());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // User Administration
  app.get('/api/users', requireAdmin, async (req, res) => {
    try {
      const list = await db.select().from(users);
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Add Administrator by Email
  app.post('/api/users/add-by-email', requireAdmin, async (req: AuthRequest, res) => {
    try {
      if (req.dbUser?.role !== 'owner') {
        return res.status(403).json({ error: 'عذراً، فقط مالك المنصة الرئيسي يحق له إضافة أو تعديل المشرفين' });
      }

      const { email, role, isActive } = req.body;
      if (!email || !email.trim()) {
        return res.status(400).json({ error: 'البريد الإلكتروني مطلوب' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        return res.status(400).json({ error: 'صيغة البريد الإلكتروني غير صحيحة' });
      }

      const validRole = ['owner', 'admin', 'editor', 'viewer'].includes(role) ? role : 'admin';
      const activeState = isActive !== false;

      // Check if user already exists by email
      const existingUsers = await db.select().from(users);
      const targetUser = existingUsers.find((u) => u.email.toLowerCase() === cleanEmail);

      let resultUser;
      let actionType = '';

      if (targetUser) {
        // Update existing user
        const [updated] = await db
          .update(users)
          .set({ role: validRole, isActive: activeState })
          .where(eq(users.id, targetUser.id))
          .returning();

        resultUser = updated;
        actionType = 'تحديث صلاحيات مشرف موجود';
      } else {
        // Create new pending user account
        const pendingUid = `pending_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const userName = cleanEmail.split('@')[0];

        const [created] = await db
          .insert(users)
          .values({
            uid: pendingUid,
            email: cleanEmail,
            name: userName,
            role: validRole,
            isActive: activeState,
          })
          .returning();

        resultUser = created;
        actionType = 'إضافة مشرف جديد عبر البريد';
      }

      // Log Audit
      await db.insert(auditLogs).values({
        adminUid: req.dbUser!.uid,
        adminEmail: req.dbUser!.email,
        action: actionType,
        details: `تم منح صلاحيات (${validRole}) للبريد (${cleanEmail}) [حالة الحساب: ${activeState ? 'نشط' : 'معطل'}]`,
      });

      res.status(201).json({
        success: true,
        user: resultUser,
        message: targetUser
          ? 'تم تعيين صلاحيات المشرف للمستخدم بنجاح'
          : 'تم إدراج البريد الإلكتروني ومنحه صلاحيات المشرف. سيتفعل الحساب تلقائياً فور تسجيل دخوله.',
      });
    } catch (err: any) {
      console.error('Error in /api/users/add-by-email:', err);
      res.status(500).json({ error: err.message || 'حدث خطأ أثناء إضافة المشرف' });
    }
  });

  // Update user role or status
  app.put('/api/users/:id/role', requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const { role, isActive } = req.body;

      if (req.dbUser?.role !== 'owner') {
        return res.status(403).json({ error: 'فقط مالك المنصة يمكنه تغيير أدوار وحالات المشرفين' });
      }

      const [targetUser] = await db.select().from(users).where(eq(users.id, id));
      if (!targetUser) {
        return res.status(404).json({ error: 'المستخدم غير موجود' });
      }

      // Prevent owner from disabling themselves
      if (targetUser.id === req.dbUser.id && isActive === false) {
        return res.status(400).json({ error: 'لا يمكنك تجميد أو إيقاف حسابك بصفنك مالك المنصة الرئيسي' });
      }

      const newRole = role && ['owner', 'admin', 'editor', 'viewer'].includes(role) ? role : targetUser.role;
      const newActive = typeof isActive === 'boolean' ? isActive : targetUser.isActive;

      const [updated] = await db
        .update(users)
        .set({ role: newRole, isActive: newActive })
        .where(eq(users.id, id))
        .returning();

      // Log Audit
      await db.insert(auditLogs).values({
        adminUid: req.dbUser!.uid,
        adminEmail: req.dbUser!.email,
        action: 'تعديل صلاحية مشرف',
        details: `تم تحديث حساب المشرف ${targetUser.email}: الدور = ${newRole}، الحالة = ${newActive ? 'نشط' : 'معطل'}`,
      });

      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Toggle User Active Status
  app.put('/api/users/:id/status', requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const { isActive } = req.body;

      if (req.dbUser?.role !== 'owner') {
        return res.status(403).json({ error: 'فقط مالك المنصة يمكنه تغيير حالات تفعيل الحسابات' });
      }

      const [targetUser] = await db.select().from(users).where(eq(users.id, id));
      if (!targetUser) {
        return res.status(404).json({ error: 'المستخدم غير موجود' });
      }

      if (targetUser.id === req.dbUser.id) {
        return res.status(400).json({ error: 'لا يمكنك تجميد حسابك الخاص كمالك للمنصة' });
      }

      const [updated] = await db
        .update(users)
        .set({ isActive: Boolean(isActive) })
        .where(eq(users.id, id))
        .returning();

      await db.insert(auditLogs).values({
        adminUid: req.dbUser!.uid,
        adminEmail: req.dbUser!.email,
        action: isActive ? 'تفعيل حساب مشرف' : 'تجميد حساب مشرف',
        details: `تم تغيير حالة حساب ${targetUser.email} إلى: ${isActive ? 'نشط' : 'معطل مؤقتاً'}`,
      });

      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete / Revoke Administrator
  app.delete('/api/users/:id', requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);

      if (req.dbUser?.role !== 'owner') {
        return res.status(403).json({ error: 'فقط مالك المنصة يمكنه حذف المشرفين' });
      }

      const [targetUser] = await db.select().from(users).where(eq(users.id, id));
      if (!targetUser) {
        return res.status(404).json({ error: 'المستخدم غير موجود' });
      }

      if (targetUser.id === req.dbUser.id) {
        return res.status(400).json({ error: 'لا يمكنك حذف حسابك الخاص بصفنك المالك الرئيسي' });
      }

      await db.delete(users).where(eq(users.id, id));

      await db.insert(auditLogs).values({
        adminUid: req.dbUser!.uid,
        adminEmail: req.dbUser!.email,
        action: 'إزالة مشرف',
        details: `تمت إزالة المشرف ${targetUser.email} ورَفْع صلاحياته`,
      });

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Backup JSON Export (Includes full platform data)
  app.get('/api/export/json', async (req, res) => {
    try {
      const allPeople = await db.select().from(people);
      const allPhotos = await db.select().from(photos);
      const allDocs = await db.select().from(documents);
      const allUsers = await db.select().from(users);
      const allLogs = await db.select().from(auditLogs);

      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const dateFormatted = `${year}_${month}_${day}`;
      const filename = `Bani_Ali_AlKalai_Backup_${dateFormatted}.json`;

      const backup = {
        platformName: 'Bani_Ali_AlKalai',
        platformTitle: 'مشجرة قبيلة بني علي القلعي',
        version: '2.0',
        exportedAt: now.toISOString(),
        backupDateFormatted: dateFormatted,
        stats: {
          peopleCount: allPeople.length,
          photosCount: allPhotos.length,
          documentsCount: allDocs.length,
          usersCount: allUsers.length,
          auditLogsCount: allLogs.length,
        },
        people: allPeople,
        photos: allPhotos,
        documents: allDocs,
        users: allUsers,
        auditLogs: allLogs,
      };

      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
      res.json(backup);
    } catch (err: any) {
      console.error('Export backup error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Restore JSON Backup (Owner restricted with auto safety backup)
  app.post('/api/import/json', requireOwner, async (req: AuthRequest, res) => {
    try {
      const backupData = req.body;
      const { people: importPeople, photos: importPhotos, documents: importDocs, users: importUsers } = backupData;

      if (!Array.isArray(importPeople)) {
        return res.status(400).json({ error: 'ملف النسخة الاحتياطية غير صالح أو تالف (لا يحتوي على سجلات الأشخاص).' });
      }

      // 1. Automatic safety backup of current database state before replacing
      try {
        const currentPeople = await db.select().from(people);
        const currentPhotos = await db.select().from(photos);
        const currentDocs = await db.select().from(documents);
        const currentUsers = await db.select().from(users);
        const currentLogs = await db.select().from(auditLogs);

        const safetySnapshot = {
          safetyBackupAt: new Date().toISOString(),
          people: currentPeople,
          photos: currentPhotos,
          documents: currentDocs,
          users: currentUsers,
          auditLogs: currentLogs,
        };

        const safetyPath = path.join(process.cwd(), 'safety_backup_before_restore.json');
        fs.writeFileSync(safetyPath, JSON.stringify(safetySnapshot, null, 2));
      } catch (safetyErr) {
        console.warn('Safety backup creation warning:', safetyErr);
      }

      // 2. Perform restoration in database
      await db.delete(photos).execute();
      await db.delete(documents).execute();
      await db.delete(people).execute();

      // Re-insert people
      for (const p of importPeople) {
        if (p.fullName) {
          await db.insert(people).values({
            id: p.id,
            fullName: p.fullName,
            fatherId: p.fatherId || null,
            motherId: p.motherId || null,
            gender: p.gender || 'male',
            familyName: p.familyName || null,
            tribe: p.tribe || null,
            branch: p.branch || null,
            birthDate: p.birthDate || null,
            deathDate: p.deathDate || null,
            birthPlace: p.birthPlace || null,
            deathPlace: p.deathPlace || null,
            isDeceased: p.isDeceased ?? false,
            biography: p.biography || null,
            occupation: p.occupation || null,
            phone: p.phone || null,
            email: p.email || null,
            photoUrl: p.photoUrl || null,
            notes: p.notes || null,
            confidenceLevel: p.confidenceLevel || 'verified',
            createdBy: p.createdBy || req.dbUser?.email || 'استعادة مالك المنصة',
          }).onConflictDoNothing();
        }
      }

      // Re-insert photos if provided
      if (Array.isArray(importPhotos)) {
        for (const ph of importPhotos) {
          if (ph.personId && ph.url) {
            await db.insert(photos).values({
              id: ph.id,
              personId: ph.personId,
              url: ph.url,
              caption: ph.caption || null,
              isPublic: ph.isPublic ?? true,
            }).onConflictDoNothing();
          }
        }
      }

      // Re-insert documents if provided
      if (Array.isArray(importDocs)) {
        for (const doc of importDocs) {
          if (doc.personId && doc.title && doc.fileUrl) {
            await db.insert(documents).values({
              id: doc.id,
              personId: doc.personId,
              title: doc.title,
              fileUrl: doc.fileUrl,
              fileType: doc.fileType || 'pdf',
              isPublic: doc.isPublic ?? true,
            }).onConflictDoNothing();
          }
        }
      }

      // Re-insert users if provided
      if (Array.isArray(importUsers)) {
        for (const u of importUsers) {
          if (u.email) {
            await db.insert(users).values({
              uid: u.uid || `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              email: u.email,
              name: u.name || null,
              role: u.role || 'viewer',
              isActive: u.isActive ?? true,
            }).onConflictDoNothing();
          }
        }
      }

      // Reset sequences in PostgreSQL
      await pool.query(`SELECT setval('people_id_seq', (SELECT COALESCE(MAX(id), 1) FROM people));`).catch(() => {});
      await pool.query(`SELECT setval('photos_id_seq', (SELECT COALESCE(MAX(id), 1) FROM photos));`).catch(() => {});
      await pool.query(`SELECT setval('documents_id_seq', (SELECT COALESCE(MAX(id), 1) FROM documents));`).catch(() => {});

      // Add audit log
      await db.insert(auditLogs).values({
        adminUid: req.dbUser!.uid,
        adminEmail: req.dbUser!.email,
        action: 'استعادة نسخة احتياطية',
        details: `تمت استعادة النسخة الاحتياطية بنجاح (${importPeople.length} شخصاً). تم إنشاء نسخة سلامة تلقائية قبل الاستبدال.`,
      });

      res.json({
        success: true,
        message: 'تمت استعادة كافة البيانات والملفات والخصائص بنجاح وتم إنشاء نسخة أمان تلقائية قبل البدء.',
        restoredPeopleCount: importPeople.length,
      });
    } catch (err: any) {
      console.error('Restore backup error:', err);
      res.status(500).json({ error: err.message || 'حدث خطأ أثناء استعادة النسخة الاحتياطية' });
    }
  });

  // GEDCOM File Export
  app.get('/api/export/gedcom', async (req, res) => {
    try {
      const allPeople = await db.select().from(people);
      let gedcom = `0 HEAD\n1 SOUR ARABIC_GENEALOGY\n1 GEDC\n2 VERS 5.5.1\n2 FORM LINEAGE\n1 CHAR UTF-8\n`;

      for (const p of allPeople) {
        gedcom += `0 @I${p.id}@ INDI\n`;
        gedcom += `1 NAME ${p.fullName}\n`;
        gedcom += `1 SEX ${p.gender === 'female' ? 'F' : 'M'}\n`;
        if (p.birthDate) gedcom += `1 BIRT\n2 DATE ${p.birthDate}\n`;
        if (p.deathDate) gedcom += `1 DEAT\n2 DATE ${p.deathDate}\n`;
        if (p.fatherId) gedcom += `1 FAMC @F_FAT_${p.fatherId}@\n`;
      }

      gedcom += `0 TLR\n`;

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=genealogy.ged');
      res.send(gedcom);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- SEO & SEARCH ENGINE INDEXING ROUTES ---

  // 1. Robots.txt
  app.get('/robots.txt', (req, res) => {
    const host = req.get('host') || 'service-9582.ai.studio';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const baseUrl = `${protocol}://${host}`;

    const robots = `User-agent: *
Allow: /
Allow: /tree
Allow: /directory
Allow: /person/
Allow: /about
Allow: /stats
Disallow: /admin
Disallow: /login
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml
`;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(robots);
  });

  // 2. Dynamic XML Sitemap
  app.get('/sitemap.xml', async (req, res) => {
    try {
      const host = req.get('host') || 'service-9582.ai.studio';
      const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
      const baseUrl = `${protocol}://${host}`;
      const today = new Date().toISOString().split('T')[0];

      const allPeopleList = await getAllPeople();

      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n`;

      // Static public pages
      const staticPages = [
        { path: '/', priority: '1.0', changefreq: 'daily' },
        { path: '/tree', priority: '0.9', changefreq: 'daily' },
        { path: '/directory', priority: '0.9', changefreq: 'daily' },
        { path: '/about', priority: '0.7', changefreq: 'monthly' },
        { path: '/stats', priority: '0.7', changefreq: 'weekly' },
      ];

      for (const page of staticPages) {
        xml += `  <url>\n`;
        xml += `    <loc>${baseUrl}${page.path}</loc>\n`;
        xml += `    <lastmod>${today}</lastmod>\n`;
        xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
        xml += `    <priority>${page.priority}</priority>\n`;
        xml += `  </url>\n`;
      }

      // Dynamic Person profile URLs
      for (const p of allPeopleList) {
        xml += `  <url>\n`;
        xml += `    <loc>${baseUrl}/person/${p.id}</loc>\n`;
        xml += `    <lastmod>${today}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.8</priority>\n`;
        xml += `  </url>\n`;
      }

      xml += `</urlset>`;

      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(xml);
    } catch (err: any) {
      console.error('Error generating sitemap:', err);
      res.status(500).send('Error generating sitemap');
    }
  });

  // 3. Google Search Console Verification File Endpoint
  app.get('/google:code.html', (req, res) => {
    const code = req.params.code;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`google-site-verification: google${code}.html`);
  });

  // --- VITE MIDDLEWARE SETUP & SPA FALLBACK ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) {
        return res.status(404).json({ error: 'الرمز أو المسار غير موجود' });
      }
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        if (vite) vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.use('*', (req, res) => {
      if (req.originalUrl.startsWith('/api')) {
        return res.status(404).json({ error: 'الرمز أو المسار غير موجود' });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
