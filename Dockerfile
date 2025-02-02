FROM node:18-alpine

WORKDIR /app

# Package dosyalarını kopyala
COPY package*.json ./
COPY prisma ./prisma/

# Bağımlılıkları yükle
RUN npm install

# TypeScript kaynak kodlarını kopyala
COPY . .

# TypeScript'i derle
RUN npm run build

# Prisma client'ı oluştur
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "start"] 