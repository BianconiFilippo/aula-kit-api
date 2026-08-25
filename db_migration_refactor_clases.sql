-- Migration SQL for refactoring 'clases' table to a flat spreadsheet model

-- 1. Create or update estado_clase enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_clase') THEN
        CREATE TYPE estado_clase AS ENUM ('Planificada', 'Completada', 'Suspendida');
    END IF;
END $$;

-- 2. Alter 'clases' table structure
ALTER TABLE clases DROP CONSTRAINT IF EXISTS clases_tema_id_fkey;
ALTER TABLE clases DROP COLUMN IF EXISTS tema_id;
ALTER TABLE clases DROP COLUMN IF EXISTS titulo;
ALTER TABLE clases DROP COLUMN IF EXISTS fecha_estimada;
ALTER TABLE clases DROP COLUMN IF EXISTS modalidad;
ALTER TABLE clases DROP COLUMN IF EXISTS novedades;
ALTER TABLE clases DROP COLUMN IF EXISTS orden;

ALTER TABLE clases ADD COLUMN IF NOT EXISTS materia_id UUID REFERENCES materias(id) ON DELETE CASCADE;
ALTER TABLE clases ADD COLUMN IF NOT EXISTS fecha DATE;
ALTER TABLE clases ADD COLUMN IF NOT EXISTS numero_clase INT;
ALTER TABLE clases ADD COLUMN IF NOT EXISTS unidad TEXT;
ALTER TABLE clases ADD COLUMN IF NOT EXISTS caracteristica_clase VARCHAR(255);
ALTER TABLE clases ADD COLUMN IF NOT EXISTS tema_dia TEXT;
ALTER TABLE clases ADD COLUMN IF NOT EXISTS actividades_propuestas TEXT;
ALTER TABLE clases ADD COLUMN IF NOT EXISTS estado estado_clase DEFAULT 'Planificada';

-- Create index for query performance on materia_id, fecha, and numero_clase
CREATE INDEX IF NOT EXISTS idx_clases_materia_fecha_numero ON clases(materia_id, fecha, numero_clase);
