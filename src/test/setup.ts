import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

export type MockContext = {
  prisma: DeepMockProxy<PrismaClient>;
};

export type Context = {
  prisma: PrismaClient;
};

export const createMockContext = (): MockContext => {
  return {
    prisma: mockDeep<PrismaClient>(),
  };
};

export const createMockContextWithData = (data: any): MockContext => {
  const context = createMockContext();
  
  // Mock data'yı ayarla
  Object.keys(data).forEach((key) => {
    if (context.prisma[key]) {
      context.prisma[key].findUnique.mockResolvedValue(data[key]);
      context.prisma[key].findFirst.mockResolvedValue(data[key]);
      context.prisma[key].findMany.mockResolvedValue([data[key]]);
    }
  });

  return context;
}; 