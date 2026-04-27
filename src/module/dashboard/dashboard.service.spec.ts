import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from 'src/database/prisma.service';
import { UserRole } from 'generated/prisma/client';

const mockDb = {
  user: { findMany: jest.fn() },
  restaurant: { findMany: jest.fn() },
};

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: mockDb },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    jest.clearAllMocks();
  });

  describe('getStats', () => {
    it('deve retornar as estatísticas corretamente', async () => {
      mockDb.user.findMany.mockResolvedValue([
        { id: '1', role: UserRole.ADMIN, isActive: true },
        { id: '2', role: UserRole.MANAGER, isActive: true },
        { id: '3', role: UserRole.WAITER, isActive: false },
      ]);

      mockDb.restaurant.findMany.mockResolvedValue([
        { id: 'r1', isActive: true },
        { id: 'r2', isActive: false },
      ]);

      const result = await service.getStats();

      expect(result.totalCustomers).toBe(3);
      expect(result.activeCustomers).toBe(2);
      expect(result.inactiveCustomers).toBe(1);
      expect(result.totalEmployees).toBe(2); // manager + waiter
      expect(result.totalRestaurants).toBe(2);
      expect(result.activeRestaurants).toBe(1);
      expect(result.customersByRole).toEqual({
        admin: 1,
        manager: 1,
        waiter: 1,
        user: 0,
      });
    });
  });

  describe('getRestaurantsOverview', () => {
    it('deve retornar a visão geral de restaurantes', async () => {
      mockDb.restaurant.findMany.mockResolvedValue([
        {
          id: 'r1',
          name: 'Rest 1',
          isActive: true,
          employees: [
            { id: 'e1', role: UserRole.MANAGER, isActive: true },
            { id: 'e2', role: UserRole.WAITER, isActive: false },
          ],
        },
      ]);

      const result = await service.getRestaurantsOverview();

      expect(result).toHaveLength(1);
      expect(result[0].employeesCount).toBe(2);
      expect(result[0].activeEmployees).toBe(1);
      expect(result[0].owner?.id).toBe('e1');
    });
  });
});
