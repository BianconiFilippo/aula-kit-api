CREATE TABLE "bloques" (
	"id" serial PRIMARY KEY NOT NULL,
	"progresion_id" integer NOT NULL,
	"aprendizaje_y_contenido" text NOT NULL,
	"indicadores_de_logro" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "progresiones" (
	"id" serial PRIMARY KEY NOT NULL,
	"nivel" text NOT NULL,
	"ciclo_grado" text NOT NULL,
	"espacio_curricular" text NOT NULL,
	"meta_proposito" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bloques" ADD CONSTRAINT "bloques_progresion_id_progresiones_id_fk" FOREIGN KEY ("progresion_id") REFERENCES "public"."progresiones"("id") ON DELETE cascade ON UPDATE no action;