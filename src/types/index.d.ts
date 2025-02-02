import { jwt } from '@elysiajs/jwt';

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    PORT: string;
    JWT_SECRET: string;
    DATABASE_URL: string;
    STRIPE_SECRET_KEY: string;
    STRIPE_WEBHOOK_SECRET: string;
    KAFKA_BROKERS: string;
    REDIS_URL: string;
    SMTP_HOST: string;
    SMTP_PORT: string;
    SMTP_USER: string;
    SMTP_PASS: string;
    SMTP_FROM: string;
    TWILIO_ACCOUNT_SID: string;
    TWILIO_AUTH_TOKEN: string;
    TWILIO_PHONE_NUMBER: string;
  }
}

// Elysia.js için tip tanımlamaları
declare module '@elysiajs/jwt' {
  interface JWTPayload {
    userId: string;
    email: string;
    userType: string;
  }

  export class jwt {}
}

// Özel tip tanımlamaları
interface User {
  id: string;
  email: string;
  fullName: string;
  userType: UserType;
  createdAt: Date;
  updatedAt: Date;
}

type UserType = 'CLIENT' | 'DIETITIAN' | 'PSYCHOLOGIST';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  features: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface Appointment {
  id: string;
  clientId: string;
  expertId: string;
  startTime: Date;
  endTime: Date;
  status: AppointmentStatus;
  type: AppointmentType;
  notes?: string;
  meetingLink?: string;
  createdAt: Date;
  updatedAt: Date;
}

type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'RESCHEDULED';
type AppointmentType = 'ONLINE' | 'IN_PERSON'; 