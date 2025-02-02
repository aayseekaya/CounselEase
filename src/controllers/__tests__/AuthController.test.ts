import { AuthController } from '../AuthController';
import { prismaMock } from '../../test/setup';
import bcrypt from 'bcrypt';

describe('AuthController', () => {
  let authController: AuthController;

  beforeEach(() => {
    authController = new AuthController();
  });

  describe('register', () => {
    const mockUser = {
      email: 'test@example.com',
      password: 'password123',
      fullName: 'Test User',
      userType: 'CLIENT',
    };

    it('başarılı kullanıcı kaydı yapmalı', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({
        id: '1',
        ...mockUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await authController.getApp().handle({
        method: 'POST',
        path: '/register',
        body: mockUser,
      });

      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('userId');
    });

    it('var olan email ile kayıt yapılmamalı', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: '1',
        ...mockUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        authController.getApp().handle({
          method: 'POST',
          path: '/register',
          body: mockUser,
        })
      ).rejects.toThrow('Bu email adresi zaten kayıtlı');
    });
  });

  describe('login', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      password: bcrypt.hashSync('password123', 10),
      fullName: 'Test User',
      userType: 'CLIENT',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('geçerli kimlik bilgileriyle giriş yapmalı', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const result = await authController.getApp().handle({
        method: 'POST',
        path: '/login',
        body: {
          email: 'test@example.com',
          password: 'password123',
        },
      });

      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('token');
    });

    it('yanlış şifre ile giriş yapılmamalı', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        authController.getApp().handle({
          method: 'POST',
          path: '/login',
          body: {
            email: 'test@example.com',
            password: 'wrongpassword',
          },
        })
      ).rejects.toThrow('Geçersiz şifre');
    });
  });
});