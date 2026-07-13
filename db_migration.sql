-- Habilitar extensión uuid-ossp si no está habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Crear ENUMS según la especificación
CREATE TYPE trimestre_enum AS ENUM ('1', '2', '3');
CREATE TYPE color_unidad_enum AS ENUM ('teal', 'blue', 'amber', 'coral', 'purple', 'pink', 'green');
CREATE TYPE capacidad_mcc_enum AS ENUM ('oralidad', 'pensamiento_critico', 'resolucion_problemas', 'trabajo_colaborativo', 'tecnologias', 'ed_ambiental');
CREATE TYPE tipo_contenido_tema_enum AS ENUM ('conceptual', 'procedimental', 'actitudinal', 'mixto');
CREATE TYPE evaluacion_tema_enum AS ENUM ('observacion', 'tp', 'escrita', 'oral', 'sin_evaluacion');
CREATE TYPE modalidad_clase_enum AS ENUM ('individual', 'grupal', 'plenario', 'mixta');
CREATE TYPE estado_clase_nuevo_enum AS ENUM ('planificada', 'dada', 'cancelada', 'postergada');

-- 2. Crear tabla Unidades
CREATE TABLE IF NOT EXISTS unidades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    libro_tema_id UUID NOT NULL REFERENCES libros_temas(id) ON DELETE CASCADE,
    nombre VARCHAR(120) NOT NULL,
    trimestre trimestre_enum NOT NULL,
    semanas_estimadas INT CHECK (semanas_estimadas BETWEEN 1 AND 16),
    color color_unidad_enum,
    objetivos TEXT,
    aprendizaje_pda TEXT,
    meta_ciclo_pda TEXT,
    capacidades_mcc capacidad_mcc_enum[] DEFAULT '{}',
    orden INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Crear tabla Temas
CREATE TABLE IF NOT EXISTS temas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unidad_id UUID NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
    nombre VARCHAR(120) NOT NULL,
    tipo_contenido tipo_contenido_tema_enum NOT NULL,
    clases_estimadas INT CHECK (clases_estimadas BETWEEN 1 AND 20),
    evaluacion evaluacion_tema_enum NOT NULL DEFAULT 'sin_evaluacion',
    indicador_logro TEXT,
    observaciones TEXT,
    orden INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Crear tabla Clases
CREATE TABLE IF NOT EXISTS clases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tema_id UUID NOT NULL REFERENCES temas(id) ON DELETE CASCADE,
    titulo VARCHAR(120) NOT NULL,
    fecha_estimada DATE,
    modalidad modalidad_clase_enum NOT NULL,
    estado estado_clase_nuevo_enum NOT NULL DEFAULT 'planificada',
    novedades TEXT,
    orden INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
