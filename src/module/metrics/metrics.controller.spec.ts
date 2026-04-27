import { Test, TestingModule } from '@nestjs/testing';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

const mockMetricsService = {
  getUsersList: jest.fn(),
  getUserMetrics: jest.fn(),
};

describe('MetricsController', () => {
  let controller: MetricsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MetricsController],
      providers: [{ provide: MetricsService, useValue: mockMetricsService }],
    }).compile();

    controller = module.get<MetricsController>(MetricsController);
    jest.clearAllMocks();
  });

  describe('getUsersList', () => {
    it('deve chamar metricsService.getUsersList', async () => {
      mockMetricsService.getUsersList.mockResolvedValue([{ id: '1' }]);
      const result = await controller.getUsersList();
      expect(mockMetricsService.getUsersList).toHaveBeenCalled();
      expect(result).toEqual([{ id: '1' }]);
    });
  });

  describe('getUserMetrics', () => {
    it('deve chamar metricsService.getUserMetrics', async () => {
      mockMetricsService.getUserMetrics.mockResolvedValue({ stats: {} });
      const result = await controller.getUserMetrics('user-1');
      expect(mockMetricsService.getUserMetrics).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({ stats: {} });
    });
  });
});
