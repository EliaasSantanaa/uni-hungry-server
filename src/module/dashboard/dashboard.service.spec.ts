import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from 'src/database/prisma.service';
import { UserRole } from 'generated/prisma/client';

const mockDb = {
  user: { findMany: jest.fn() },
  restaurant: { findMany: jest.fn() },
  menuItem: { count: jest.fn() },
  table: { count: jest.fn() },
  tab: { count: jest.fn(), aggregate: jest.fn() },
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
        {
          id: '1',
          name: 'Admin',
          email: 'admin@test.com',
          role: UserRole.ADMIN,
          isActive: true,
          createdAt: new Date('2026-05-20T10:00:00.000Z'),
        },
        {
          id: '2',
          name: 'Manager',
          email: 'manager@test.com',
          role: UserRole.MANAGER,
          isActive: true,
          createdAt: new Date('2026-05-20T11:00:00.000Z'),
        },
        {
          id: '3',
          name: 'Waiter',
          email: 'waiter@test.com',
          role: UserRole.WAITER,
          isActive: false,
          createdAt: new Date('2026-05-20T12:00:00.000Z'),
        },
      ]);

      mockDb.restaurant.findMany.mockResolvedValue([
        { id: 'r1', isActive: true },
        { id: 'r2', isActive: false },
      ]);

      mockDb.menuItem.count.mockResolvedValueOnce(12);
      mockDb.menuItem.count.mockResolvedValueOnce(9);
      mockDb.table.count.mockResolvedValue(7);
      mockDb.tab.count.mockResolvedValueOnce(4);
      mockDb.tab.count.mockResolvedValueOnce(1);
      mockDb.tab.count.mockResolvedValueOnce(2);
      mockDb.tab.aggregate.mockResolvedValue({ _sum: { totalAmount: 123.45 } });

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
      expect(result.operations).toEqual({
        totalMenuItems: 12,
        availableMenuItems: 9,
        totalTables: 7,
        openTabs: 4,
        closedTabsToday: 1,
        cancelledTabsToday: 2,
        revenueToday: 123.45,
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
          city: 'São Paulo',
          state: 'SP',
          createdAt: new Date('2026-05-20T10:00:00.000Z'),
          _count: { menuItems: 5, tables: 2, employees: 2 },
          employees: [
            { id: 'e1', role: UserRole.MANAGER, isActive: true },
            { id: 'e2', role: UserRole.WAITER, isActive: false },
          ],
          tables: [{ tabs: [{ id: 't1' }] }, { tabs: [] }],
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
