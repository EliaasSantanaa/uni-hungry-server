import { Test, TestingModule } from '@nestjs/testing';
import { RestaurantsController } from './restaurants.controller';
import { RestaurantsService } from './restaurants.service';

const mockService = {
  getUserRestaurant: jest.fn(),
  getRestaurantStats: jest.fn(),
  create: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
};

const mockUser = { id: 'u1' };

describe('RestaurantsController', () => {
  let controller: RestaurantsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RestaurantsController],
      providers: [{ provide: RestaurantsService, useValue: mockService }],
    }).compile();

    controller = module.get<RestaurantsController>(RestaurantsController);
    jest.clearAllMocks();
  });

  it('getMyRestaurant', async () => {
    mockService.getUserRestaurant.mockResolvedValue({ hasRestaurant: true });
    expect(await controller.getMyRestaurant(mockUser as any)).toEqual({ hasRestaurant: true });
  });

  it('getMyRestaurantStats', async () => {
    mockService.getRestaurantStats.mockResolvedValue({ stats: {} });
    expect(await controller.getMyRestaurantStats(mockUser as any)).toEqual({ stats: {} });
  });

  it('create', async () => {
    mockService.create.mockResolvedValue({ success: true });
    expect(await controller.create({} as any, mockUser as any)).toEqual({ success: true });
  });

  it('findOne', async () => {
    mockService.findOne.mockResolvedValue({ id: 'r1' });
    expect(await controller.findOne('r1')).toEqual({ id: 'r1' });
  });

  it('update', async () => {
    mockService.update.mockResolvedValue({ success: true });
    expect(await controller.update('r1', {} as any, mockUser as any)).toEqual({ success: true });
  });
});
