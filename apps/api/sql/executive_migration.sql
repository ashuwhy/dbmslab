-- ============================================================
-- Executive table: stores full_name for admin and analyst
-- Run: psql -d your_db -f apps/api/sql/executive_migration.sql
-- ============================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'executive') THEN
        CREATE TABLE executive (
            id SERIAL PRIMARY KEY,
            app_user_id INTEGER NOT NULL REFERENCES app_user(id) ON DELETE CASCADE UNIQUE,
            full_name VARCHAR(100) NOT NULL,
            executive_type VARCHAR(20) NOT NULL CHECK (executive_type IN ('admin', 'analyst')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE INDEX idx_executive_app_user_id ON executive(app_user_id);
        CREATE INDEX idx_executive_type ON executive(executive_type);
        COMMENT ON TABLE executive IS 'Admin and analyst users; stores full_name linked to app_user';
    END IF;
END $$;
