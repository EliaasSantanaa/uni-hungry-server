import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

const mockService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    jest.clearAllMocks();
  });

  it('findAll', async () => {
    mockService.findAll.mockResolvedValue({ total: 1 });
    expect(await controller.findAll()).toEqual({ total: 1 });
  });

  it('findOne', async () => {
    mockService.findOne.mockResolvedValue({ id: '1' });
    expect(await controller.findOne('1')).toEqual({ id: '1' });
  });

  it('update', async () => {
    mockService.update.mockResolvedValue({ id: '1' });
    expect(await controller.update('1', {} as any)).toEqual({ id: '1' });
  });

  it('remove', async () => {
    mockService.remove.mockResolvedValue({ success: true });
    expect(await controller.remove('1')).toEqual({ success: true });
  });
});
