import { relations } from 'drizzle-orm';
import { pgTable, serial, text, integer, jsonb } from 'drizzle-orm/pg-core';

export const progresiones = pgTable('progresiones', {
  id: serial('id').primaryKey(),
  nivel: text('nivel').notNull(),
  ciclo_grado: text('ciclo_grado').notNull(),
  espacio_curricular: text('espacio_curricular').notNull(),
  meta_proposito: text('meta_proposito').notNull(),
});

export const bloques = pgTable('bloques', {
  id: serial('id').primaryKey(),
  progresion_id: integer('progresion_id')
    .notNull()
    .references(() => progresiones.id, { onDelete: 'cascade' }),
  aprendizaje_y_contenido: text('aprendizaje_y_contenido').notNull(),
  indicadores_de_logro: jsonb('indicadores_de_logro')
    .$type<string[]>()
    .notNull()
    .default([]),
});

export const progresionesRelations = relations(progresiones, ({ many }) => ({
  bloques: many(bloques),
}));

export const bloquesRelations = relations(bloques, ({ one }) => ({
  progresion: one(progresiones, {
    fields: [bloques.progresion_id],
    references: [progresiones.id],
  }),
}));
