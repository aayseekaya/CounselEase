import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createMockContext, MockContext } from '../../../test/setup';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let mockContext: MockContext;

  beforeEach(async () => {
    mockContext = createMockContext();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockContext.prisma,
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('test-token'),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-secret'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should create a new user', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        userType: 'CLIENT',
      };

      mockContext.prisma.user.findUnique.mockResolvedValue(null);
      mockContext.prisma.user.create.mockResolvedValue({
        id: '1',
        ...registerDto,
        password: await bcrypt.hash(registerDto.password, 10),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('message', 'Kullanıcı başarıyla oluşturuldu');
    });
  });
}); 