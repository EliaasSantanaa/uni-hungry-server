import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from 'generated/prisma/client';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/database/prisma.service';
import { SupabaseService } from './services/supabase.service';
import { ResendService } from '../resend/resend.service';

// ──────────────────────────────────────────────
// Factories de dados de teste
// ──────────────────────────────────────────────

const makeUser = (overrides = {}) => ({
  id: 'user-uuid-1',
  email: 'manager@test.com',
  name: 'Test Manager',
  phone: null,
  role: UserRole.MANAGER,
  isActive: true,
  restaurantId: 'rest-uuid-1',
  restaurant: { id: 'rest-uuid-1', name: 'Restaurante Teste' },
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const makeEmployee = (overrides = {}) => ({
  id: 'emp-uuid-1',
  email: 'waiter@test.com',
  name: 'Test Waiter',
  phone: null,
  role: UserRole.WAITER,
  isActive: true,
  restaurantId: 'rest-uuid-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// ──────────────────────────────────────────────
// Mocks
// ──────────────────────────────────────────────

const mockDb = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

const mockSupabase = {
  sendOtp: jest.fn(),
  verifyOtp: jest.fn(),
  createUser: jest.fn(),
  setUserActiveStatus: jest.fn(),
};

const mockResend = {
  sendWelcomeEmail: jest.fn(),
};

const mockJwt = {
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
};

// ──────────────────────────────────────────────
// Suite principal
// ──────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockDb },
        { provide: SupabaseService, useValue: mockSupabase },
        { provide: ResendService, useValue: mockResend },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  // ── signIn ────────────────────────────────────────────────────────────────
  describe('signIn', () => {
    it('deve chamar supabaseService.sendOtp com o email correto', async () => {
      mockSupabase.sendOtp.mockResolvedValue({ success: true });
      await service.signIn({ email: 'manager@test.com' });
      expect(mockSupabase.sendOtp).toHaveBeenCalledWith('manager@test.com');
    });
  });

  // ── verifyOtp ─────────────────────────────────────────────────────────────
  describe('verifyOtp', () => {
    const dto = { email: 'manager@test.com', code: '123456' };

    it('deve lançar UnauthorizedException quando OTP for inválido', async () => {
      mockSupabase.verifyOtp.mockResolvedValue({ success: false });
      await expect(service.verifyOtp(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('deve lançar UnauthorizedException quando usuário não existir no DB', async () => {
      mockSupabase.verifyOtp.mockResolvedValue({ success: true });
      mockDb.user.findUnique.mockResolvedValue(null);
      await expect(service.verifyOtp(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('deve lançar UnauthorizedException quando usuário estiver inativo', async () => {
      mockSupabase.verifyOtp.mockResolvedValue({ success: true });
      mockDb.user.findUnique.mockResolvedValue(makeUser({ isActive: false }));
      await expect(service.verifyOtp(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('deve retornar access_token e dados do usuário em caso de sucesso', async () => {
      mockSupabase.verifyOtp.mockResolvedValue({ success: true });
      mockDb.user.findUnique.mockResolvedValue(makeUser());
      mockJwt.sign.mockReturnValue('signed-token');

      const result = await service.verifyOtp(dto);

      expect(result).toMatchObject({
        success: true,
        access_token: 'signed-token',
        user: expect.objectContaining({ email: 'manager@test.com' }),
      });
    });
  });

  // ── signUp ────────────────────────────────────────────────────────────────
  describe('signUp', () => {
    const dto = {
      email: 'new@test.com',
      name: 'Novo Usuário',
      phone: '11999999999',
      role: UserRole.MANAGER,
    };

    it('deve lançar ConflictException se email já cadastrado', async () => {
      mockDb.user.findUnique.mockResolvedValue(makeUser());
      await expect(service.signUp(dto)).rejects.toThrow(ConflictException);
    });

    it('deve lançar BadRequestException se Supabase falhar', async () => {
      mockDb.user.findUnique.mockResolvedValue(null);
      mockSupabase.createUser.mockResolvedValue({
        success: false,
        error: 'Erro supabase',
      });
      await expect(service.signUp(dto)).rejects.toThrow(BadRequestException);
    });

    it('deve criar usuário com sucesso e retornar dados corretos', async () => {
      mockDb.user.findUnique.mockResolvedValue(null);
      mockSupabase.createUser.mockResolvedValue({
        success: true,
        userId: 'supa-uuid',
      });
      mockDb.user.create.mockResolvedValue(
        makeUser({ id: 'supa-uuid', email: 'new@test.com' }),
      );
      mockResend.sendWelcomeEmail.mockResolvedValue(undefined);

      const result = await service.signUp(dto);

      expect(result.success).toBe(true);
      expect(result.user.email).toBe('new@test.com');
      expect(mockDb.user.create).toHaveBeenCalledTimes(1);
    });

    it('não deve falhar se o envio de e-mail de boas-vindas der erro', async () => {
      mockDb.user.findUnique.mockResolvedValue(null);
      mockSupabase.createUser.mockResolvedValue({
        success: true,
        userId: 'supa-uuid',
      });
      mockDb.user.create.mockResolvedValue(makeUser({ email: 'new@test.com' }));
      mockResend.sendWelcomeEmail.mockRejectedValue(new Error('SMTP error'));

      // Não deve lançar exceção
      await expect(service.signUp(dto)).resolves.toBeDefined();
    });
  });

  // ── listMyEmployees ───────────────────────────────────────────────────────
  describe('listMyEmployees', () => {
    it('deve lançar NotFoundException se usuário logado não existir', async () => {
      mockDb.user.findUnique.mockResolvedValue(null);
      await expect(service.listMyEmployees('user-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar ForbiddenException se usuário estiver inativo', async () => {
      mockDb.user.findUnique.mockResolvedValue(makeUser({ isActive: false }));
      await expect(service.listMyEmployees('user-id')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('deve lançar ForbiddenException se usuário não tiver restaurante', async () => {
      mockDb.user.findUnique.mockResolvedValue(
        makeUser({ restaurantId: null }),
      );
      await expect(service.listMyEmployees('user-id')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('deve retornar lista de funcionários com sucesso', async () => {
      mockDb.user.findUnique.mockResolvedValue(makeUser());
      mockDb.user.findMany.mockResolvedValue([makeEmployee()]);

      const result = await service.listMyEmployees('user-uuid-1');

      expect(result.success).toBe(true);
      expect(result.total).toBe(1);
      expect(result.employees).toHaveLength(1);
    });
  });

  // ── createEmployee ────────────────────────────────────────────────────────
  describe('createEmployee', () => {
    const dto = {
      email: 'waiter@test.com',
      name: 'Garçom',
      phone: null,
      role: UserRole.WAITER,
    };

    beforeEach(() => {
      mockDb.user.findUnique
        .mockResolvedValueOnce(makeUser()) // getCurrentUser
        .mockResolvedValueOnce(null); // email check
    });

    it('deve lançar BadRequestException se role for inválida (ADMIN)', async () => {
      mockDb.user.findUnique.mockReset();
      mockDb.user.findUnique.mockResolvedValueOnce(makeUser());

      await expect(
        service.createEmployee({ ...dto, role: UserRole.ADMIN }, 'user-uuid-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar ConflictException se email já existir', async () => {
      mockDb.user.findUnique.mockReset();
      mockDb.user.findUnique
        .mockResolvedValueOnce(makeUser())
        .mockResolvedValueOnce(makeEmployee());

      await expect(
        service.createEmployee(dto, 'user-uuid-1'),
      ).rejects.toThrow(ConflictException);
    });

    it('deve criar funcionário com sucesso', async () => {
      mockSupabase.createUser.mockResolvedValue({
        success: true,
        userId: 'emp-supa-uuid',
      });
      mockDb.user.create.mockResolvedValue(makeEmployee());
      mockResend.sendWelcomeEmail.mockResolvedValue(undefined);

      const result = await service.createEmployee(dto, 'user-uuid-1');

      expect(result.success).toBe(true);
      expect(result.employee).toBeDefined();
    });
  });

  // ── updateEmployeeStatus ──────────────────────────────────────────────────
  describe('updateEmployeeStatus', () => {
    it('deve lançar NotFoundException se funcionário não existir', async () => {
      mockDb.user.findUnique
        .mockResolvedValueOnce(makeUser()) // currentUser
        .mockResolvedValueOnce(null); // employee

      await expect(
        service.updateEmployeeStatus(
          'emp-uuid-999',
          { isActive: false },
          'user-uuid-1',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar ForbiddenException se funcionário for de outro restaurante', async () => {
      mockDb.user.findUnique
        .mockResolvedValueOnce(makeUser())
        .mockResolvedValueOnce(makeEmployee({ restaurantId: 'outro-rest' }));

      await expect(
        service.updateEmployeeStatus(
          'emp-uuid-1',
          { isActive: false },
          'user-uuid-1',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('deve lançar BadRequestException ao tentar alterar o próprio status', async () => {
      const user = makeUser();
      mockDb.user.findUnique
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce({ ...makeEmployee(), id: user.id });

      await expect(
        service.updateEmployeeStatus(user.id, { isActive: false }, user.id),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve atualizar status com sucesso', async () => {
      mockDb.user.findUnique
        .mockResolvedValueOnce(makeUser())
        .mockResolvedValueOnce(makeEmployee());

      mockSupabase.setUserActiveStatus.mockResolvedValue({ success: true });
      mockDb.user.update.mockResolvedValue(makeEmployee({ isActive: false }));

      const result = await service.updateEmployeeStatus(
        'emp-uuid-1',
        { isActive: false },
        'user-uuid-1',
      );

      expect(result.success).toBe(true);
    });
  });

  // ── updateEmployee ────────────────────────────────────────────────────────
  describe('updateEmployee', () => {
    it('deve lançar NotFoundException se funcionário não existir', async () => {
      mockDb.user.findUnique
        .mockResolvedValueOnce(makeUser())
        .mockResolvedValueOnce(null);

      await expect(
        service.updateEmployee('emp-uuid-999', { name: 'Novo Nome' }, 'user-uuid-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException se nenhum campo for informado', async () => {
      mockDb.user.findUnique
        .mockResolvedValueOnce(makeUser())
        .mockResolvedValueOnce(makeEmployee());

      await expect(
        service.updateEmployee('emp-uuid-1', {}, 'user-uuid-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException se role for inválida', async () => {
      mockDb.user.findUnique
        .mockResolvedValueOnce(makeUser())
        .mockResolvedValueOnce(makeEmployee());

      await expect(
        service.updateEmployee(
          'emp-uuid-1',
          { role: UserRole.ADMIN },
          'user-uuid-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve atualizar funcionário com sucesso', async () => {
      mockDb.user.findUnique
        .mockResolvedValueOnce(makeUser())
        .mockResolvedValueOnce(makeEmployee());

      mockDb.user.update.mockResolvedValue(makeEmployee({ name: 'Novo Nome' }));

      const result = await service.updateEmployee(
        'emp-uuid-1',
        { name: 'Novo Nome' },
        'user-uuid-1',
      );

      expect(result.success).toBe(true);
      expect(result.employee.name).toBe('Novo Nome');
    });
  });
});
