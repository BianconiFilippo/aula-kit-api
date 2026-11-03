import { z } from 'zod';
export declare const EvaluacionBaseSchema: z.ZodObject<{
    titulo: z.ZodString;
    consignas: z.ZodString;
    criterios: z.ZodString;
    materiaId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    titulo: string;
    consignas: string;
    criterios: string;
    materiaId: string;
}, {
    titulo: string;
    consignas: string;
    criterios: string;
    materiaId: string;
}>;
export type EvaluacionBaseInput = z.infer<typeof EvaluacionBaseSchema>;
