import { Elysia, t, Context } from 'elysia';
import { jwt } from '@elysiajs/jwt';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RegisterDTO {
  email: string;
  password: string;
  fullName: string;
  userType: 'DIETITIAN' | 'PSYCHOLOGIST' | 'CLIENT';
}

interface LoginDTO {
  email: string;
  password: string;
}

export class AuthController {
  private app: Elysia;

  constructor() {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET tanımlı değil!");
    }

    this.app = new Elysia()
      .use(
        jwt({
          name: "jwt", // Elysia'nın middleware'i tanıyabilmesi için name eklenmeli
          secret: process.env.JWT_SECRET,
        })
      )
      .post(
        '/register',
        async ({ body }: { body: RegisterDTO }) => {
          const { email, password, fullName, userType } = body;

          const existingUser = await prisma.user.findUnique({
            where: { email },
          });

          if (existingUser) {
            throw new Error('Bu email adresi zaten kayıtlı');
          }

          const hashedPassword = await bcrypt.hash(password, 10);

          const user = await prisma.user.create({
            data: {
              email,
              password: hashedPassword,
              fullName,
              userType,
            },
          });

          return {
            message: 'Kullanıcı başarıyla oluşturuldu',
            userId: user.id,
          };
        },
        {
          body: t.Object({
            email: t.String({ format: 'email' }),
            password: t.String({ minLength: 6 }),
            fullName: t.String(),
            userType: t.Enum({
              DIETITIAN: 'DIETITIAN',
              PSYCHOLOGIST: 'PSYCHOLOGIST',
              CLIENT: 'CLIENT',
            }),
          }),
        }
      )
      .post(
        '/login',
        async ({ body, jwt }: { body: LoginDTO; jwt: any }) => {
          const { email, password } = body;

          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user) {
            throw new Error('Kullanıcı bulunamadı');
          }

          const validPassword = await bcrypt.compare(password, user.password);

          if (!validPassword) {
            throw new Error('Geçersiz şifre');
          }

          const token = await jwt.sign({
            userId: user.id,
            email: user.email,
            userType: user.userType,
          });

          return {
            token,
            user: {
              id: user.id,
              email: user.email,
              fullName: user.fullName,
              userType: user.userType,
            },
          };
        },
        {
          body: t.Object({
            email: t.String({ format: 'email' }),
            password: t.String(),
          }),
        }
      )
      .get(
        '/me',
        async ({ jwt, headers }: { jwt: any; headers: { authorization?: string } }) => {
          const authHeader = headers.authorization;

          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new Error('Yetkilendirme başarısız');
          }

          const token = authHeader.split(' ')[1];
          const payload = await jwt.verify(token);

          if (!payload) {
            throw new Error('Geçersiz token');
          }

          const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: {
              id: true,
              email: true,
              fullName: true,
              userType: true,
            },
          });

          return user;
        }
      );
  }

  getApp() {
    return this.app;
  }
}
