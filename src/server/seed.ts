import { pool } from '../db/index.ts';

export async function seedInitialGenealogyData() {
  try {
    // Check if people table already exists
    const tableCheck = await pool
      .query(`SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'people' LIMIT 1;`)
      .catch(() => null);

    if (tableCheck && tableCheck.rowCount && tableCheck.rowCount > 0) {
      console.log('Database schema verified (tables exist).');
      return;
    }

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
    `).catch(() => null);

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
    `).catch(() => null);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS photos (
        id serial PRIMARY KEY,
        person_id integer NOT NULL REFERENCES people(id) ON DELETE CASCADE,
        url text NOT NULL,
        caption text,
        is_public boolean DEFAULT true,
        created_at timestamp DEFAULT now()
      );
    `).catch(() => null);

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
    `).catch(() => null);

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
    `).catch(() => null);

    console.log('Database schema verification completed.');
  } catch (err: any) {
    console.log('Note on database schema setup:', err?.message || err);
  }
}


