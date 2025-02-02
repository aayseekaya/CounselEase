import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { UserType } from '@prisma/client';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            getProfile: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should create a new user', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        userType: UserType.ADMIN,
      };

      const expectedResult = {
        userId: '1',
        message: 'Kullanıcı başarıyla oluşturuldu',
      };

      jest.spyOn(authService, 'register').mockResolvedValue(expectedResult);

      const result = await controller.register(registerDto);
      expect(result).toBe(expectedResult);
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });
  });
}); 