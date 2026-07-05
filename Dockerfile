# --- ETAPA 1: Construcción (Builder) ---
# Usamos una imagen ligera de Node
FROM node:20-slim AS builder

# Deshabilitamos la descarga de navegadores de Puppeteer en npm install
ENV PUPPETEER_SKIP_DOWNLOAD=true

# Instalamos openssl (Requerido estrictamente por Prisma)
RUN apt-get update -y && apt-get install -y openssl

# Establecemos la carpeta de trabajo dentro del servidor
WORKDIR /app

# Copiamos los archivos de dependencias y la carpeta de prisma primero
COPY package*.json ./
COPY prisma ./prisma/

# Instalamos TODAS las dependencias (sin descargar Chromium)
RUN npm install

# Generamos el cliente de Prisma (¡Paso crítico para que la BD funcione!)
RUN npx prisma generate

# Copiamos el resto del código de la aplicación (la carpeta src, etc.)
COPY . .

# --- ETAPA 2: Producción (Runner) ---
# Empezamos desde cero con una imagen limpia para que el servidor pese menos
FROM node:20-slim AS runner

# Instalamos openssl y chromium (que instala todas las dependencias nativas requeridas para correrlo)
RUN apt-get update -y && apt-get install -y openssl chromium

# Variables de entorno para Puppeteer
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Copiamos SOLO lo estrictamente necesario desde la Etapa 1
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src
COPY --from=builder /app/index.js ./

# Exponemos el puerto que usará tu API
EXPOSE 3000

# Comando para iniciar la aplicación
# NOTA: Esto asume que en tu package.json tienes un script "start": "node src/index.js" (o server.js)
CMD ["npm", "start"]