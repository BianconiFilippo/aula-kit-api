const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

// NOTA PARA EL INGENIERO/USUARIO:
// En Prisma 7 ("Early Access"/Preview), la propiedad "datasources" ha sido eliminada 
// del constructor de PrismaClient. Lanzará PrismaClientConstructorValidationError si se incluye.
// Además, Prisma 7 ahora REQUIERE el uso de Adapters para Node por defecto.
// La URL ya tiene "&pg_prepared_statements=false" definido gracias al archivo `prisma.config.ts`,
// pero lo aseguramos también en la inicialización nativa de pg.
const rawUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;
const connectionString = rawUrl && !rawUrl.includes('pg_prepared_statements')
  ? `${rawUrl}${rawUrl.includes('?') ? '&' : '?'}pg_prepared_statements=false`
  : rawUrl;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

module.exports = prisma;