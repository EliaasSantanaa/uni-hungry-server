import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

const mockDashboardService = {
  getStats: jest.fn(),
  getRestaurantsOverview: jest.fn(),
};

describe('DashboardController', () => {
  let controller: DashboardController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [{ provide: DashboardService, useValue: mockDashboardService }],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
    jest.clearAllMocks();
  });

  describe('getStats', () => {
    it('deve chamar dashboardService.getStats', async () => {
      mockDashboardService.getStats.mockResolvedValue({ totalCustomers: 10 });
      const result = await controller.getStats();
      expect(mockDashboardService.getStats).toHaveBeenCalled();
      expect(result).toEqual({ totalCustomers: 10 });
    });
  });

  describe('getRestaurants', () => {
    it('deve chamar dashboardService.getRestaurantsOverview', async () => {
      mockDashboardService.getRestaurantsOverview.mockResolvedValue([{ id: 'r1' }]);
      const result = await controller.getRestaurants();
      expect(mockDashboardService.getRestaurantsOverview).toHaveBeenCalled();
      expect(result).toEqual([{ id: 'r1' }]);
    });
  });
});
