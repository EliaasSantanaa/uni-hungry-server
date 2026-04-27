import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

const mockAppService = {
  getHealth: jest.fn(),
};

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: AppService, useValue: mockAppService }],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return health status', async () => {
      const healthStatus = { status: 'ok', timestamp: new Date().toISOString() };
      mockAppService.getHealth.mockResolvedValue(healthStatus);
      expect(await appController.getHealth()).toBe(healthStatus);
    });
  });
});
