import { relations } from 'drizzle-orm';
import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Users table (linked to Firebase Auth UID)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  name: text('name'),
  role: text('role').notNull().default('viewer'), // 'owner', 'admin', 'editor', 'viewer'
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// People / Genealogy records table
export const people = pgTable('people', {
  id: serial('id').primaryKey(),
  fullName: text('full_name').notNull(),
  fatherId: integer('father_id'),
  motherId: integer('mother_id'),
  gender: text('gender').notNull().default('male'), // 'male' | 'female'
  familyName: text('family_name'),
  tribe: text('tribe'),
  branch: text('branch'),
  birthDate: text('birth_date'),
  deathDate: text('death_date'),
  birthPlace: text('birth_place'),
  deathPlace: text('death_place'),
  isDeceased: boolean('is_deceased').default(false),
  biography: text('biography'),
  occupation: text('occupation'),
  phone: text('phone'),
  email: text('email'),
  photoUrl: text('photo_url'),
  notes: text('notes'),
  confidenceLevel: text('confidence_level').default('verified'),
  createdBy: text('created_by'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Photos gallery for people
export const photos = pgTable('photos', {
  id: serial('id').primaryKey(),
  personId: integer('person_id').notNull().references(() => people.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  caption: text('caption'),
  isPublic: boolean('is_public').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Documents archive for people
export const documents = pgTable('documents', {
  id: serial('id').primaryKey(),
  personId: integer('person_id').notNull().references(() => people.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  fileUrl: text('file_url').notNull(),
  fileType: text('file_type').default('pdf'),
  isPublic: boolean('is_public').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Change History / Audit log table
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  adminUid: text('admin_uid').notNull(),
  adminEmail: text('admin_email'),
  action: text('action').notNull(),
  targetPersonId: integer('target_person_id'),
  details: text('details'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Persistent Duplicate Reviews table for Admin Data Audit & Verification
export const duplicateReviews = pgTable('duplicate_reviews', {
  id: serial('id').primaryKey(),
  person1Id: integer('person1_id').notNull(),
  person2Id: integer('person2_id').notNull(),
  normalizedName: text('normalized_name').notNull(),
  status: text('status').notNull().default('approved_different'), // 'approved_different' | 'resolved' | 'dismissed'
  reviewedBy: text('reviewed_by'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Relations
export const peopleRelations = relations(people, ({ one, many }) => ({
  father: one(people, {
    fields: [people.fatherId],
    references: [people.id],
    relationName: 'fatherChildren',
  }),
  mother: one(people, {
    fields: [people.motherId],
    references: [people.id],
    relationName: 'motherChildren',
  }),
  childrenAsFather: many(people, { relationName: 'fatherChildren' }),
  childrenAsMother: many(people, { relationName: 'motherChildren' }),
  photos: many(photos),
  documents: many(documents),
}));

export const photosRelations = relations(photos, ({ one }) => ({
  person: one(people, {
    fields: [photos.personId],
    references: [people.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  person: one(people, {
    fields: [documents.personId],
    references: [people.id],
  }),
}));
