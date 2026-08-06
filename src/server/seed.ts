import { pool } from '../db/index.ts';

export async function seedInitialGenealogyData() {
  try {
    // 1. Create tables individually
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id serial PRIMARY KEY,
        uid text NOT NULL UNIQUE,
        email text NOT NULL,
        name text,
        role text NOT NULL DEFAULT 'viewer',
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamp DEFAULT now()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS people (
        id serial PRIMARY KEY,
        full_name text NOT NULL,
        father_id integer,
        mother_id integer,
        gender text NOT NULL DEFAULT 'male',
        family_name text,
        tribe text,
        branch text,
        birth_date text,
        death_date text,
        birth_place text,
        death_place text,
        is_deceased boolean DEFAULT false,
        biography text,
        occupation text,
        phone text,
        email text,
        photo_url text,
        notes text,
        confidence_level text DEFAULT 'verified',
        created_by text,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS photos (
        id serial PRIMARY KEY,
        person_id integer NOT NULL REFERENCES people(id) ON DELETE CASCADE,
        url text NOT NULL,
        caption text,
        is_public boolean DEFAULT true,
        created_at timestamp DEFAULT now()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id serial PRIMARY KEY,
        person_id integer NOT NULL REFERENCES people(id) ON DELETE CASCADE,
        title text NOT NULL,
        file_url text NOT NULL,
        file_type text DEFAULT 'pdf',
        is_public boolean DEFAULT true,
        created_at timestamp DEFAULT now()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id serial PRIMARY KEY,
        admin_uid text NOT NULL,
        admin_email text,
        action text NOT NULL,
        target_person_id integer,
        details text,
        created_at timestamp DEFAULT now()
      );
    `);

    // 2. Safely add missing columns to existing tables individually
    const columnsToEnsure = [
      `ALTER TABLE people ADD COLUMN IF NOT EXISTS confidence_level text DEFAULT 'verified';`,
      `ALTER TABLE people ADD COLUMN IF NOT EXISTS created_by text;`,
      `ALTER TABLE people ADD COLUMN IF NOT EXISTS notes text;`,
      `ALTER TABLE people ADD COLUMN IF NOT EXISTS photo_url text;`,
      `ALTER TABLE people ADD COLUMN IF NOT EXISTS email text;`,
      `ALTER TABLE people ADD COLUMN IF NOT EXISTS phone text;`,
      `ALTER TABLE people ADD COLUMN IF NOT EXISTS occupation text;`,
      `ALTER TABLE people ADD COLUMN IF NOT EXISTS biography text;`,
      `ALTER TABLE people ADD COLUMN IF NOT EXISTS is_deceased boolean DEFAULT false;`,
      `ALTER TABLE people ADD COLUMN IF NOT EXISTS birth_place text;`,
      `ALTER TABLE people ADD COLUMN IF NOT EXISTS death_place text;`,
      `ALTER TABLE people ADD COLUMN IF NOT EXISTS birth_date text;`,
      `ALTER TABLE people ADD COLUMN IF NOT EXISTS death_date text;`,
      `ALTER TABLE people ADD COLUMN IF NOT EXISTS branch text;`,
      `ALTER TABLE people ADD COLUMN IF NOT EXISTS tribe text;`,
      `ALTER TABLE people ADD COLUMN IF NOT EXISTS family_name text;`,
      `ALTER TABLE people ADD COLUMN IF NOT EXISTS gender text DEFAULT 'male';`,
      `ALTER TABLE people ADD COLUMN IF NOT EXISTS mother_id integer;`,
      `ALTER TABLE people ADD COLUMN IF NOT EXISTS father_id integer;`,
    ];

    for (const colSql of columnsToEnsure) {
      await pool.query(colSql).catch((colErr) => {
        console.warn('Column migration note:', colErr.message);
      });
    }

    console.log('Database schema verification and auto-migration completed.');
  } catch (err) {
    console.error('Error verifying database schema:', err);
  }
}


