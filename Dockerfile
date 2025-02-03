FROM node:18-alpine

WORKDIR /app

# Package dosyalarını kopyala
COPY package*.json ./
COPY prisma ./prisma/
COPY .env .env

# Bağımlılıkları yükle
RUN npm install --legacy-peer-deps

# TypeScript kaynak kodlarını kopyala
COPY . .

# TypeScript'i derle
RUN npm run build

# Prisma client'ı oluştur
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "start"] 