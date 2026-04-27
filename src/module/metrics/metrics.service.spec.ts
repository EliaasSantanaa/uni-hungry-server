import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { PrismaService } from 'src/database/prisma.service';
import { UserRole } from 'generated/prisma/client';

const mockDb = {
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
};

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetricsService,
        { provide: PrismaService, useValue: mockDb },
      ],
    }).compile();

    service = module.get<MetricsService>(MetricsService);
    jest.clearAllMocks();
  });

  describe('getUsersList', () => {
    it('deve retornar lista de usuários simplificada', async () => {
      mockDb.user.findMany.mockResolvedValue([
        {
          id: '1',
          name: 'João',
          email: 'joao@test.com',
          role: UserRole.MANAGER,
          restaurantId: 'r1',
          restaurant: { id: 'r1', name: 'Restaurante do João' },
        },
      ]);

      const result = await service.getUsersList();
      expect(result).toHaveLength(1);
      expect(result[0].restaurantName).toBe('Restaurante do João');
      expect(result[0].hasRestaurant).toBe(true);
    });
  });

  describe('getUserMetrics', () => {
    it('lança NotFoundException se usuário não for encontrado', async () => {
      mockDb.user.findUnique.mockResolvedValue(null);
      await expect(service.getUserMetrics('user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('retorna dados sem restaurante se o usuário não possuir um', async () => {
      mockDb.user.findUnique.mockResolvedValue({
        id: '1',
        restaurantId: null,
      });
      const result = await service.getUserMetrics('1');
      expect(result.hasRestaurant).toBe(false);
      expect(result.message).toContain('não possui restaurante');
    });

    it('retorna métricas completas do restaurante do usuário', async () => {
      mockDb.user.findUnique.mockResolvedValue({
        id: '1',
        restaurantId: 'r1',
        restaurant: { id: 'r1', name: 'Restaurante' },
      });
      mockDb.user.findMany.mockResolvedValue([
        { id: '1', role: UserRole.MANAGER, isActive: true, createdAt: new Date() },
        { id: '2', role: UserRole.WAITER, isActive: false, createdAt: new Date() },
      ]);

      const result = await service.getUserMetrics('1');
      expect(result.hasRestaurant).toBe(true);
      expect(result.stats?.totalEmployees).toBe(2);
      expect(result.stats?.activeEmployees).toBe(1);
      expect(result.stats?.inactiveEmployees).toBe(1);
      expect(result.stats?.managers).toBe(1);
      expect(result.stats?.waiters).toBe(1);
    });
  });
});
