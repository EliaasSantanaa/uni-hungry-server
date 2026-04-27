import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from 'generated/prisma/client';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

// ──────────────────────────────────────────────
// Mock do AuthService — apenas stub de retornos
// ──────────────────────────────────────────────

const mockAuthService = {
  signUp: jest.fn(),
  signIn: jest.fn(),
  verifyOtp: jest.fn(),
  listMyEmployees: jest.fn(),
  createEmployee: jest.fn(),
  updateEmployeeStatus: jest.fn(),
  updateEmployee: jest.fn(),
};

const mockUser = { id: 'user-uuid-1', email: 'mgr@test.com', role: UserRole.MANAGER };

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  // ── signUp ─────────────────────────────────────────────────────────────────
  describe('signUp', () => {
    it('deve chamar authService.signUp e retornar o resultado', async () => {
      const dto = { email: 'new@test.com', name: 'Novo', phone: null, role: UserRole.MANAGER };
      const serviceResult = { success: true, user: { id: 'x', email: 'new@test.com' } };
      mockAuthService.signUp.mockResolvedValue(serviceResult);

      const result = await controller.signUp(dto as any);

      expect(mockAuthService.signUp).toHaveBeenCalledWith(dto);
      expect(result).toEqual(serviceResult);
    });
  });

  // ── signIn ─────────────────────────────────────────────────────────────────
  describe('signIn', () => {
    it('deve chamar authService.signIn com o DTO correto', async () => {
      const dto = { email: 'mgr@test.com' };
      mockAuthService.signIn.mockResolvedValue({ success: true });

      const result = await controller.signIn(dto as any);

      expect(mockAuthService.signIn).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ success: true });
    });
  });

  // ── verifyOtp ──────────────────────────────────────────────────────────────
  describe('verifyOtp', () => {
    it('deve chamar authService.verifyOtp e retornar token', async () => {
      const dto = { email: 'mgr@test.com', code: '123456' };
      const serviceResult = { success: true, access_token: 'jwt', user: mockUser };
      mockAuthService.verifyOtp.mockResolvedValue(serviceResult);

      const result = await controller.verifyOtp(dto as any);

      expect(mockAuthService.verifyOtp).toHaveBeenCalledWith(dto);
      expect(result).toEqual(serviceResult);
    });
  });

  // ── getEmployees ───────────────────────────────────────────────────────────
  describe('getEmployees', () => {
    it('deve chamar authService.listMyEmployees com o id do usuário', async () => {
      const serviceResult = { success: true, total: 1, employees: [] };
      mockAuthService.listMyEmployees.mockResolvedValue(serviceResult);

      const result = await controller.getEmployees(mockUser as any);

      expect(mockAuthService.listMyEmployees).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(serviceResult);
    });
  });

  // ── createEmployee ─────────────────────────────────────────────────────────
  describe('createEmployee', () => {
    it('deve chamar authService.createEmployee com dto e userId', async () => {
      const dto = { email: 'waiter@test.com', name: 'Garçom', role: UserRole.WAITER };
      const serviceResult = { success: true, employee: {} };
      mockAuthService.createEmployee.mockResolvedValue(serviceResult);

      const result = await controller.createEmployee(dto as any, mockUser as any);

      expect(mockAuthService.createEmployee).toHaveBeenCalledWith(dto, mockUser.id);
      expect(result).toEqual(serviceResult);
    });
  });

  // ── updateEmployeeStatus ───────────────────────────────────────────────────
  describe('updateEmployeeStatus', () => {
    it('deve chamar authService.updateEmployeeStatus com os parâmetros corretos', async () => {
      const dto = { isActive: false };
      const serviceResult = { success: true, employee: {} };
      mockAuthService.updateEmployeeStatus.mockResolvedValue(serviceResult);

      const result = await controller.updateEmployeeStatus(
        'emp-uuid-1',
        dto as any,
        mockUser as any,
      );

      expect(mockAuthService.updateEmployeeStatus).toHaveBeenCalledWith(
        'emp-uuid-1',
        dto,
        mockUser.id,
      );
      expect(result).toEqual(serviceResult);
    });
  });

  // ── updateEmployee ─────────────────────────────────────────────────────────
  describe('updateEmployee', () => {
    it('deve chamar authService.updateEmployee com os parâmetros corretos', async () => {
      const dto = { name: 'Novo Nome' };
      const serviceResult = { success: true, employee: { name: 'Novo Nome' } };
      mockAuthService.updateEmployee.mockResolvedValue(serviceResult);

      const result = await controller.updateEmployee(
        'emp-uuid-1',
        dto as any,
        mockUser as any,
      );

      expect(mockAuthService.updateEmployee).toHaveBeenCalledWith(
        'emp-uuid-1',
        dto,
        mockUser.id,
      );
      expect(result).toEqual(serviceResult);
    });
  });
});
